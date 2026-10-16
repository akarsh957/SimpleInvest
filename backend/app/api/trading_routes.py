import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status

try:
    from backend.app.schemas.trading import (
        TradeExecutionRequest,
        TradeExecutionResponse,
        MomentumPredictionRequest,
        MomentumPredictionResponse,
    )
    from backend.app.services.twelve_data import TwelveDataService
    from backend.app.services.ai_engine import ai_engine
    from backend.app.db import get_authenticated_supabase_client, supabase
except ImportError:
    from app.schemas.trading import (
        TradeExecutionRequest,
        TradeExecutionResponse,
        MomentumPredictionRequest,
        MomentumPredictionResponse,
    )
    from app.services.twelve_data import TwelveDataService
    from app.services.ai_engine import ai_engine
    from app.db import get_authenticated_supabase_client, supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Trading"])

@router.post(
    "/trade/execute",
    response_model=TradeExecutionResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute a paper trade",
)
async def execute_trade(
    request: TradeExecutionRequest,
    authorization: Optional[str] = Header(default=None),
) -> TradeExecutionResponse:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication is required to execute trades")

    access_token = authorization.split(" ", 1)[1].strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication is required to execute trades")

    if supabase is None:
        raise HTTPException(status_code=500, detail="Database connection not configured")

    try:
        user_supabase = get_authenticated_supabase_client(access_token)

        # 1. Get real-time price from Twelve Data, with yfinance fallback
        current_price = None
        try:
            quote_data = await TwelveDataService.get_realtime_quote(request.ticker)
            if quote_data and 'price' in quote_data:
                current_price = float(quote_data['price'])
        except Exception as q_err:
            logger.warning(f"TwelveData quote failed for {request.ticker}: {q_err}. Falling back to yfinance.")
            
        if current_price is None:
            try:
                import yfinance as yf
                t = yf.Ticker(request.ticker)
                fast_info = getattr(t, 'fast_info', None)
                if fast_info and getattr(fast_info, 'last_price', None):
                    current_price = float(fast_info.last_price)
                else:
                    hist = t.history(period="1d")
                    if not hist.empty:
                        current_price = float(hist['Close'].iloc[-1])
            except Exception as yf_err:
                logger.error(f"yfinance fallback failed for {request.ticker}: {yf_err}")

        if current_price is None or current_price <= 0:
            raise HTTPException(status_code=400, detail=f"Could not fetch realtime quote for {request.ticker}")
        
        # 2. Check user balance / holdings
        # Usually handled by RLS and database constraints, but we can do a preemptive check if we want.
        # The trigger we wrote handles deductions, but we can insert the order and let the trigger run.
        
        # 3. Insert order into supabase
        order_insert = user_supabase.table("orders").insert({
            "user_id": request.user_id,
            "ticker": request.ticker,
            "side": request.side,
            "shares": request.shares,
            "price": current_price,
            "status": "EXECUTED"
        }).execute()
        
        if not order_insert.data:
            raise HTTPException(status_code=400, detail="Failed to execute order")
            
        order_data = order_insert.data[0]
        
        return TradeExecutionResponse(
            status="success",
            message=f"Successfully executed {request.side} order for {request.shares} shares of {request.ticker}",
            order_id=order_data["id"],
            executed_price=current_price,
            total_value=order_data["total_value"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing trade: {e}", exc_info=True)
        if "holdings_shares_check" in str(e):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Sell failed because Supabase is still using the old sell trigger. "
                    "Apply the latest sell-order migration and retry."
                ),
            ) from e
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/ai/predict-momentum",
    response_model=MomentumPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict momentum for a stock using Groq AI",
)
async def predict_momentum(request: MomentumPredictionRequest) -> MomentumPredictionResponse:
    try:
        # Fetch historical data to pass to the AI
        historical_data = await TwelveDataService.get_historical_charts(request.ticker, interval="1day", outputsize=14)
        
        # Generate insight
        insight = await ai_engine.predict_momentum(request.ticker, historical_data)
        return insight
    except Exception as e:
        logger.error(f"Error predicting momentum: {e}", exc_info=True)
        # Fallback response
        return MomentumPredictionResponse(
            ticker=request.ticker,
            momentum_score=50,
            trend="NEUTRAL",
            analysis="Could not fetch real-time momentum data."
        )
