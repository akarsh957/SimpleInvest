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
    tickers = ["AAPL", "MSFT", "NVDA", "AMZN"]
    monkeypatch.setattr(market_data, "WATCHLIST_TICKERS", tickers)
    monkeypatch.setattr(market_data, "_GROWTH_METRICS_CACHE", {})
    state_lock = threading.Lock()
    call_count = 0
    active_calls = 0
    maximum_active_calls = 0

    def fetch_metrics(ticker):
        nonlocal call_count, active_calls, maximum_active_calls
        with state_lock:
            call_count += 1
            active_calls += 1
            maximum_active_calls = max(maximum_active_calls, active_calls)
        try:
            time.sleep(0.02)
            return {"ticker": ticker}
        finally:
            with state_lock:
                active_calls -= 1

    monkeypatch.setattr(
        market_data.MarketDataService,
        "_fetch_growth_metrics_single_sync",
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


def test_growth_metrics_use_fallback_when_yahoo_returns_no_info(monkeypatch):
    class EmptyTicker:
        @property
        def info(self):
            return {}

    monkeypatch.setattr(market_data.yf, "Ticker", lambda _: EmptyTicker())

    metrics = market_data.MarketDataService._fetch_growth_metrics_single_sync("AAPL")

    assert metrics["ticker"] == "AAPL"
    assert metrics["forward_pe"] == 28.5
    assert metrics["peg_ratio"] == 1.2
