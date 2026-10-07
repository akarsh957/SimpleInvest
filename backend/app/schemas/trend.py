from typing import List, Optional
from pydantic import BaseModel, Field

class StockPredictionPoint(BaseModel):
    date: str
    price: float
    is_projected: bool = False

class StockPredictionRequest(BaseModel):
    ticker: str = Field(..., description="Ticker symbol for stock prediction (e.g. AAPL, NVDA, TCS.NS)")

class StockPredictionResponse(BaseModel):
    ticker: str
    company_name: str
    current_price: float
    change_24h: float
    change_percent_24h: float
    signal: str  # e.g. "STRONG BUY", "ACCUMULATE", "HOLD", "TAKE PROFIT"
    target_price_low: float
    target_price_high: float
    confidence_score: int  # 1-100
    ai_prediction_summary: str
    catalysts: List[str]
    risk_factors: List[str]
    chart_points: List[StockPredictionPoint]

class MarketTrendItem(BaseModel):
    ticker: str
    company_name: str
    sector: str
    price: float
    change_percent_24h: float
    volume: str
    signal: str
    sparkline: List[float]

class MarketTrendsResponse(BaseModel):
    trending_stocks: List[MarketTrendItem]
    top_gainers: List[MarketTrendItem]
