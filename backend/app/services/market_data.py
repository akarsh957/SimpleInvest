import asyncio
import logging
import math
import random
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

try:
    from backend.app.schemas.asset import AssetMetrics
    from backend.app.schemas.market import (
        MarketTrendItem,
        MarketTrendsResponse,
        ChartPoint,
        AIForecastInsights,
        StockForecastResponse,
    )
    from backend.app.services.twelve_data import TwelveDataService
except ImportError:
    from app.schemas.asset import AssetMetrics
    from app.schemas.market import (
        MarketTrendItem,
        MarketTrendsResponse,
        ChartPoint,
        AIForecastInsights,
        StockForecastResponse,
    )
    from app.services.twelve_data import TwelveDataService

logger = logging.getLogger(__name__)

WATCHLIST_TICKERS = [
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'BRK-B', 'TSLA', 'LLY', 'AVGO',
    'V', 'JPM', 'UNH', 'WMT', 'MA', 'PG', 'JNJ', 'XOM', 'HD', 'MRK',
    'COST', 'ORCL', 'ABBV', 'CVX', 'CRM', 'BAC', 'KO', 'PEP', 'NFLX', 'AMD',
    'TMO', 'MCD', 'LIN', 'ABT', 'CSCO', 'ACN', 'INTU', 'IBM', 'QCOM', 'GE',
    'CAT', 'TXN', 'NOW', 'AMAT', 'DIS', 'PFE', 'UBER', 'DHR', 'VZ', 'PM',
    'AXP', 'ISRG', 'NKE', 'COP', 'SPGI', 'SYK', 'UNP', 'HON', 'LRCX', 'T',
    'RTX', 'LOW', 'NEE', 'BKNG', 'ELV', 'MDT', 'PGR', 'TJX', 'GS', 'C',
    'BA', 'UPS', 'BLK', 'SBUX', 'MS', 'BMY', 'PLD', 'MMC', 'CB',
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'TATAMOTORS.NS',
    'SBIN.NS', 'BAJFINANCE.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS', 'HINDUNILVR.NS',
    'AXISBANK.NS', 'ASIANPAINT.NS', 'KOTAKBANK.NS', 'MARUTI.NS', 'SUNPHARMA.NS',
    'ULTRACEMCO.NS', 'TITAN.NS', 'WIPRO.NS', 'NESTLEIND.NS'
]

COMPANIES_META = {
    'NVDA': {'name': 'NVIDIA Corporation', 'sector': 'Technology'},
    'AAPL': {'name': 'Apple Inc.', 'sector': 'Technology'},
    'MSFT': {'name': 'Microsoft Corporation', 'sector': 'Technology'},
    'ACN': {'name': 'Accenture plc', 'sector': 'Technology'},
    'PG': {'name': 'The Procter & Gamble Company', 'sector': 'Consumer Defensive'},
    'TSLA': {'name': 'Tesla, Inc.', 'sector': 'Consumer Cyclical'},
    'GOOGL': {'name': 'Alphabet Inc.', 'sector': 'Technology'},
    'AMZN': {'name': 'Amazon.com, Inc.', 'sector': 'Consumer Cyclical'},
    'META': {'name': 'Meta Platforms, Inc.', 'sector': 'Technology'},
    'NFLX': {'name': 'Netflix, Inc.', 'sector': 'Communication Services'},
    'AMD': {'name': 'Advanced Micro Devices, Inc.', 'sector': 'Technology'},
    'INTC': {'name': 'Intel Corporation', 'sector': 'Technology'},
    'JPM': {'name': 'JPMorgan Chase & Co.', 'sector': 'Financial Services'},
    'V': {'name': 'Visa Inc.', 'sector': 'Financial Services'},
    'WMT': {'name': 'Walmart Inc.', 'sector': 'Consumer Defensive'},
    'JNJ': {'name': 'Johnson & Johnson', 'sector': 'Healthcare'},
    'DIS': {'name': 'The Walt Disney Company', 'sector': 'Communication Services'},
    'TCS.NS': {'name': 'Tata Consultancy Services Limited', 'sector': 'Technology'},
    'INFY.NS': {'name': 'Infosys Limited', 'sector': 'Technology'},
    'WIPRO.NS': {'name': 'Wipro Limited', 'sector': 'Technology'},
    'HDFCBANK.NS': {'name': 'HDFC Bank Limited', 'sector': 'Financial Services'},
    'ICICIBANK.NS': {'name': 'ICICI Bank Limited', 'sector': 'Financial Services'},
    'AXISBANK.NS': {'name': 'Axis Bank Limited', 'sector': 'Financial Services'},
    'KOTAKBANK.NS': {'name': 'Kotak Mahindra Bank Limited', 'sector': 'Financial Services'},
    'SBIN.NS': {'name': 'State Bank of India', 'sector': 'Financial Services'},
    'BAJFINANCE.NS': {'name': 'Bajaj Finance Limited', 'sector': 'Financial Services'},
    'BHARTIARTL.NS': {'name': 'Bharti Airtel Limited', 'sector': 'Communication Services'},
    'RELIANCE.NS': {'name': 'Reliance Industries Limited', 'sector': 'Energy'},
    'TATAMOTORS.NS': {'name': 'Tata Motors Limited', 'sector': 'Consumer Cyclical'},
    'MARUTI.NS': {'name': 'Maruti Suzuki India Limited', 'sector': 'Consumer Cyclical'},
    'ITC.NS': {'name': 'ITC Limited', 'sector': 'Consumer Defensive'},
    'HINDUNILVR.NS': {'name': 'Hindustan Unilever Limited', 'sector': 'Consumer Defensive'},
    'NESTLEIND.NS': {'name': 'Nestle India Limited', 'sector': 'Consumer Defensive'},
    'SUNPHARMA.NS': {'name': 'Sun Pharmaceutical Industries Limited', 'sector': 'Healthcare'},
    'TITAN.NS': {'name': 'Titan Company Limited', 'sector': 'Consumer Cyclical'},
    'LT.NS': {'name': 'Larsen & Toubro Limited', 'sector': 'Industrials'},
    'ULTRACEMCO.NS': {'name': 'UltraTech Cement Limited', 'sector': 'Materials'},
    'ASIANPAINT.NS': {'name': 'Asian Paints Limited', 'sector': 'Materials'},
}

