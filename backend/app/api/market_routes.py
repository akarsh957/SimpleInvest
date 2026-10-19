import logging
from fastapi import APIRouter, HTTPException, status
try:
    from backend.app.schemas.market import (
        MarketTrendsResponse,
        GrowthScoutRequest,
        GrowthScoutResponse,
        StockForecastRequest,
        StockForecastResponse,
    )
    from backend.app.services.market_data import MarketDataService
    from backend.app.services.ai_engine import ai_engine
except ImportError:
    from app.schemas.market import (
        MarketTrendsResponse,
        GrowthScoutRequest,
        GrowthScoutResponse,
        StockForecastRequest,
        StockForecastResponse,
    )
    from app.services.market_data import MarketDataService
    from app.services.ai_engine import ai_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Market & AI Intelligence"])


@router.get(
    "/market/trends",
    response_model=MarketTrendsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Real-Time Market Trends",
    description=(
        "Pulls real-time price quotes, day changes, 52-week highs/lows, trading volume, "
        "and 7-day sparkline prices for top global & Indian market leaders (NVDA, AAPL, MSFT, RELIANCE.NS, etc.)."
    ),
)
async def get_market_trends() -> MarketTrendsResponse:
    """
    Endpoint logic:
    1. Fetch real-time market data & sparklines via yfinance.
    2. Categorize into all_items, top gainers, top losers, and volume leaders.
    3. Return clean structured JSON with safe fallback handling.
    """
    try:
        logger.info("Received request for /api/market/trends")
        trends = await MarketDataService.fetch_market_trends()
        return trends
    except Exception as e:
        logger.error(f"Unexpected error in /api/market/trends: {e}", exc_info=True)
        # Fallback safeguard
        return await MarketDataService.fetch_market_trends()


@router.get(
    "/market/forecast/{ticker}",
    response_model=StockForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Stock Past, Present & Future AI Prediction Trajectory",
    description=(
        "Returns historical price data, current price point, and forward-looking AI price predictions "
        "with confidence bounds (bull/bear targets), support/resistance levels, and catalysts."
    ),
)
async def get_stock_forecast(
    ticker: str,
    timeframe: str = "6mo",
    forecast_days: int = 30,
) -> StockForecastResponse:
    try:
        logger.info(f"Forecast request for ticker: {ticker}, timeframe: {timeframe}, days: {forecast_days}")
        clean_ticker = ticker.strip().upper()
        clean_timeframe = timeframe.strip().lower()
        if clean_timeframe not in ["1mo", "3mo", "6mo", "1y", "5y"]:
            clean_timeframe = "6mo"
        clean_days = max(7, min(180, int(forecast_days)))
        
        forecast = await MarketDataService.fetch_stock_chart_and_forecast(
            ticker_symbol=clean_ticker,
            timeframe=clean_timeframe,
            forecast_days=clean_days,
        )
        return forecast
    except Exception as e:
        logger.error(f"Error generating stock forecast for {ticker}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate forecast for {ticker}: {str(e)}",
        )


@router.post(
    "/market/forecast",
    response_model=StockForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Post Stock Forecast Request",
)
async def post_stock_forecast(payload: StockForecastRequest) -> StockForecastResponse:
    return await get_stock_forecast(
        ticker=payload.ticker,
        timeframe=payload.timeframe,
        forecast_days=payload.forecast_days,
    )


@router.post(
    "/ai/growth-scout",
    response_model=GrowthScoutResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Growth Opportunity Radar",
    description=(
        "Computes key valuation and velocity metrics (Forward P/E, PEG ratio, Revenue Growth, Debt-to-Equity) "
        "and feeds them to Groq to generate structured high-growth opportunities."
    ),
)
async def growth_scout(payload: GrowthScoutRequest) -> GrowthScoutResponse:
    """
    Endpoint logic:
    1. Fetch growth metric data for candidate companies matching sector filter.
    2. Pass metrics and risk preference to Groq AI engine.
    3. Return structured recommendations.
    """
    try:
        logger.info(f"Received growth scout request - Risk: {payload.risk_preference}, Sector: {payload.sector}")
        candidates_data = await MarketDataService.fetch_growth_candidates_data(payload.sector)
        recommendations = await ai_engine.scout_growth_opportunities(
            risk_preference=payload.risk_preference,
            sector=payload.sector,
            candidates_data=candidates_data,
        )
        return recommendations
    except Exception as e:
        logger.error(f"Unexpected error in /api/ai/growth-scout: {e}", exc_info=True)
        # Fallback return
        candidates_data = await MarketDataService.fetch_growth_candidates_data(payload.sector)
        return ai_engine._mock_growth_scout(payload.risk_preference, payload.sector, candidates_data)
