import httpx
import threading
import time
from typing import Any, Dict, Optional

try:
    from backend.app.config import settings
except ImportError:
    from app.config import settings

class TwelveDataService:
    BASE_URL = "https://api.twelvedata.com"
    _response_cache: Dict[tuple[Any, ...], tuple[float, Dict[str, Any]]] = {}
    _cache_lock = threading.Lock()
    _rate_limit_until = 0.0
    RATE_LIMIT_COOLDOWN_SECONDS = 60

    @staticmethod
    def is_configured() -> bool:
        return bool((settings.TWELVE_DATA_API_KEY or "").strip())

    @staticmethod
    def _symbol_params(ticker: str) -> Dict[str, str]:
        normalized = ticker.strip().upper()
        for suffix, exchange in ((".NS", "NSE"), (".BO", "BSE")):
            if normalized.endswith(suffix):
                return {"symbol": normalized[: -len(suffix)], "exchange": exchange}
        return {"symbol": normalized}

    @classmethod
    async def _get(cls, endpoint: str, ticker: str, **params: Any) -> Dict[str, Any]:
        api_key = (settings.TWELVE_DATA_API_KEY or "").strip()
        if not api_key:
            raise ValueError("TWELVE_DATA_API_KEY is not configured.")

        request_params = {
            **cls._symbol_params(ticker),
            **params,
            "apikey": api_key,
        }
        with cls._cache_lock:
            if time.monotonic() < cls._rate_limit_until:
                raise ValueError("Twelve Data rate limit cooldown is active.")

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{cls.BASE_URL}/{endpoint}",
                    params=request_params,
                )
        except httpx.RequestError as err:
            raise ValueError(
                f"Twelve Data {endpoint} transport error ({type(err).__name__})."
            ) from None

        if response.status_code == 429:
            with cls._cache_lock:
                cls._rate_limit_until = time.monotonic() + cls.RATE_LIMIT_COOLDOWN_SECONDS
            raise ValueError(f"Twelve Data {endpoint} rate limit exceeded (HTTP 429).")
        if response.is_error:
            raise ValueError(
                f"Twelve Data {endpoint} returned HTTP {response.status_code}."
            )
        data = response.json()

        if not isinstance(data, dict):
            raise ValueError(f"Unexpected Twelve Data response for {ticker}.")
        provider_code = data.get("code")
        if (
            data.get("status") == "error"
            or provider_code not in (None, 200, "200")
        ):
            raise ValueError(
                f"Twelve Data {endpoint} error for {ticker}: "
                f"{data.get('message', 'Unknown provider error')}"
            )
        return data

    @classmethod
    async def _get_cached(
        cls,
        endpoint: str,
        ticker: str,
        ttl: int,
        **params: Any,
    ) -> Dict[str, Any]:
        cache_key = (
            endpoint,
            ticker.strip().upper(),
            *sorted(params.items()),
        )
        now = time.monotonic()
        with cls._cache_lock:
            cached = cls._response_cache.get(cache_key)
            if cached and now - cached[0] < ttl:
                return cached[1]

        data = await cls._get(endpoint, ticker, **params)
        with cls._cache_lock:
            cls._response_cache[cache_key] = (time.monotonic(), data)
        return data

    @staticmethod
    async def get_realtime_quote(ticker: str) -> Optional[Dict[str, Any]]:
        return await TwelveDataService._get_cached("quote", ticker, 60)

    @staticmethod
    async def get_historical_charts(ticker: str, interval: str = "1day", outputsize: int = 30) -> Optional[Dict[str, Any]]:
        return await TwelveDataService._get_cached(
            "time_series",
            ticker,
            600,
            interval=interval,
            outputsize=outputsize,
        )

    @staticmethod
    async def get_statistics(ticker: str) -> Optional[Dict[str, Any]]:
        return await TwelveDataService._get_cached("statistics", ticker, 3600)
