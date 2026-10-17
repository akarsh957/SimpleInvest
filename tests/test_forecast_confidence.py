from backend.app.services.ai_engine import ai_engine


def test_quantitative_forecast_confidence_uses_market_inputs():
    calm_market = ai_engine._mock_stock_forecast_insights(
        ticker="UNKNOWN-A",
        company_name="Unknown A",
        sector="Technology",
        currency="USD",
        current_price=100,
        fifty_two_week_high=110,
        fifty_two_week_low=90,
        beta=0.8,
        forecast_days=30,
        recent_momentum_pct=1,
    )
    volatile_market = ai_engine._mock_stock_forecast_insights(
        ticker="UNKNOWN-B",
        company_name="Unknown B",
        sector="Technology",
        currency="USD",
        current_price=100,
        fifty_two_week_high=150,
        fifty_two_week_low=70,
        beta=1.8,
        forecast_days=60,
        recent_momentum_pct=-10,
    )

    assert calm_market.confidence_score != volatile_market.confidence_score
    assert 55 <= volatile_market.confidence_score <= calm_market.confidence_score <= 95
    assert calm_market.confidence_basis == "quantitative_model"
    assert volatile_market.confidence_basis == "quantitative_model"
