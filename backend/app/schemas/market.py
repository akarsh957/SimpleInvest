from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class MarketTrendItem(BaseModel):
    ticker: str
    company_name: str
    sector: str
    data_source: Literal["live", "sample"] = "live"
    currency: str
    current_price: float
    change: float
    change_percent: float
    volume: int
    volume_formatted: str
    fifty_two_week_low: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    sparkline: List[float]


class MarketTrendsResponse(BaseModel):
    all_items: List[MarketTrendItem]
    gainers: List[MarketTrendItem]
    losers: List[MarketTrendItem]
    volume_leaders: List[MarketTrendItem]
    data_status: Literal["live", "partial", "sample"] = "sample"
    live_items_count: int = 0
    total_items_count: int = 0


class GrowthScoutRequest(BaseModel):
    risk_preference: str = Field("balanced", description="Risk preference: 'balanced' or 'aggressive'")
    sector: str = Field("all", description="Sector filter: 'all', 'tech', 'finance', 'energy'")


class GrowthOpportunity(BaseModel):
    ticker: str
    company_name: str
    recommendation_action: str
    growth_catalyst: str
    potential_upside_range: str
    risk_level: str
    confidence_score: int
    key_metric_highlight: str
    cautionary_flag: str


class GrowthScoutResponse(BaseModel):
    recommendations: List[GrowthOpportunity]


class ChartPoint(BaseModel):
    date: str
    display_date: str
    price: float
    historical_price: Optional[float] = None
    predicted_price: Optional[float] = None
    predicted_upper: Optional[float] = None
    predicted_lower: Optional[float] = None
    moving_average: Optional[float] = None
    volume: Optional[int] = None
    is_prediction: bool = False
    is_present: bool = False


class AIForecastInsights(BaseModel):
    signal: str  # STRONG BUY, BUY, HOLD, DEFENSIVE
    sentiment_score: int  # 0 to 100
    target_price: float
    projected_change_pct: float
    confidence_score: int  # 0 to 100
    confidence_basis: Literal["language_model", "quantitative_model"]
    time_horizon: str  # e.g. "30 Days"
    trend_direction: str  # BULLISH, BEARISH, NEUTRAL
    bull_case_target: float
    bear_case_target: float
    key_support: float
    key_resistance: float
    catalysts: List[str]
    risk_factors: List[str]
    summary: str
    plain_english_translation: Optional[str] = None


class StockForecastRequest(BaseModel):
    ticker: str
    timeframe: str = Field("6mo", description="Historical period: 1mo, 3mo, 6mo, 1y, 5y")
    forecast_days: int = Field(30, description="Forecast horizon: 30, 60, 90")


class StockForecastResponse(BaseModel):
    ticker: str
    company_name: str
    sector: str
    currency: str
    current_price: float
    change: float
    change_percent: float
    fifty_two_week_low: float
    fifty_two_week_high: float
    volume_formatted: str
    pe_ratio: Optional[float] = None
    beta: Optional[float] = None
    timeframe: str
    forecast_days: int
    chart_data: List[ChartPoint]
    ai_insights: AIForecastInsights
