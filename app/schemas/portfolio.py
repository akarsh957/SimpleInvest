from typing import Dict, List
from pydantic import BaseModel, Field, field_validator


class HoldingInput(BaseModel):
    """
    Individual holding entry in a portfolio.
    """
    ticker: str = Field(..., description="Ticker symbol (e.g., TCS.NS, INFY.NS, AAPL)")
    invested_amount: float = Field(..., gt=0, description="Amount invested in local currency")

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Ticker symbol cannot be empty")
        return v


class PortfolioAuditRequest(BaseModel):
    """
    Request payload for portfolio audit.
    """
    holdings: List[HoldingInput] = Field(
        ...,
        min_length=1,
        description="List of portfolio holdings with ticker and invested amount",
        examples=[
            [
                {"ticker": "TCS.NS", "invested_amount": 30000},
                {"ticker": "INFY.NS", "invested_amount": 20000},
                {"ticker": "HDFCBANK.NS", "invested_amount": 50000}
            ]
        ]
    )


class HoldingAuditDetail(BaseModel):
    """
    Processed audit details for an individual holding.
    """
    ticker: str
    company_name: str
    invested_amount: float
    current_value: float
    weight_percentage: float = Field(..., description="Percentage of portfolio value")
    sector: str
    risk_vibe: str


class PortfolioAuditResponse(BaseModel):
    """
    Comprehensive plain-English audit response for a portfolio.
    """
    total_invested_amount: float = Field(..., description="Total money put into portfolio")
    total_current_value: float = Field(..., description="Estimated current total value")
    holdings_count: int = Field(..., description="Number of assets in portfolio")
    sector_breakdown: Dict[str, float] = Field(
        ...,
        description="Percentage allocation across sectors (e.g., {'Technology': 50.0, 'Financial Services': 50.0})"
    )
    portfolio_risk_vibe: str = Field(
        ...,
        description="Overall portfolio risk vibe (e.g. 'Balanced & Steady', 'Tech Heavy Rollercoaster')"
    )
    diversification_score: int = Field(
        ...,
        ge=1,
        le=100,
        description="Diversification score from 1 (very concentrated) to 100 (super balanced)"
    )
    plain_english_summary: str = Field(
        ...,
        description="Plain-English explanation of overall portfolio structure and health"
    )
    concentration_warning: str = Field(
        ...,
        description="Clear alert on sector or single-stock overexposure"
    )
    actionable_takeaways: List[str] = Field(
        ...,
        description="Empathetic, beginner-friendly tips to improve portfolio stability"
    )
    holdings_detail: List[HoldingAuditDetail] = Field(
        ...,
        description="Breakdown of individual holdings in portfolio"
    )
