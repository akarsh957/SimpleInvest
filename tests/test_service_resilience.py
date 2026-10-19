import asyncio
import threading

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
