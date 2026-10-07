from typing import List, Optional
from pydantic import BaseModel, Field


class MarketTrendItem(BaseModel):
    ticker: str
    company_name: str
    sector: str
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


class GrowthScoutRequest(BaseModel):
    risk_preference: str = Field("balanced", description="Risk preference: 'balanced' or 'aggressive'")
    sector: str = Field("all", description="Sector filter: 'all', 'tech', 'finance', 'energy'")


class GrowthOpportunity(BaseModel):
    ticker: str
    company_name: str
    growth_catalyst: str
    potential_upside_range: str
    risk_level: str
    confidence_score: int
    key_metric_highlight: str
    cautionary_flag: str


class GrowthScoutResponse(BaseModel):
    recommendations: List[GrowthOpportunity]
