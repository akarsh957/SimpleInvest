import json
import logging
from typing import Dict, Any, List, Optional
from groq import Groq, AsyncGroq

try:
    from backend.app.config import settings
    from backend.app.schemas.asset import AssetMetrics, AssetAnalysisResponse
    from backend.app.schemas.portfolio import (
        HoldingAuditDetail,
        PortfolioAuditResponse,
    )
    from backend.app.schemas.market import GrowthOpportunity, GrowthScoutResponse
except ImportError:
    from app.config import settings
    from app.schemas.asset import AssetMetrics, AssetAnalysisResponse
    from app.schemas.portfolio import (
        HoldingAuditDetail,
        PortfolioAuditResponse,
    )
    from app.schemas.market import GrowthOpportunity, GrowthScoutResponse

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

    async def scout_growth_opportunities(
        self,
        risk_preference: str,
        sector: str,
        candidates_data: List[Dict[str, Any]],
    ) -> GrowthScoutResponse:
        """
        Scouts AI-driven growth opportunities using Groq LLM (llama-3.1-8b-instant).
        """
        client = self.async_client
        if not client:
            logger.warning("GROQ_API_KEY missing or placeholder. Using intelligent growth scout mock engine.")
            return self._mock_growth_scout(risk_preference, sector, candidates_data)

        system_prompt = (
            "You are a Senior Quantitative Equity Analyst and Growth Strategist. "
            "Analyze financial metrics (Forward P/E, PEG ratio, Revenue Growth, Debt-to-Equity) "
            "and generate structured high-conviction growth recommendations for investors.\n"
            "STRICT RULES:\n"
            "1. Output ONLY valid JSON matching the schema.\n"
            "2. Explain catalysts and highlights in plain, accessible language.\n"
            "3. Include a realistic upside range (e.g. '15% - 25% over 12 months') and a honest cautionary flag."
        )

        user_prompt = f"""
Investor Profile:
- Risk Preference: {risk_preference}
- Sector Filter: {sector}

Candidate Companies Data:
{json.dumps(candidates_data, indent=2)}

Return a strict JSON object with key "recommendations" containing an array of objects matching this exact structure:
{{
  "recommendations": [
    {{
      "ticker": "TICKER",
      "company_name": "Full Company Name",
      "growth_catalyst": "1-2 plain English sentences explaining structural tailwinds driving growth",
      "potential_upside_range": "15% - 25% over 12 months",
      "risk_level": "Low | Moderate | High",
      "confidence_score": 88,
      "key_metric_highlight": "Key metric highlight (e.g., Revenue grew 122% YoY with zero balance sheet stress)",
      "cautionary_flag": "Honest downside risk or cautionary flag"
    }}
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

            raw_recs = data.get("recommendations", [])
            parsed_recs = []
            for item in raw_recs:
                parsed_recs.append(
                    GrowthOpportunity(
                        ticker=str(item.get("ticker", "NVDA")),
                        company_name=str(item.get("company_name", "NVIDIA Corporation")),
                        growth_catalyst=str(item.get("growth_catalyst", "Dominant position in next-gen compute architecture.")),
                        potential_upside_range=str(item.get("potential_upside_range", "15% - 25% over 12 months")),
                        risk_level=str(item.get("risk_level", "Moderate")),
                        confidence_score=int(item.get("confidence_score", 85)),
                        key_metric_highlight=str(item.get("key_metric_highlight", "Strong revenue growth with healthy profit margins.")),
                        cautionary_flag=str(item.get("cautionary_flag", "High market valuation requires consistent earnings beats.")),
                    )
                )

            if not parsed_recs:
                return self._mock_growth_scout(risk_preference, sector, candidates_data)

            return GrowthScoutResponse(recommendations=parsed_recs)

        except Exception as e:
            logger.error(f"Groq growth scout error: {e}. Falling back to rule-based engine.")
            return self._mock_growth_scout(risk_preference, sector, candidates_data)

    def _mock_asset_analysis(self, metrics: AssetMetrics) -> AssetAnalysisResponse:
        """
        Local rule-based fallback analyzer that generates warm, jargon-free explanations.
        """
        beta = metrics.beta if metrics.beta is not None else 1.0
        pe = metrics.trailing_pe

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

    def _mock_growth_scout(
        self,
        risk_preference: str,
        sector: str,
        candidates_data: List[Dict[str, Any]],
    ) -> GrowthScoutResponse:
        """
        Rule-based growth scout fallback returning high-conviction opportunities.
        """
        is_aggressive = risk_preference.lower() == "aggressive"
        
        all_options = [
            GrowthOpportunity(
                ticker="NVDA",
                company_name="NVIDIA Corporation",
                growth_catalyst="Uncontested global monopoly in AI accelerators and datacenter GPU infrastructure, powered by massive enterprise software investments.",
                potential_upside_range="25% - 40% over 12 months" if is_aggressive else "15% - 25% over 12 months",
                risk_level="High" if is_aggressive else "Moderate",
                confidence_score=92 if is_aggressive else 88,
                key_metric_highlight="Revenue grew 122% YoY with zero balance sheet stress and 75%+ gross margins.",
                cautionary_flag="High valuation multiple leaves little room for earnings misses or chip supply delays."
            ),
            GrowthOpportunity(
                ticker="AAPL",
                company_name="Apple Inc.",
                growth_catalyst="Super-cycle drive powered by Apple Intelligence on 1.5B active iPhones alongside high-margin recurring Services revenue.",
                potential_upside_range="12% - 18% over 12 months",
                risk_level="Low",
                confidence_score=90,
                key_metric_highlight="Services business generates over $24B quarterly with massive balance sheet cash reserves.",
                cautionary_flag="Slower hardware replacement cycles in emerging Asian markets could cap short-term upside."
            ),
            GrowthOpportunity(
                ticker="MSFT",
                company_name="Microsoft Corporation",
                growth_catalyst="Azure Cloud scaling rapidly with integrated OpenAI Copilot features enterprise-wide across Office and Developer tools.",
                potential_upside_range="15% - 22% over 12 months",
                risk_level="Low" if not is_aggressive else "Moderate",
                confidence_score=94,
                key_metric_highlight="Cloud revenue up 29% YoY with over $50B in annualized AI-related cloud commitments.",
                cautionary_flag="Substantial capital expenditure spending on data center infrastructure may temporarily press cash flow."
            ),
            GrowthOpportunity(
                ticker="TSLA",
                company_name="Tesla, Inc.",
                growth_catalyst="Autonomous Full Self-Driving (FSD) v12 neural networks rollout and expanding Energy Storage utility deployments.",
                potential_upside_range="30% - 55% over 12 months" if is_aggressive else "15% - 30% over 12 months",
                risk_level="High",
                confidence_score=78 if is_aggressive else 72,
                key_metric_highlight="Energy storage deployments surged 157% YoY with industry-leading EV manufacturing efficiency.",
                cautionary_flag="Short-term automotive price cuts and EV margin compression pose volatility risks."
            ),
            GrowthOpportunity(
                ticker="RELIANCE.NS",
                company_name="Reliance Industries Ltd.",
                growth_catalyst="5G monetization via Jio Telecom paired with rapid expansion of Retail store footprints and green hydrogen investments.",
                potential_upside_range="18% - 25% over 12 months",
                risk_level="Moderate",
                confidence_score=86,
                key_metric_highlight="Jio subscriber ARPU increasing steadily with over 450M mobile subscribers across India.",
                cautionary_flag="Heavy ongoing capital expenditure in new energy gigafactories may delay immediate dividend hikes."
            ),
            GrowthOpportunity(
                ticker="HDFCBANK.NS",
                company_name="HDFC Bank Limited",
                growth_catalyst="Post-merger deposit accretion and branch network expansion expanding net interest margins in fast-growing urban hubs.",
                potential_upside_range="14% - 20% over 12 months",
                risk_level="Low",
                confidence_score=89,
                key_metric_highlight="Best-in-class asset quality with Gross NPA under 1.3% and solid credit growth.",
                cautionary_flag="Digestive phase following parent merger requires steady deposit gathering over upcoming quarters."
            ),
            GrowthOpportunity(
                ticker="TCS.NS",
                company_name="Tata Consultancy Services",
                growth_catalyst="Massive order book win-rate in AI transformation and cloud migration contracts across Europe and North America.",
                potential_upside_range="12% - 17% over 12 months",
                risk_level="Low",
                confidence_score=87,
                key_metric_highlight="Record quarterly deal total contract value (TCV) exceeding $12 Billion with 24%+ operating margins.",
                cautionary_flag="Slower discretionary tech spend in Western banking clients could moderate deal pipeline conversion."
            ),
        ]

        sec_clean = sector.lower().strip()
        if sec_clean == "tech":
            filtered = [o for o in all_options if o.ticker in ["NVDA", "AAPL", "MSFT", "TCS.NS"]]
        elif sec_clean == "finance":
            filtered = [o for o in all_options if o.ticker in ["HDFCBANK.NS"]]
        elif sec_clean == "energy":
            filtered = [o for o in all_options if o.ticker in ["RELIANCE.NS", "TSLA"]]
        else:
            filtered = all_options

        if not filtered:
            filtered = all_options[:3]

        return GrowthScoutResponse(recommendations=filtered)

    async def predict_momentum(self, ticker: str, historical_data: Dict[str, Any]):
        """
        Uses Groq AI to predict stock momentum based on recent historical data from Twelve Data.
        """
        client = self.async_client
        if not client:
            return {
                "ticker": ticker,
                "momentum_score": 65,
                "trend": "BULLISH",
                "analysis": "AI API Key missing. Returning fallback mock analysis: Stock shows a mild upward trend."
            }

        # Format historical data for prompt
        try:
            values = historical_data.get('values', [])
            prices_summary = ", ".join([f"{v['datetime']}: {v['close']}" for v in values[:14]])
        except Exception:
            prices_summary = "Data unavailable"

        system_prompt = (
            "You are a technical analyst. You are provided with recent daily closing prices of a stock. "
            "Analyze the short-term momentum and return a strict JSON object with EXACT keys: "
            "ticker (string), momentum_score (0-100 float), trend ('BULLISH', 'BEARISH', or 'NEUTRAL'), "
            "and analysis (1-2 sentences of plain english technical analysis without heavy jargon)."
        )

        user_prompt = f"Analyze momentum for {ticker}. Recent daily closing prices: {prices_summary}"

        try:
            from backend.app.schemas.trading import MomentumPredictionResponse
        except ImportError:
            from app.schemas.trading import MomentumPredictionResponse

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

            return MomentumPredictionResponse(
                ticker=ticker,
                momentum_score=float(data.get("momentum_score", 50)),
                trend=str(data.get("trend", "NEUTRAL")).upper(),
                analysis=str(data.get("analysis", "Momentum appears neutral based on recent data."))
            )
        except Exception as e:
            logger.error(f"Groq API momentum error: {e}")
            return MomentumPredictionResponse(
                ticker=ticker,
                momentum_score=50,
                trend="NEUTRAL",
                analysis="Failed to generate momentum analysis."
            )

ai_engine = AIEngineService()
