import asyncio
import threading
import time

import pytest

from backend.app.config import settings
from backend.app.services import market_data
from backend.app.services.ai_engine import (
    AIEngineService,
    DEFAULT_GROQ_MODEL,
)


@pytest.mark.parametrize(
    ("configured_model", "expected_model"),
    [
        ("openai/gpt-oss-20b", "openai/gpt-oss-20b"),
        ("openai/gpt-oss-120b", "openai/gpt-oss-120b"),
        ("llama-3.3-70b-versatile", DEFAULT_GROQ_MODEL),
        ("llama-3.1-8b-instant", DEFAULT_GROQ_MODEL),
    ],
)
def test_groq_model_uses_supported_model(
    configured_model, expected_model, monkeypatch, caplog
):
    monkeypatch.setattr(settings, "GROQ_MODEL", configured_model)

    assert AIEngineService().model == expected_model
    if configured_model.startswith("llama-"):
        assert "Unsupported GROQ_MODEL" in caplog.text


def test_growth_metrics_are_rate_limited_and_cached(monkeypatch):
    tickers = ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA", "ORCL"]
    monkeypatch.setattr(market_data, "WATCHLIST_TICKERS", tickers)
    monkeypatch.setattr(market_data, "_GROWTH_METRICS_CACHE", {})
    monkeypatch.setattr(market_data.TwelveDataService, "is_configured", staticmethod(lambda: True))
    state_lock = threading.Lock()
    call_count = 0
    active_calls = 0
    maximum_active_calls = 0

    async def fetch_metrics(ticker):
        nonlocal call_count, active_calls, maximum_active_calls
        with state_lock:
            call_count += 1
            active_calls += 1
            maximum_active_calls = max(maximum_active_calls, active_calls)
        try:
            await asyncio.sleep(0.02)
            return {
                "statistics": {
                    "forward_pe": "28.5",
                    "peg_ratio": "1.2",
                    "revenue_growth": "35.0",
                    "debt_to_equity": "45.0",
                }
            }
        finally:
            with state_lock:
                active_calls -= 1

    monkeypatch.setattr(
        market_data.TwelveDataService,
        "get_statistics",
        staticmethod(fetch_metrics),
    )

    async def fetch_twice():
        first = await market_data.MarketDataService.fetch_growth_candidates_data()
        second = await market_data.MarketDataService.fetch_growth_candidates_data()
        return first, second

    first, second = asyncio.run(fetch_twice())

    assert len(first) == len(tickers)
    assert len(second) == len(tickers)
    assert call_count == len(tickers)
    assert maximum_active_calls <= 4


def test_growth_metrics_are_unavailable_when_provider_fundamentals_fail(monkeypatch):
    monkeypatch.setattr(market_data.TwelveDataService, "is_configured", staticmethod(lambda: True))
    async def raise_provider_error(_ticker):
        raise ValueError("statistics endpoint unavailable")

    monkeypatch.setattr(
        market_data.TwelveDataService,
        "get_statistics",
        staticmethod(raise_provider_error),
    )
    metrics = asyncio.run(
        market_data.MarketDataService._fetch_growth_metrics_single("AAPL")
    )

    assert metrics["ticker"] == "AAPL"
    assert metrics["forward_pe"] is None
    assert metrics["peg_ratio"] is None


@pytest.mark.parametrize(
    ("ticker", "expected"),
    [
        ("AAPL", {"symbol": "AAPL"}),
        ("LT.NS", {"symbol": "LT", "exchange": "NSE"}),
        ("RELIANCE.BO", {"symbol": "RELIANCE", "exchange": "BSE"}),
    ],
)
def test_twelve_data_maps_yahoo_style_exchange_suffix(ticker, expected):
    from backend.app.services.twelve_data import TwelveDataService

    assert TwelveDataService._symbol_params(ticker) == expected


def test_twelve_data_history_requests_time_series(monkeypatch):
    from backend.app.services.twelve_data import TwelveDataService

    calls = []
    payload = {"values": [{"datetime": "2026-01-02", "close": "125.50"}]}

    async def get_cached(endpoint, ticker, ttl, **params):
        calls.append((endpoint, ticker, ttl, params))
        return payload

    monkeypatch.setattr(
        TwelveDataService,
        "_get_cached",
        staticmethod(get_cached),
    )

    result = asyncio.run(
        TwelveDataService.get_historical_charts("AAPL", interval="1day", outputsize=7)
    )

    assert result == payload
    assert calls == [(
        "time_series",
        "AAPL",
        600,
        {"interval": "1day", "outputsize": 7},
    )]


