from typing import Optional
from pydantic import BaseModel, Field, field_validator


class AssetAnalysisRequest(BaseModel):
    """
    Input schema for analyzing a single asset/ticker.
    """
    ticker: str = Field(
        ...,
        description="Ticker symbol for global or Indian stock (e.g., AAPL, MSFT, TCS.NS, RELIANCE.NS)",
        examples=["TCS.NS", "AAPL", "RELIANCE.NS"]
    )

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Ticker symbol cannot be empty")
        return v


class AssetMetrics(BaseModel):
    """
    Raw market metrics fetched from yfinance.
    """
    ticker: str
    company_name: str
    sector: str
    current_price: float
    currency: str = "USD"
    trailing_pe: Optional[float] = None
    beta: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    dividend_yield: Optional[float] = None
    market_cap: Optional[float] = None


class AssetAnalysisResponse(BaseModel):
    """
    Structured response with plain-English beginner-friendly asset analysis.
    """
    ticker: str = Field(..., description="Ticker symbol")
    company_name: str = Field(..., description="Short/Full name of the company")
    current_price: float = Field(..., description="Current market price")
    sector: str = Field(..., description="Industry sector")
    plain_english_summary: str = Field(
        ...,
        description="What the company does explained in 1-2 simple, everyday sentences."
    )
    risk_vibe: str = Field(
        ...,
        description="Vibe label characterizing risk level (e.g., 'Smooth Ride', 'Moderate Bumps', 'Rollercoaster', 'Wild Ride')"
    )
    crash_scenario: str = Field(
        ...,
        description="If the broader market falls 10%, how this stock is expected to behave in beginner terms."
    )
    valuation_assessment: str = Field(
        ...,
        description="Plain-English price assessment (e.g., expensive favorite, fair value, or bargain)."
    )
