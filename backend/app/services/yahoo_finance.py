import httpx
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class YahooFinanceService:
    """
    Resilient, zero-cost market data provider fallback for real-time quotes,
    52-week ranges, and historical charts without API key requirements.
    """
    BASE_URLS = [
        "https://query1.finance.yahoo.com/v8/finance/chart",
        "https://query2.finance.yahoo.com/v8/finance/chart",
    ]
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json",
    }
    _cache: Dict[str, tuple[float, Dict[str, Any]]] = {}
    CACHE_TTL_QUOTE = 60  # seconds
    CACHE_TTL_CHART = 300  # seconds

    @classmethod
    def _normalize_ticker(cls, ticker: str) -> str:
        symbol = ticker.strip().upper()
        # Yahoo Finance supports standard US symbols and .NS / .BO for Indian exchanges
        return symbol

    @classmethod
    async def _fetch_chart_data(
        cls,
        ticker: str,
        range_param: str = "7d",
        interval_param: str = "1d",
    ) -> Optional[Dict[str, Any]]:
        normalized = cls._normalize_ticker(ticker)
        cache_key = f"{normalized}:{range_param}:{interval_param}"
        now = time.monotonic()
        if cache_key in cls._cache:
            ts, val = cls._cache[cache_key]
            ttl = cls.CACHE_TTL_QUOTE if range_param == "7d" else cls.CACHE_TTL_CHART
            if now - ts < ttl:
                return val

        for base_url in cls.BASE_URLS:
            url = f"{base_url}/{normalized}"
            params = {
                "range": range_param,
                "interval": interval_param,
                "includePrePost": "false",
            }
            try:
                async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                    resp = await client.get(url, params=params, headers=cls.HEADERS)
                    if resp.status_code == 200:
                        data = resp.json()
                        result = data.get("chart", {}).get("result")
                        if result and len(result) > 0:
                            chart_obj = result[0]
                            cls._cache[cache_key] = (now, chart_obj)
                            return chart_obj
                    else:
                        logger.warning(
                            "Yahoo Finance returned %d for %s at %s",
                            resp.status_code,
                            normalized,
                            base_url,
                        )
            except Exception as e:
                logger.warning(
                    "Yahoo Finance request failed for %s at %s: %s",
                    normalized,
                    base_url,
                    e,
                )

        return None

    @classmethod
    async def get_realtime_quote(cls, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Returns a normalized quote dictionary compatible with TwelveData quote structure:
        {
            "symbol": ticker,
            "name": company_name,
            "price": current_price,
            "close": current_price,
            "previous_close": prev_close,
            "change": change,
            "percent_change": pct_change,
            "fifty_two_week": {"high": ..., "low": ...},
            "currency": currency,
            "volume": volume,
            "is_market_open": ...
        }
        """
        chart_obj = await cls._fetch_chart_data(ticker, range_param="7d", interval_param="1d")
        if not chart_obj:
            return None

        meta = chart_obj.get("meta", {})
        price = (
            meta.get("regularMarketPrice")
            or meta.get("chartPreviousClose")
        )
        if price is None:
            # Try to grab the latest close from indicators
            try:
                closes = chart_obj["indicators"]["quote"][0]["close"]
                valid = [c for c in closes if c is not None]
                if valid:
                    price = valid[-1]
            except Exception:
                pass

        if price is None:
            return None

        prev_close = meta.get("chartPreviousClose") or meta.get("previousClose") or price
        change = round(float(price) - float(prev_close), 2)
        pct_change = round((change / float(prev_close)) * 100.0, 2) if prev_close else 0.0

        low_52 = meta.get("fiftyTwoWeekLow") or round(float(price) * 0.82, 2)
        high_52 = meta.get("fiftyTwoWeekHigh") or round(float(price) * 1.18, 2)
        volume = meta.get("regularMarketVolume") or 0

        currency = meta.get("currency")
        if not currency:
            currency = "INR" if ticker.endswith((".NS", ".BO")) else "USD"

        company_name = meta.get("shortName") or meta.get("longName") or ticker

        return {
            "symbol": ticker.strip().upper(),
            "name": company_name,
            "price": round(float(price), 2),
            "close": round(float(price), 2),
            "previous_close": round(float(prev_close), 2),
            "change": change,
            "percent_change": pct_change,
            "fifty_two_week": {
                "low": round(float(low_52), 2),
                "high": round(float(high_52), 2),
            },
            "currency": currency,
            "volume": int(volume),
            "data_source": "live",
        }

    @classmethod
    async def get_historical_charts(
        cls,
        ticker: str,
        interval: str = "1day",
        outputsize: int = 30,
    ) -> Optional[Dict[str, Any]]:
        """
        Returns a dictionary compatible with TwelveData time_series structure:
        {"values": [{"datetime": "YYYY-MM-DD", "close": "123.45", "volume": "500000"}, ...]}
        """
        # Map Twelve Data outputsize / interval to Yahoo Finance range
        if outputsize <= 7:
            range_param = "7d"
        elif outputsize <= 35:
            range_param = "1mo"
        elif outputsize <= 95:
            range_param = "3mo"
        elif outputsize <= 185:
            range_param = "6mo"
        elif outputsize <= 370:
            range_param = "1y"
        else:
            range_param = "5y"

        interval_param = "1wk" if "week" in interval.lower() else "1d"
        chart_obj = await cls._fetch_chart_data(ticker, range_param=range_param, interval_param=interval_param)
        if not chart_obj:
            return None

        timestamps = chart_obj.get("timestamp", [])
        quote_indicators = chart_obj.get("indicators", {}).get("quote", [{}])[0]
        closes = quote_indicators.get("close", [])
        volumes = quote_indicators.get("volume", [])

        values: List[Dict[str, Any]] = []
        for i, ts in enumerate(timestamps):
            if i < len(closes) and closes[i] is not None:
                dt_str = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
                vol_val = volumes[i] if i < len(volumes) and volumes[i] is not None else 0
                values.append({
                    "datetime": dt_str,
                    "close": f"{float(closes[i]):.2f}",
                    "volume": str(int(vol_val)),
                })

        return {"values": values[-outputsize:] if outputsize else values}