@pytest.mark.parametrize(
    ("ticker", "expected_sector"),
    [
        ("INFY.NS", "Technology"),
        ("TCS.NS", "Technology"),
        ("BHARTIARTL.NS", "Communication Services"),
        ("MSFT", "Technology"),
        ("ACN", "Technology"),
        ("NVDA", "Technology"),
        ("PG", "Consumer Defensive"),
        ("AXISBANK.NS", "Financial Services"),
    ],
)
def test_fallback_asset_metrics_preserve_company_sector(ticker, expected_sector):
    metrics = market_data.MarketDataService._generate_fallback_metrics(
        ticker,
        "quote unavailable",
    )

    assert metrics.ticker == ticker
    assert metrics.sector == expected_sector
    assert metrics.sector not in {"General Industry", "General Market"}


def test_unmapped_ticker_is_marked_unclassified():
    metrics = market_data.MarketDataService._generate_fallback_metrics(
        "UNKNOWN",
        "quote unavailable",
    )

    assert metrics.sector == "Unclassified"


def test_market_trend_uses_sorted_twelve_data_history(monkeypatch):
    async def get_history(_ticker, interval, outputsize):
        assert interval == "1day"
        assert outputsize == 7
        return {
            "values": [
                {"datetime": "2026-01-02", "close": "105", "volume": "1200"},
                {"datetime": "2026-01-01", "close": "100", "volume": "900"},
            ]
        }

    monkeypatch.setattr(
        market_data.TwelveDataService,
        "get_historical_charts",
        staticmethod(get_history),
    )

    trend = asyncio.run(market_data.MarketDataService._fetch_single_trend_item("AAPL"))

    assert trend.current_price == 105
    assert trend.change == 5
    assert trend.change_percent == 5
    assert trend.volume == 1200
    assert trend.sparkline == [100, 105]


def test_market_trends_limit_live_provider_requests(monkeypatch):
    tickers = ["NVDA", "MSFT", "TCS.NS", "INFY.NS", "AAPL"]
    monkeypatch.setattr(market_data, "WATCHLIST_TICKERS", tickers)
    monkeypatch.setattr(market_data, "LIVE_TREND_TICKERS", ("NVDA", "MSFT", "TCS.NS", "INFY.NS"))
    monkeypatch.setattr(market_data, "MARKET_TREND_REQUEST_INTERVAL_SECONDS", 0)
    monkeypatch.setattr(market_data, "_TRENDS_CACHE", None)
    monkeypatch.setattr(market_data, "_TRENDS_CACHE_TIME", 0)
    monkeypatch.setattr(market_data.TwelveDataService, "is_configured", staticmethod(lambda: True))
    requested_tickers = []

    async def fetch_live_trend(ticker):
        requested_tickers.append(ticker)
        return market_data.MarketDataService._generate_fallback_trend_item(
            ticker
        ).model_copy(update={"data_source": "live"})

    monkeypatch.setattr(
        market_data.MarketDataService,
        "_fetch_single_trend_item",
        classmethod(lambda cls, ticker: fetch_live_trend(ticker)),
    )

    response = asyncio.run(market_data.MarketDataService.fetch_market_trends())

    assert requested_tickers == ["NVDA", "MSFT", "TCS.NS", "INFY.NS"]
    assert response.data_status == "partial"
    assert response.live_items_count == 4
    assert response.total_items_count == 5
    assert response.all_items[-1].data_source == "sample"


def test_twelve_data_skips_requests_during_rate_limit_cooldown(monkeypatch):
    from backend.app.services.twelve_data import TwelveDataService

    monkeypatch.setattr(settings, "TWELVE_DATA_API_KEY", "test-key")
    monkeypatch.setattr(
        TwelveDataService,
        "_rate_limit_until",
        time.monotonic() + 60,
    )

    with pytest.raises(ValueError, match="rate limit cooldown"):
        asyncio.run(TwelveDataService._get("quote", "AAPL"))
