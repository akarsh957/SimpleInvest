from pydantic import BaseModel, Field
from typing import Optional

class TradeExecutionRequest(BaseModel):
    user_id: str = Field(..., description="The ID of the user placing the trade")
    ticker: str = Field(..., description="The stock ticker symbol")
    side: str = Field(..., description="BUY or SELL")
    shares: float = Field(..., description="Number of shares to trade")

class TradeExecutionResponse(BaseModel):
    status: str
    message: str
    order_id: Optional[str] = None
    executed_price: Optional[float] = None
    total_value: Optional[float] = None

class MomentumPredictionRequest(BaseModel):
    ticker: str

class MomentumPredictionResponse(BaseModel):
    ticker: str
    momentum_score: float = Field(..., description="0 to 100")
    trend: str = Field(..., description="BULLISH, BEARISH, NEUTRAL")
    analysis: str = Field(..., description="Plain english analysis of momentum")

