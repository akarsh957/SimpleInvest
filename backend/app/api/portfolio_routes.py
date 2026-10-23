import asyncio
import logging
from typing import Dict, List
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.schemas.portfolio import (
        PortfolioAuditRequest,
        PortfolioAuditResponse,
        HoldingAuditDetail,
        PortfolioChatRequest,
        PortfolioChatResponse,
    )
    from backend.app.services.market_data import MarketDataService
    from backend.app.services.ai_engine import ai_engine
except ImportError:
    from app.schemas.portfolio import (
        PortfolioAuditRequest,
        PortfolioAuditResponse,
        HoldingAuditDetail,
        PortfolioChatRequest,
        PortfolioChatResponse,
    )
    from app.services.market_data import MarketDataService
    from app.services.ai_engine import ai_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Portfolio Audit"])


@router.post(
    "/portfolio/audit",
    response_model=PortfolioAuditResponse,
    status_code=status.HTTP_200_OK,
    summary="Audit investment portfolio in plain English",
    description=(
        "Analyzes a list of stock/ETF holdings, computes current values, sector allocations, "
        "and concentration risks, then uses Groq LLM to deliver a holistic, jargon-free portfolio audit."
    ),
)
async def audit_portfolio(payload: PortfolioAuditRequest) -> PortfolioAuditResponse:
    """
    Endpoint logic:
    1. Receive list of holdings with ticker and invested amount.
    2. Fetch market metrics for each ticker concurrently using asyncio.gather.
    3. Aggregate total invested, estimated current market value, and sector breakdown.
    4. Pass aggregated portfolio data to Groq AI Engine for holistic plain-English audit.
    5. Return strict Pydantic validated response.
    """
    try:
        logger.info(f"Auditing portfolio with {len(payload.holdings)} holdings.")

        # Step 1: Fetch market metrics concurrently for all holdings
        tickers = [h.ticker for h in payload.holdings]
        tasks = [MarketDataService.fetch_asset_metrics(t) for t in tickers]
        metrics_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Calculate holdings total and percentage allocations
        total_invested = sum(h.invested_amount for h in payload.holdings)
        if total_invested <= 0:
            raise ValueError("Total invested amount in portfolio must be greater than 0.")

        sector_totals: Dict[str, float] = {}
        processed_items = []

        for holding_input, metrics in zip(payload.holdings, metrics_results):
            if isinstance(metrics, Exception):
                logger.warning(f"Error fetching metrics for {holding_input.ticker}: {metrics}")
                metrics = MarketDataService._generate_fallback_metrics(
                    holding_input.ticker,
                    str(metrics),
                )

            company_name = metrics.company_name
            sector = metrics.sector
            beta = metrics.beta if metrics.beta is not None else 1.0
            if beta < 0.8:
                risk_vibe = "Smooth Ride"
            elif beta <= 1.25:
                risk_vibe = "Moderate Bumps"
            else:
                risk_vibe = "Rollercoaster"

            current_val = holding_input.invested_amount
            sector_totals[sector] = sector_totals.get(sector, 0.0) + holding_input.invested_amount
            weight_pct = round((holding_input.invested_amount / total_invested) * 100.0, 1)

            processed_items.append({
                "ticker": holding_input.ticker,
                "company_name": company_name,
                "invested_amount": round(holding_input.invested_amount, 2),
                "current_value": round(current_val, 2),
                "weight_percentage": weight_pct,
                "sector": sector,
                "risk_vibe": risk_vibe,
            })

        holdings_detail = [HoldingAuditDetail(**item) for item in processed_items]

        sector_breakdown = {
            sec: round((amt / total_invested) * 100.0, 1)
            for sec, amt in sector_totals.items()
        }

        # Step 3: Call AI Engine for portfolio audit
        audit_response = await ai_engine.audit_portfolio(
            total_invested=total_invested,
            total_current=total_invested,
            sector_breakdown=sector_breakdown,
            holdings_detail=holdings_detail,
        )

        return audit_response

    except ValueError as ve:
        logger.warning(f"Validation error in portfolio audit: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Unexpected error in portfolio audit: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during portfolio audit: {str(e)}"
        )


@router.post(
    "/portfolio/chat",
    response_model=PortfolioChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Interactive AI Portfolio Copilot chat",
    description="Answers user portfolio questions in plain English with contextual tips.",
)
async def chat_portfolio_endpoint(payload: PortfolioChatRequest) -> PortfolioChatResponse:
    try:
        logger.info(f"Received portfolio chat query: {payload.message[:60]}")

        # Fetch live asset metrics for context
        tickers = [h.ticker for h in payload.holdings]
        tasks = [MarketDataService.fetch_asset_metrics(t) for t in tickers]
        metrics_results = await asyncio.gather(*tasks, return_exceptions=True) if tickers else []

        total_invested = sum(h.invested_amount for h in payload.holdings) if payload.holdings else 0.0
        total_current = 0.0
        processed_items = []

        for holding_input, metrics in zip(payload.holdings, metrics_results):
            if isinstance(metrics, Exception):
                metrics = MarketDataService._generate_fallback_metrics(
                    holding_input.ticker,
                    str(metrics),
                )

            company_name = metrics.company_name
            sector = metrics.sector
            beta = metrics.beta if metrics.beta is not None else 1.0
            if beta < 0.8:
                risk_vibe = "Smooth Ride"
            elif beta <= 1.25:
                risk_vibe = "Moderate Bumps"
            else:
                risk_vibe = "Rollercoaster"

            current_val = (
                holding_input.shares * metrics.current_price
                if holding_input.shares and metrics.current_price and metrics.current_price > 0
                else holding_input.invested_amount
            )
            total_current += current_val
            weight_pct = round((holding_input.invested_amount / total_invested) * 100.0, 1) if total_invested > 0 else 0.0

            processed_items.append({
                "ticker": holding_input.ticker,
                "company_name": company_name,
                "invested_amount": round(holding_input.invested_amount, 2),
                "current_value": round(current_val, 2),
                "weight_percentage": weight_pct,
                "sector": sector,
                "risk_vibe": risk_vibe,
            })

        holdings_detail = [HoldingAuditDetail(**item) for item in processed_items]

        return await ai_engine.chat_portfolio(
            message=payload.message,
            holdings_detail=holdings_detail,
            total_invested=total_invested,
            total_current=total_current or total_invested,
            history=payload.history,
        )
    except Exception as e:
        logger.error(f"Error in portfolio chat: {e}", exc_info=True)
        return ai_engine._mock_portfolio_chat(
            message=payload.message,
            holdings_detail=[],
            total_invested=0.0,
            total_current=0.0,
        )

