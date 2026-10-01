import json
import logging
from typing import Dict, Any, List, Optional
from groq import Groq, AsyncGroq

from app.config import settings
from app.schemas.asset import AssetMetrics, AssetAnalysisResponse
from app.schemas.portfolio import (
    HoldingAuditDetail,
    PortfolioAuditResponse,
)

logger = logging.getLogger(__name__)


class AIEngineService:
    """
    AI Service powered by Groq SDK (Llama 3.1 8B Instant) translating raw stock and portfolio metrics
    into plain-English, jargon-free insights for ordinary investors.
    """

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.temperature = 0.2
        self._async_client = None

    @property
    def async_client(self) -> Optional[AsyncGroq]:
        """
        Lazy initializer for AsyncGroq client.
        """
        if self._async_client is None:
            key = settings.GROQ_API_KEY or self.api_key
            if key and not key.startswith("gsk_your") and len(key.strip()) > 0:
                self._async_client = AsyncGroq(api_key=key.strip())
        return self._async_client

    @staticmethod
    def _parse_json_response(raw_content: str) -> dict:
        """
        Strips markdown code blocks if present and parses raw string into a dictionary.
        """
        cleaned = raw_content.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        return json.loads(cleaned)

    async def analyze_asset(self, metrics: AssetMetrics) -> AssetAnalysisResponse:
        """
        Sends raw metrics to Groq and requests a strict JSON response matching AssetAnalysisResponse.
        """
        client = self.async_client
        if not client:
            logger.warning("GROQ_API_KEY is not set or placeholder. Using intelligent local mock analysis engine.")
            return self._mock_asset_analysis(metrics)

        system_prompt = (
            "You are an empathetic, beginner-friendly financial guide for ordinary people who feel intimidated by investing. "
            "Your job is to translate raw stock metrics into warm, intuitive, everyday concepts.\n\n"
            "STRICT RULES:\n"
            "1. NEVER use financial jargon terms like 'Beta', 'P/E ratio', 'P/E multiple', 'market capitalization', 'alpha', or 'volatility' in your explanations.\n"
            "2. If explaining stock price swings, compare it to something intuitive (e.g., 'a calm boat on a lake' vs 'a high-speed rollercoaster').\n"
            "3. If explaining valuation (price vs profit), explain it like buying a house, a coffee shop, or a trendy smartphone.\n"
            "4. Respond strictly in valid JSON matching the required schema. Do not include markdown code block backticks inside the JSON string values."
        )

        user_prompt = f"""
Analyze this stock for a beginner:
- Ticker: {metrics.ticker}
- Company Name: {metrics.company_name}
- Current Price: {metrics.current_price} {metrics.currency}
- Sector: {metrics.sector}
- Trailing P/E: {metrics.trailing_pe if metrics.trailing_pe is not None else 'N/A'}
- Beta (Volatility relative to market): {metrics.beta if metrics.beta is not None else '1.0'}
- 52-Week High: {metrics.fifty_two_week_high if metrics.fifty_two_week_high is not None else 'N/A'}
- 52-Week Low: {metrics.fifty_two_week_low if metrics.fifty_two_week_low is not None else 'N/A'}
- Dividend Yield: {f'{metrics.dividend_yield * 100:.2f}%' if metrics.dividend_yield is not None else 'N/A'}

Return a strict JSON object with these EXACT keys:
{{
  "ticker": "{metrics.ticker}",
  "company_name": "{metrics.company_name}",
  "current_price": {metrics.current_price},
  "sector": "{metrics.sector}",
  "plain_english_summary": "1-2 simple sentences explaining what the company actually does and sells.",
  "risk_vibe": "Short vibe string (e.g., 'Smooth Ride', 'Moderate Bumps', 'Rollercoaster', 'Wild Ride')",
  "crash_scenario": "If the broader market falls 10%, describe how this stock typically behaves in plain English without mentioning beta.",
  "valuation_assessment": "Plain-English assessment: Is it priced like an expensive trendy favorite, fair value, or bargain?"
}}
"""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"},
            )
            raw_content = response.choices[0].message.content.strip()
            data = self._parse_json_response(raw_content)

            return AssetAnalysisResponse(
                ticker=metrics.ticker,
                company_name=metrics.company_name,
                current_price=metrics.current_price,
                sector=metrics.sector,
                plain_english_summary=str(data.get("plain_english_summary", f"{metrics.company_name} is a key player in the {metrics.sector} industry.")),
                risk_vibe=str(data.get("risk_vibe", "Moderate Bumps")),
                crash_scenario=str(data.get("crash_scenario", f"If the market drops 10%, this stock typically behaves relative to its industry stability.")),
                valuation_assessment=str(data.get("valuation_assessment", "Priced reasonably relative to its core earnings."))
            )

        except Exception as e:
            logger.error(f"Groq API asset analysis error: {e}. Falling back to rule-based engine.")
            return self._mock_asset_analysis(metrics)

    async def audit_portfolio(
        self,
        total_invested: float,
        total_current: float,
        sector_breakdown: Dict[str, float],
        holdings_detail: List[HoldingAuditDetail],
    ) -> PortfolioAuditResponse:
        """
        Audits a full portfolio using Groq LLM, evaluating sector concentration and overall risk.
        """
        holdings_summary_str = "\n".join(
            [
                f"- {h.company_name} ({h.ticker}): {h.weight_percentage}% of portfolio, Sector: {h.sector}, Invested: {h.invested_amount}"
                for h in holdings_detail
            ]
        )

        client = self.async_client
        if not client:
            logger.warning("GROQ_API_KEY is not set or placeholder. Using intelligent local portfolio audit engine.")
            return self._mock_portfolio_audit(
                total_invested, total_current, sector_breakdown, holdings_detail
            )

        system_prompt = (
            "You are a friendly, encouraging financial guide reviewing an ordinary investor's portfolio. "
            "Avoid financial jargon like 'capitalization', 'beta', 'sharpe ratio', or 'asset allocation'. "
            "Use clear everyday analogies about eggs in baskets, bumpy roads, and balanced nutrition.\n"
            "Respond strictly in valid JSON matching the schema."
        )

        user_prompt = f"""
Audit this investor's portfolio:
- Total Invested: {total_invested}
- Estimated Current Value: {total_current}
- Number of Assets: {len(holdings_detail)}
- Sector Breakdown (%): {json.dumps(sector_breakdown)}

Holdings Detail:
{holdings_summary_str}

Return a strict JSON object with these EXACT keys:
{{
  "portfolio_risk_vibe": "Short vibe string (e.g., 'Balanced & Steady', 'Tech-Heavy Rollercoaster', 'Financial Fortress')",
  "diversification_score": 75,
  "plain_english_summary": "1-3 warm, simple sentences reviewing the portfolio setup for a beginner.",
  "concentration_warning": "Clear, friendly alert on sector or single-stock overexposure (or reassurance if well diversified).",
  "actionable_takeaways": [
    "Beginner-friendly advice bullet 1",
    "Beginner-friendly advice bullet 2",
    "Beginner-friendly advice bullet 3"
  ]
}}
"""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"},
            )
            raw_content = response.choices[0].message.content.strip()
            data = self._parse_json_response(raw_content)

            return PortfolioAuditResponse(
                total_invested_amount=round(total_invested, 2),
                total_current_value=round(total_current, 2),
                holdings_count=len(holdings_detail),
                sector_breakdown=sector_breakdown,
                portfolio_risk_vibe=str(data.get("portfolio_risk_vibe", "Balanced Growth")),
                diversification_score=int(data.get("diversification_score", 70)),
                plain_english_summary=str(data.get("plain_english_summary", "Your portfolio is focused across key sectors.")),
                concentration_warning=str(data.get("concentration_warning", "No critical concentration risks found.")),
                actionable_takeaways=list(data.get("actionable_takeaways", ["Keep consistent investments over time."])),
                holdings_detail=holdings_detail,
            )

        except Exception as e:
            logger.error(f"Groq API portfolio audit error: {e}. Falling back to local audit engine.")
            return self._mock_portfolio_audit(
                total_invested, total_current, sector_breakdown, holdings_detail
            )

    def _mock_asset_analysis(self, metrics: AssetMetrics) -> AssetAnalysisResponse:
        """
        Local rule-based fallback analyzer that generates warm, jargon-free explanations.
        """
        beta = metrics.beta if metrics.beta is not None else 1.0
        pe = metrics.trailing_pe

        # Risk Vibe Determination
        if beta < 0.8:
            risk_vibe = "Smooth Ride"
            crash_text = (
                f"If the overall market drops 10%, {metrics.company_name} usually holds up well, "
                f"falling around {abs(round(beta * 10, 1))}% because it belongs to a stable essential industry."
            )
        elif beta <= 1.25:
            risk_vibe = "Moderate Bumps"
            crash_text = (
                f"If the broader market takes a 10% dip, {metrics.company_name} will likely fall about "
                f"{abs(round(beta * 10, 1))}%, moving right in sync with the general economy."
            )
        else:
            risk_vibe = "Rollercoaster"
            crash_text = (
                f"If the stock market falls 10%, {metrics.company_name} tends to react sharply, "
                f"potentially dropping around {abs(round(beta * 10, 1))}% in the short term."
            )

        # Valuation Assessment
        if pe is None:
            valuation = (
                f"{metrics.company_name} is priced based on future potential rather than current profits. "
                "Investors are betting on its long-term growth story."
            )
        elif pe < 15:
            valuation = (
                f"Priced like a classic bargain. You are paying less per dollar of company profit compared to most market favorites."
            )
        elif pe <= 30:
            valuation = (
                f"Priced at fair value. Investors are paying a reasonable price for a stable, proven business."
            )
        else:
            valuation = (
                f"Priced like a popular, high-end favorite. Investors expect big future growth, so shares command a premium price."
            )

        # Summary
        summary = (
            f"{metrics.company_name} operates in the {metrics.sector} space, "
            f"providing products and services to millions of daily customers."
        )

        return AssetAnalysisResponse(
            ticker=metrics.ticker,
            company_name=metrics.company_name,
            current_price=metrics.current_price,
            sector=metrics.sector,
            plain_english_summary=summary,
            risk_vibe=risk_vibe,
            crash_scenario=crash_text,
            valuation_assessment=valuation,
        )

    def _mock_portfolio_audit(
        self,
        total_invested: float,
        total_current: float,
        sector_breakdown: Dict[str, float],
        holdings_detail: List[HoldingAuditDetail],
    ) -> PortfolioAuditResponse:
        """
        Local rule-based fallback portfolio auditor.
        """
        # Determine concentration
        top_sector, top_pct = max(sector_breakdown.items(), key=lambda x: x[1]) if sector_breakdown else ("General", 100.0)

        if top_pct >= 60.0:
            vibe = f"{top_sector}-Heavy Thrill Ride"
            score = max(30, int(100 - top_pct))
            warning = (
                f"Warning: {top_pct:.1f}% of your portfolio is concentrated in {top_sector}. "
                f"If {top_sector} experiences a downturn, almost your entire investment will feel the pinch."
            )
            takeaways = [
                f"Consider adding companies from outside {top_sector} to spread your risk.",
                "Avoid putting all your eggs in one industry basket.",
                "Build a safety cushion with stable dividend-paying companies or broad funds."
            ]
        elif top_pct >= 40.0:
            vibe = "Moderately Concentrated"
            score = 65
            warning = (
                f"Notice: {top_sector} makes up {top_pct:.1f}% of your portfolio. "
                "You have good baseline assets, but spreading out slightly more will protect your money better."
            )
            takeaways = [
                f"You have a solid foundation in {top_sector}. Next, explore another sector like Healthcare or Consumer Goods.",
                "Keep holding your quality assets while directing new savings into underrepresented sectors."
            ]
        else:
            vibe = "Well-Balanced & Steady"
            score = 88
            warning = "Great job! Your portfolio is nicely distributed across multiple sectors with no single point of failure."
            takeaways = [
                "Your diversification is healthy and resilient.",
                "Maintain your current disciplined approach by periodic review."
            ]

        summary = (
            f"You have invested in {len(holdings_detail)} company holdings across {len(sector_breakdown)} main sectors. "
            f"Your current portfolio stands at {total_current:,.2f}."
        )

        return PortfolioAuditResponse(
            total_invested_amount=round(total_invested, 2),
            total_current_value=round(total_current, 2),
            holdings_count=len(holdings_detail),
            sector_breakdown=sector_breakdown,
            portfolio_risk_vibe=vibe,
            diversification_score=score,
            plain_english_summary=summary,
            concentration_warning=warning,
            actionable_takeaways=takeaways,
            holdings_detail=holdings_detail,
        )


ai_engine = AIEngineService()
