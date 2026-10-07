import logging
from fastapi import APIRouter, HTTPException, status
try:
    from backend.app.schemas.market import (
        MarketTrendsResponse,
        GrowthScoutRequest,
        GrowthScoutResponse,
    )
    from backend.app.services.market_data import MarketDataService
    from backend.app.services.ai_engine import ai_engine
except ImportError:
    from app.schemas.market import (
        MarketTrendsResponse,
        GrowthScoutRequest,
        GrowthScoutResponse,
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


@router.post(
    "/ai/growth-scout",
    response_model=GrowthScoutResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Growth Opportunity Radar",
    description=(
        "Computes key valuation and velocity metrics (Forward P/E, PEG ratio, Revenue Growth, Debt-to-Equity) "
        "and feeds them to Groq (Llama 3.1 8B Instant) to generate structured high-growth opportunities."
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
