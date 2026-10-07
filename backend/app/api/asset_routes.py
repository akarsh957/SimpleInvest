import logging
from fastapi import APIRouter, HTTPException, status
try:
    from backend.app.schemas.asset import AssetAnalysisRequest, AssetAnalysisResponse
    from backend.app.services.market_data import MarketDataService
    from backend.app.services.ai_engine import ai_engine
except ImportError:
    from app.schemas.asset import AssetAnalysisRequest, AssetAnalysisResponse
    from app.services.market_data import MarketDataService
    from app.services.ai_engine import ai_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Asset Analysis"])


@router.post(
    "/analyze-asset",
    response_model=AssetAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze individual asset in plain English",
    description=(
        "Pulls real-time asset metrics via yfinance for any global or Indian ticker "
        "(e.g., AAPL, MSFT, TCS.NS, RELIANCE.NS) and translates them using Groq LLM "
        "into jargon-free, beginner-friendly explanations."
    ),
)
async def analyze_asset(payload: AssetAnalysisRequest) -> AssetAnalysisResponse:
    """
    Endpoint logic:
    1. Extract ticker from request body.
    2. Pull asset metrics using yfinance via MarketDataService.
    3. Send raw metrics to Groq AI engine for plain-English translation.
    4. Return strict structured JSON response.
    """
    try:
        ticker = payload.ticker.strip().upper()
        logger.info(f"Received asset analysis request for ticker: {ticker}")

        # Step 1: Fetch data from yfinance
        metrics = await MarketDataService.fetch_asset_metrics(ticker)

        # Step 2: Translate via Groq AI Layer
        analysis = await ai_engine.analyze_asset(metrics)

        return analysis

    except ValueError as ve:
        logger.warning(f"Validation error for asset analysis: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Unexpected error analyzing asset '{payload.ticker}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while analyzing ticker '{payload.ticker}': {str(e)}"
        )