# Fill curated watchlist entries with their sector rather than treating an
# exchange/market as an industry. Unknown symbols remain explicitly unclassified.
WATCHLIST_SECTORS = {
    'Technology': {
        'AVGO', 'ORCL', 'CRM', 'AMD', 'CSCO', 'ACN', 'INTU', 'IBM', 'QCOM',
        'TXN', 'NOW', 'AMAT', 'LRCX', 'INTC', 'TCS.NS', 'INFY.NS', 'WIPRO.NS',
    },
    'Financial Services': {
        'JPM', 'V', 'MA', 'BAC', 'SPGI', 'AXP', 'GS', 'C', 'BLK', 'MMC', 'CB',
        'MS', 'PGR', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BAJFINANCE.NS',
        'AXISBANK.NS', 'KOTAKBANK.NS',
    },
    'Healthcare': {
        'LLY', 'UNH', 'MRK', 'ABBV', 'TMO', 'ABT', 'ISRG', 'DHR', 'SYK', 'ELV',
        'MDT', 'BMY', 'PFE', 'JNJ', 'SUNPHARMA.NS',
    },
    'Consumer Cyclical': {
        'TSLA', 'AMZN', 'HD', 'MCD', 'NKE', 'BKNG', 'TJX', 'LOW', 'SBUX', 'UBER',
        'TATAMOTORS.NS', 'MARUTI.NS', 'TITAN.NS',
    },
    'Consumer Defensive': {
        'WMT', 'PG', 'COST', 'KO', 'PEP', 'PM', 'EL', 'ITC.NS', 'HINDUNILVR.NS',
        'NESTLEIND.NS',
    },
    'Communication Services': {
        'NFLX', 'DIS', 'VZ', 'T', 'BHARTIARTL.NS',
    },
    'Energy': {'XOM', 'CVX', 'COP', 'RELIANCE.NS'},
    'Industrials': {
        'GE', 'CAT', 'UNP', 'HON', 'BA', 'UPS', 'RTX', 'LT.NS',
    },
    'Materials': {'LIN', 'ULTRACEMCO.NS', 'ASIANPAINT.NS'},
    'Real Estate': {'PLD'},
    'Utilities': {'NEE'},
}

for sector_name, tickers in WATCHLIST_SECTORS.items():
    for ticker in tickers:
        metadata = COMPANIES_META.get(ticker)
        if metadata is None:
            COMPANIES_META[ticker] = {'name': ticker, 'sector': sector_name}
        else:
            metadata['sector'] = sector_name

