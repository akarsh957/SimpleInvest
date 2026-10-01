import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_and_health():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "SimpleInvest Core Engine"

    health_response = client.get("/health")
    assert health_response.status_code == 200
    assert health_response.json() == {"status": "healthy"}


def test_analyze_asset_success():
    payload = {"ticker": "TCS.NS"}
    response = client.post("/api/analyze-asset", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ticker"] == "TCS.NS"
    assert "company_name" in data
    assert "current_price" in data
    assert "sector" in data
    assert "plain_english_summary" in data
    assert "risk_vibe" in data
    assert "crash_scenario" in data
    assert "valuation_assessment" in data


def test_analyze_asset_us_ticker():
    payload = {"ticker": "AAPL"}
    response = client.post("/api/analyze-asset", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ticker"] == "AAPL"
    assert isinstance(data["current_price"], float)
    assert data["current_price"] > 0


def test_analyze_asset_empty_ticker_validation():
    payload = {"ticker": "  "}
    response = client.post("/api/analyze-asset", json=payload)
    assert response.status_code == 422 or response.status_code == 400


def test_portfolio_audit_success():
    payload = {
        "holdings": [
            {"ticker": "TCS.NS", "invested_amount": 30000},
            {"ticker": "INFY.NS", "invested_amount": 20000},
            {"ticker": "HDFCBANK.NS", "invested_amount": 50000},
        ]
    }
    response = client.post("/api/portfolio/audit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_invested_amount"] == 100000.0
    assert data["holdings_count"] == 3
    assert "sector_breakdown" in data
    assert "portfolio_risk_vibe" in data
    assert 1 <= data["diversification_score"] <= 100
    assert "plain_english_summary" in data
    assert "concentration_warning" in data
    assert len(data["actionable_takeaways"]) > 0
    assert len(data["holdings_detail"]) == 3

    # Check holdings detail weight percentage
    holdings_map = {h["ticker"]: h for h in data["holdings_detail"]}
    assert holdings_map["TCS.NS"]["weight_percentage"] == 30.0
    assert holdings_map["INFY.NS"]["weight_percentage"] == 20.0
    assert holdings_map["HDFCBANK.NS"]["weight_percentage"] == 50.0


def test_portfolio_audit_invalid_holding_amount():
    payload = {
        "holdings": [
            {"ticker": "TCS.NS", "invested_amount": -100}
        ]
    }
    response = client.post("/api/portfolio/audit", json=payload)
    assert response.status_code == 422