for t in WATCHLIST_TICKERS:
    if t not in COMPANIES_META:
        COMPANIES_META[t] = {'name': t, 'sector': 'Unclassified'}

_TRENDS_CACHE = None
_TRENDS_CACHE_TIME = 0.0
CACHE_TTL = 600
_GROWTH_METRICS_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
_GROWTH_METRICS_CACHE_LOCK = threading.Lock()


class MarketDataService:
    """
    Service to fetch market data from Twelve Data asynchronously.
    """

    @staticmethod
    def _company_metadata(ticker_symbol: str) -> Dict[str, str]:
        normalized_ticker = ticker_symbol.strip().upper()
        return COMPANIES_META.get(
            normalized_ticker,
            {'name': normalized_ticker, 'sector': 'Unclassified'},
        )

    @classmethod
    async def fetch_current_price(cls, ticker_symbol: str) -> Optional[float]:
        quote = await TwelveDataService.get_realtime_quote(ticker_symbol)
        if not quote:
            return None
        price = quote.get("price") or quote.get("close")
        return float(price) if price is not None else None

    @classmethod
    async def fetch_asset_metrics(cls, ticker_symbol: str) -> AssetMetrics:
        """
        Asynchronously fetch and normalize asset metrics for any global or Indian ticker.
        """
        normalized_ticker = ticker_symbol.strip().upper()
        try:
            info = await TwelveDataService.get_realtime_quote(normalized_ticker) or {}
        except Exception as err:
            logger.warning("Twelve Data quote failed for %s: %s", normalized_ticker, err)
            return cls._generate_fallback_metrics(normalized_ticker, str(err))

        current_price = info.get("price") or info.get("close")
        if current_price is None:
            logger.warning("Twelve Data returned no quote price for %s", normalized_ticker)
            return cls._generate_fallback_metrics(
                normalized_ticker,
                "Twelve Data returned no quote price.",
            )

        metadata = cls._company_metadata(normalized_ticker)
        company_name = info.get("name") or metadata["name"]
        sector = metadata["sector"]
        currency = info.get(
            "currency",
            "INR" if normalized_ticker.endswith((".NS", ".BO")) else "USD",
        )
        fifty_two_week = info.get("fifty_two_week") or {}

        return AssetMetrics(
            ticker=normalized_ticker,
            company_name=company_name,
            sector=sector,
            current_price=round(float(current_price), 2),
            currency=currency,
            fifty_two_week_high=cls._as_optional_float(fifty_two_week.get("high")),
            fifty_two_week_low=cls._as_optional_float(fifty_two_week.get("low")),
        )

    @staticmethod
    def _as_optional_float(value: Any) -> Optional[float]:
        try:
            if value is None:
                return None
            normalized = str(value).strip().replace(",", "")
            if normalized.endswith("%"):
                normalized = normalized[:-1].strip()
            return float(normalized)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _format_volume(vol: int, currency: str) -> str:
        if vol >= 1_000_000_000:
            return f"{vol / 1_000_000_000:.2f}B"
        elif vol >= 1_000_000:
            return f"{vol / 1_000_000:.2f}M"
        elif vol >= 1_000:
            return f"{vol / 1_000:.1f}K"
        return str(vol)

    @classmethod
    async def _fetch_single_trend_item(cls, ticker_symbol: str) -> MarketTrendItem:
        meta = cls._company_metadata(ticker_symbol)
        is_indian = ticker_symbol.endswith(".NS") or ticker_symbol.endswith(".BO")
        currency = "INR" if is_indian else "USD"

        try:
            history = await TwelveDataService.get_historical_charts(
                ticker_symbol,
                interval="1day",
                outputsize=7,
            )
            values = history.get("values", []) if history else []
            ordered_values = sorted(
                values,
                key=lambda item: item.get("datetime", ""),
            )
            prices = [
                round(float(item["close"]), 2)
                for item in ordered_values
                if item.get("close") is not None
            ][-7:]
            current_price = prices[-1] if prices else None
            prev_close = prices[-2] if len(prices) >= 2 else None

            if not current_price or current_price <= 0:
                raise ValueError(f"Twelve Data returned no history for {ticker_symbol}")
            if not prev_close or prev_close <= 0:
                prev_close = current_price * 0.98

            change = current_price - prev_close
            change_pct = (change / prev_close) * 100.0

            volume = int(ordered_values[-1].get("volume") or 0) if ordered_values else 0
            fifty_two_high = round(current_price * 1.15, 2)
            fifty_two_low = round(current_price * 0.85, 2)
            company_name = meta['name']
            sector = meta['sector']

            return MarketTrendItem(
                ticker=ticker_symbol,
                company_name=company_name,
                sector=sector,
                currency=currency,
                current_price=round(float(current_price), 2),
                change=round(float(change), 2),
                change_percent=round(float(change_pct), 2),
                volume=volume,
                volume_formatted=cls._format_volume(volume, currency),
                fifty_two_week_low=round(float(fifty_two_low), 2),
                fifty_two_week_high=round(float(fifty_two_high), 2),
                sparkline=prices,
            )
        except Exception as e:
            logger.warning(
                "Twelve Data trend fetch failed for %s: %s. Using fallback.",
                ticker_symbol,
                e,
            )
            return cls._generate_fallback_trend_item(ticker_symbol)

    @classmethod
    async def fetch_market_trends(cls) -> MarketTrendsResponse:
        """
        Fetches market trends for the curated watchlist asynchronously with full concurrency & fallbacks.
        """
        global _TRENDS_CACHE, _TRENDS_CACHE_TIME
        if _TRENDS_CACHE and (time.time() - _TRENDS_CACHE_TIME < CACHE_TTL):
            return _TRENDS_CACHE

        if not TwelveDataService.is_configured():
            logger.warning("Twelve Data is not configured; returning market trend fallbacks.")
            items = [cls._generate_fallback_trend_item(t) for t in WATCHLIST_TICKERS]
            return cls._build_market_trends_response(items)

        semaphore = asyncio.Semaphore(4)

        async def fetch_trend(ticker: str) -> MarketTrendItem:
            async with semaphore:
                return await cls._fetch_single_trend_item(ticker)

        tasks = [fetch_trend(ticker) for ticker in WATCHLIST_TICKERS]
        
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            items: List[MarketTrendItem] = []
            for ticker, res in zip(WATCHLIST_TICKERS, results):
                if isinstance(res, MarketTrendItem):
                    items.append(res)
                else:
                    items.append(cls._generate_fallback_trend_item(ticker))
        except Exception as e:
            logger.error(f"Global market trends fetch failed: {e}. Returning complete fallback payload.")
            items = [cls._generate_fallback_trend_item(t) for t in WATCHLIST_TICKERS]

        return cls._build_market_trends_response(items)

    @classmethod
    def _build_market_trends_response(
        cls,
        items: List[MarketTrendItem],
    ) -> MarketTrendsResponse:
        global _TRENDS_CACHE, _TRENDS_CACHE_TIME

        gainers = sorted([i for i in items if i.change_percent >= 0], key=lambda x: x.change_percent, reverse=True)
        losers = sorted([i for i in items if i.change_percent < 0], key=lambda x: x.change_percent)
        if not gainers and items:
            gainers = sorted(items, key=lambda x: x.change_percent, reverse=True)[:5]
        if not losers and items:
            losers = sorted(items, key=lambda x: x.change_percent)[:5]

        volume_leaders = sorted(items, key=lambda x: x.volume, reverse=True)

        resp = MarketTrendsResponse(
            all_items=items,
            gainers=gainers,
            losers=losers,
            volume_leaders=volume_leaders,
        )
        _TRENDS_CACHE = resp
        _TRENDS_CACHE_TIME = time.time()
        return resp

    @classmethod
    def _generate_fallback_trend_item(cls, ticker_symbol: str) -> MarketTrendItem:
        meta = cls._company_metadata(ticker_symbol)
        is_indian = ticker_symbol.endswith(".NS") or ticker_symbol.endswith(".BO")
        
        preset_data = {
            'NVDA': (132.50, +4.25, +3.31, 48200000, [124.0, 125.5, 127.1, 126.8, 129.4, 131.0, 132.50]),
            'AAPL': (228.40, +1.80, +0.79, 32100000, [222.0, 224.1, 225.0, 226.5, 225.9, 227.2, 228.40]),
            'MSFT': (445.10, -2.30, -0.51, 19400000, [450.0, 448.2, 449.1, 447.0, 446.5, 447.8, 445.10]),
            'TSLA': (254.30, +12.10, +5.00, 68500000, [230.0, 235.4, 238.1, 242.0, 246.5, 249.0, 254.30]),
            'RELIANCE.NS': (2940.00, +35.50, +1.22, 8500000, [2880.0, 2895.0, 2910.0, 2900.0, 2925.0, 2930.0, 2940.0]),
            'TCS.NS': (3920.00, -18.40, -0.47, 4200000, [3980.0, 3965.0, 3950.0, 3960.0, 3940.0, 3935.0, 3920.0]),
            'HDFCBANK.NS': (1685.00, +14.20, +0.85, 12400000, [1640.0, 1655.0, 1660.0, 1670.0, 1675.0, 1680.0, 1685.0]),
            'INFY.NS': (1840.00, +22.00, +1.21, 6700000, [1790.0, 1805.0, 1815.0, 1820.0, 1830.0, 1835.0, 1840.0]),
            'ICICIBANK.NS': (1215.00, +11.50, +0.95, 9100000, [1180.0, 1190.0, 1195.0, 1200.0, 1205.0, 1210.0, 1215.0]),
            'TATAMOTORS.NS': (965.00, -8.50, -0.87, 11200000, [990.0, 985.0, 980.0, 975.0, 972.0, 970.0, 965.0]),
        }

        if ticker_symbol in preset_data:
            price, change, pct, vol, spark = preset_data[ticker_symbol]
        else:
            price = 500.0 if is_indian else 150.0
            change = 2.5
            pct = 1.67
            vol = 5000000
            spark = [price * 0.95, price * 0.96, price * 0.97, price * 0.98, price * 0.99, price * 0.995, price]

        currency = "INR" if is_indian else "USD"

        return MarketTrendItem(
            ticker=ticker_symbol,
            company_name=meta['name'],
            sector=meta['sector'],
            currency=currency,
            current_price=price,
            change=change,
            change_percent=pct,
            volume=vol,
            volume_formatted=cls._format_volume(vol, currency),
            fifty_two_week_low=round(price * 0.82, 2),
            fifty_two_week_high=round(price * 1.18, 2),
            sparkline=spark,
        )

    @classmethod
    def _find_statistic(cls, payload: Any, *candidate_keys: str) -> Any:
        normalized_candidates = {
            key.lower().replace("_", "").replace("-", "").replace(" ", "")
            for key in candidate_keys
        }
        if isinstance(payload, dict):
            for key, value in payload.items():
                normalized_key = key.lower().replace("_", "").replace("-", "").replace(" ", "")
                if normalized_key in normalized_candidates:
                    if isinstance(value, dict):
                        value = value.get("value") or value.get("current")
                    if not isinstance(value, (dict, list)):
                        return value
            for value in payload.values():
                result = cls._find_statistic(value, *candidate_keys)
                if result is not None:
                    return result
        elif isinstance(payload, list):
            for value in payload:
                result = cls._find_statistic(value, *candidate_keys)
                if result is not None:
                    return result
        return None

    @classmethod
    async def _fetch_growth_metrics_single(cls, ticker_symbol: str) -> Dict[str, Any]:
        meta = COMPANIES_META.get(ticker_symbol, {'name': ticker_symbol, 'sector': 'Technology'})
        try:
            stats = await TwelveDataService.get_statistics(ticker_symbol) or {}
            fwd_pe = cls._find_statistic(stats, "forward_pe", "forward_pe_ratio", "trailing_pe", "pe_ratio")
            peg_ratio = cls._find_statistic(stats, "peg_ratio", "peg_ratio_ttm")
            rev_growth = cls._find_statistic(stats, "revenue_growth", "revenue_growth_ttm", "quarterly_revenue_growth")
            debt_to_equity = cls._find_statistic(stats, "debt_to_equity", "debt_to_equity_ttm")
            market_cap = cls._find_statistic(stats, "market_capitalization", "market_cap")

            return {
                "ticker": ticker_symbol,
                "company_name": cls._find_statistic(stats, "name") or meta['name'],
                "sector": cls._find_statistic(stats, "sector") or meta['sector'],
                "forward_pe": cls._as_optional_float(fwd_pe),
                "peg_ratio": cls._as_optional_float(peg_ratio),
                "quarterly_revenue_growth_pct": cls._as_optional_float(rev_growth),
                "debt_to_equity": cls._as_optional_float(debt_to_equity),
                "market_cap": cls._as_optional_float(market_cap),
            }
        except Exception as e:
            logger.warning("Twelve Data statistics failed for %s: %s", ticker_symbol, e)
            return {
                "ticker": ticker_symbol,
                "company_name": meta['name'],
                "sector": meta['sector'],
                "forward_pe": None,
                "peg_ratio": None,
                "quarterly_revenue_growth_pct": None,
                "debt_to_equity": None,
            }

    @classmethod
    async def fetch_growth_candidates_data(cls, sector_filter: str = "all") -> List[Dict[str, Any]]:
        sector_filter_clean = sector_filter.lower().strip()
        
        candidates = WATCHLIST_TICKERS

        if sector_filter_clean != "all":
            candidates = [
                t for t in candidates 
                if sector_filter_clean in COMPANIES_META.get(t, {}).get('sector', '').lower()
            ]
            
        import random
        # Sample 20 random candidates from the watchlist to keep API responsive and context limit manageable
        if len(candidates) > 20:
            candidates = random.sample(candidates, 20)

        if not TwelveDataService.is_configured():
            logger.warning("Twelve Data is not configured; growth fundamentals are unavailable.")
            return [
                {
                    "ticker": ticker,
                    "company_name": COMPANIES_META.get(ticker, {}).get("name", ticker),
                    "sector": COMPANIES_META.get(ticker, {}).get("sector", "General"),
                    "forward_pe": None,
                    "peg_ratio": None,
                    "quarterly_revenue_growth_pct": None,
                    "debt_to_equity": None,
                }
                for ticker in candidates
            ]

        semaphore = asyncio.Semaphore(4)

        async def fetch_metrics(ticker: str) -> Dict[str, Any]:
            with _GROWTH_METRICS_CACHE_LOCK:
                cached = _GROWTH_METRICS_CACHE.get(ticker)
                if cached and time.time() - cached[0] < CACHE_TTL:
                    return cached[1]

            async with semaphore:
                metrics = await cls._fetch_growth_metrics_single(ticker)
            with _GROWTH_METRICS_CACHE_LOCK:
                _GROWTH_METRICS_CACHE[ticker] = (time.time(), metrics)
            return metrics

        tasks = [fetch_metrics(ticker) for ticker in candidates]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        output = []
        for ticker, res in zip(candidates, results):
            if isinstance(res, dict):
                output.append(res)
            else:
                meta = COMPANIES_META.get(ticker, {'name': ticker, 'sector': 'General'})
                output.append({
                    "ticker": ticker,
                    "company_name": meta['name'],
                    "sector": meta['sector'],
                    "forward_pe": None,
                    "peg_ratio": None,
                    "quarterly_revenue_growth_pct": None,
                    "debt_to_equity": None,
                })
        return output

    @staticmethod
    def _generate_fallback_metrics(ticker_symbol: str, error_msg: str) -> AssetMetrics:
        """
        Generates sensible fallback metrics when data retrieval encounters network issues.
        """
        logger.warning(f"Using fallback data generator for {ticker_symbol} due to: {error_msg}")
        normalized_ticker = ticker_symbol.strip().upper()
        is_indian = normalized_ticker.endswith(".NS") or normalized_ticker.endswith(".BO")
        metadata = MarketDataService._company_metadata(normalized_ticker)
        
        if metadata["sector"] == "Technology":
            pe = 28.5
            beta = 1.15
            price = 3800.0 if is_indian else 220.0
        elif metadata["sector"] == "Financial Services":
            pe = 19.2
            beta = 0.95
            price = 1650.0 if is_indian else 190.0
        elif normalized_ticker == "RELIANCE.NS":
            pe = 24.1
            beta = 1.05
            price = 2950.0
        else:
            sector = metadata["sector"]
            pe = 20.0
            beta = 1.0
            price = 500.0 if is_indian else 100.0

        return AssetMetrics(
            ticker=normalized_ticker,
            company_name=metadata["name"],
            sector=metadata["sector"],
            current_price=price,
            currency="INR" if is_indian else "USD",
            trailing_pe=pe,
            beta=beta,
            fifty_two_week_high=round(price * 1.2, 2),
            fifty_two_week_low=round(price * 0.85, 2),
            dividend_yield=0.015,
            market_cap=50000000000.0
        )

    @classmethod
    async def fetch_stock_chart_and_forecast(
        cls,
        ticker_symbol: str,
        timeframe: str = "6mo",
        forecast_days: int = 30
    ) -> StockForecastResponse:
        """
        Fetches historical price series, current quote, and generates forward-looking
        AI predicted price trajectories and confidence bands.
        """
        normalized_ticker = ticker_symbol.strip().upper()
        
        # Avoid circular imports with ai_engine
        try:
            from backend.app.services.ai_engine import ai_engine
        except ImportError:
            from app.services.ai_engine import ai_engine

        period_map = {
            "1mo": ("1day", 30),
            "3mo": ("1day", 90),
            "6mo": ("1day", 180),
            "1y": ("1day", 365),
            "5y": ("1week", 260),
        }
        interval, outputsize = period_map.get(timeframe, ("1day", 180))
        history_values = []
        quote_data = {}
        if TwelveDataService.is_configured():
            try:
                history_data = await TwelveDataService.get_historical_charts(
                    normalized_ticker,
                    interval=interval,
                    outputsize=outputsize,
                )
                history_values = history_data.get("values", []) if history_data else []
            except Exception as err:
                logger.warning(
                    "Twelve Data history failed for %s: %s.",
                    normalized_ticker,
                    err,
                )
            try:
                quote_data = await TwelveDataService.get_realtime_quote(normalized_ticker) or {}
            except Exception as err:
                logger.warning("Twelve Data quote failed for %s: %s", normalized_ticker, err)

        def _fetch_sync():
            meta = COMPANIES_META.get(normalized_ticker, {'name': normalized_ticker, 'sector': 'Global Asset'})
            is_indian = normalized_ticker.endswith(".NS") or normalized_ticker.endswith(".BO")
            currency = "INR" if is_indian else "USD"

            # Company details
            company_name = quote_data.get("name") or meta['name']
            sector = meta['sector']
            
            raw_points = []
            for item in sorted(
                history_values,
                key=lambda value: value.get("datetime", ""),
            ):
                try:
                    date_value = item["datetime"]
                    dt_obj = datetime.fromisoformat(
                        date_value.replace("Z", "+00:00")
                    )
                    close_val = float(item["close"])
                    vol_val = int(float(item.get("volume") or 0))
                    raw_points.append({
                        "dt": dt_obj,
                        "date": dt_obj.strftime("%Y-%m-%d"),
                        "display_date": dt_obj.strftime("%b %d"),
                        "close": round(close_val, 2),
                        "volume": vol_val
                    })
                except (KeyError, TypeError, ValueError):
                    logger.warning(
                        "Skipping malformed Twelve Data history item for %s",
                        normalized_ticker,
                    )

            # If empty or too few points, generate high-fidelity synthetic past
            if len(raw_points) < 5:
                quote_price = (
                    quote_data.get("price")
                    or quote_data.get("close")
                    or quote_data.get("previous_close")
                )
                base_p = float(quote_price or 100.0)
                if base_p <= 0:
                    base_p = 100.0 if not is_indian else 1500.0
                
                days_count = {"1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "5y": 700}.get(timeframe, 180)
                step = 1 if days_count <= 90 else (2 if days_count <= 180 else 5)
                start_dt = datetime.now() - timedelta(days=days_count)
                
                curr_walk = base_p * 0.90
                raw_points = []
                for d in range(0, days_count, step):
                    curr_dt = start_dt + timedelta(days=d)
                    noise = (random.random() - 0.48) * (base_p * 0.02)
                    curr_walk += noise
                    raw_points.append({
                        "dt": curr_dt,
                        "date": curr_dt.strftime("%Y-%m-%d"),
                        "display_date": curr_dt.strftime("%b %d"),
                        "close": round(max(curr_walk, 5.0), 2),
                        "volume": int(random.randint(1000000, 5000000))
                    })
                # Set last point to base_p
                raw_points[-1]["close"] = round(base_p, 2)

            # Price calculations
            current_price = raw_points[-1]["close"]
            prev_price = raw_points[-2]["close"] if len(raw_points) >= 2 else current_price
            change = round(current_price - prev_price, 2)
            change_pct = round((change / prev_price) * 100.0, 2) if prev_price > 0 else 0.0

            closes = [p["close"] for p in raw_points]
            fifty_two_week = quote_data.get("fifty_two_week") or {}
            fifty_two_low = float(fifty_two_week.get("low") or min(closes) * 0.95)
            fifty_two_high = float(fifty_two_week.get("high") or max(closes) * 1.05)
            pe_ratio = None
            beta = None
            vol_formatted = cls._format_volume(raw_points[-1]["volume"], currency)

            # Calculate 20-period Simple Moving Average
            chart_items: List[ChartPoint] = []
            window = 20
            for i, p in enumerate(raw_points):
                sma = None
                if i >= window - 1:
                    sma = round(sum(closes[i - window + 1 : i + 1]) / window, 2)
                elif i > 3:
                    sma = round(sum(closes[: i + 1]) / (i + 1), 2)

                is_last = (i == len(raw_points) - 1)
                
                chart_items.append(ChartPoint(
                    date=p["date"],
                    display_date=p["display_date"],
                    price=p["close"],
                    historical_price=p["close"],
                    # Bridge point: populate predicted_price at last point so Recharts lines connect seamlessly
                    predicted_price=p["close"] if is_last else None,
                    predicted_upper=p["close"] if is_last else None,
                    predicted_lower=p["close"] if is_last else None,
                    moving_average=sma,
                    volume=p["volume"],
                    is_prediction=False,
                    is_present=is_last
                ))

            recent_momentum = ((current_price - closes[0]) / closes[0]) * 100.0 if closes[0] > 0 else 0.0

            return {
                "ticker": normalized_ticker,
                "company_name": company_name,
                "sector": sector,
                "currency": currency,
                "current_price": current_price,
                "change": change,
                "change_percent": change_pct,
                "fifty_two_week_low": round(fifty_two_low, 2),
                "fifty_two_week_high": round(fifty_two_high, 2),
                "volume_formatted": vol_formatted,
                "pe_ratio": round(pe_ratio, 2) if pe_ratio else None,
                "beta": round(beta, 2) if beta else None,
                "chart_items": chart_items,
                "last_dt": raw_points[-1]["dt"],
                "recent_momentum": recent_momentum
            }

        data_dict = _fetch_sync()

        # Generate AI insights
        ai_insights = await ai_engine.generate_stock_forecast_insights(
            ticker=data_dict["ticker"],
            company_name=data_dict["company_name"],
            sector=data_dict["sector"],
            currency=data_dict["currency"],
            current_price=data_dict["current_price"],
            fifty_two_week_high=data_dict["fifty_two_week_high"],
            fifty_two_week_low=data_dict["fifty_two_week_low"],
            pe_ratio=data_dict["pe_ratio"],
            beta=data_dict["beta"],
            forecast_days=forecast_days,
            recent_momentum_pct=data_dict["recent_momentum"]
        )

        # Generate progressive future predicted trajectory points
        chart_items = data_dict["chart_items"]
        last_dt = data_dict["last_dt"]
        curr_price = data_dict["current_price"]
        target_p = ai_insights.target_price
        bull_p = ai_insights.bull_case_target
        bear_p = ai_insights.bear_case_target

        # Generate 15-18 smooth prediction steps
        step_days = max(1, forecast_days // 15)
        day_milestones = list(range(step_days, forecast_days, step_days))
        if forecast_days not in day_milestones:
            day_milestones.append(forecast_days)

        for day_offset in day_milestones:
            fut_dt = last_dt + timedelta(days=day_offset)
            alpha = day_offset / float(forecast_days)
            
            # Subtle natural curvature in trend line
            wave = math.sin(alpha * math.pi) * (curr_price * 0.006)
            pred_val = curr_price + (target_p - curr_price) * alpha + wave
            
            # Funnel-expanding confidence bounds
            upper_val = curr_price + (bull_p - curr_price) * (alpha ** 0.82)
            lower_val = curr_price + (bear_p - curr_price) * (alpha ** 0.82)

            chart_items.append(ChartPoint(
                date=fut_dt.strftime("%Y-%m-%d"),
                display_date=fut_dt.strftime("%b %d"),
                price=round(pred_val, 2),
                historical_price=None,
                predicted_price=round(pred_val, 2),
                predicted_upper=round(max(upper_val, pred_val), 2),
                predicted_lower=round(min(lower_val, pred_val), 2),
                moving_average=None,
                volume=None,
                is_prediction=True,
                is_present=False
            ))

        return StockForecastResponse(
            ticker=data_dict["ticker"],
            company_name=data_dict["company_name"],
            sector=data_dict["sector"],
            currency=data_dict["currency"],
            current_price=data_dict["current_price"],
            change=data_dict["change"],
            change_percent=data_dict["change_percent"],
            fifty_two_week_low=data_dict["fifty_two_week_low"],
            fifty_two_week_high=data_dict["fifty_two_week_high"],
            volume_formatted=data_dict["volume_formatted"],
            pe_ratio=data_dict["pe_ratio"],
            beta=data_dict["beta"],
            timeframe=timeframe,
            forecast_days=forecast_days,
            chart_data=chart_items,
            ai_insights=ai_insights
        )
