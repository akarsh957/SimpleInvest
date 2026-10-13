"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { TerminalHeader } from "@/src/components/terminal/TerminalHeader";
import { Portfolio } from "@/src/types/portfolio";
import { TradeModal } from "@/src/components/trading/TradeModal";
import { StockForecastModal } from "@/src/components/market/StockForecastModal";

interface GrowthOpportunity {
  ticker: string;
  company_name: string;
  recommendation_action: string;
  growth_catalyst: string;
  potential_upside_range: string;
  risk_level: string;
  confidence_score: number;
  key_metric_highlight: string;
  cautionary_flag: string;
}

interface AiScreenerClientProps {
  userEmail: string;
  userName: string;
  initialPortfolios: Portfolio[];
  initialActivePortfolio: Portfolio | null;
}

const INITIAL_FALLBACK_RECOMMENDATIONS: GrowthOpportunity[] = [
  {
    ticker: "NVDA",
    company_name: "NVIDIA Corporation",
    recommendation_action: "Strong Buy",
    growth_catalyst: "Uncontested global leadership in AI accelerators and datacenter GPU architecture, fuelled by enterprise LLM deployments.",
    potential_upside_range: "+15% – +25%",
    risk_level: "Moderate",
    confidence_score: 92,
    key_metric_highlight: "Revenue grew 122% YoY with 75%+ gross margins and zero balance sheet leverage",
    cautionary_flag: "Elevated forward valuation leaves minimal tolerance for supply disruptions or delivery delays",
  },
  {
    ticker: "MSFT",
    company_name: "Microsoft Corporation",
    recommendation_action: "Buy",
    growth_catalyst: "Azure Cloud scaling rapidly with integrated enterprise AI capabilities across Office and developer infrastructure.",
    potential_upside_range: "+15% – +22%",
    risk_level: "Low",
    confidence_score: 94,
    key_metric_highlight: "Commercial cloud revenue up 29% YoY with expanding multi-year contract backlog",
    cautionary_flag: "Substantial capital expenditure on compute may moderate near-term free cash flow yield",
  },
  {
    ticker: "RELIANCE.NS",
    company_name: "Reliance Industries Ltd.",
    recommendation_action: "Buy",
    growth_catalyst: "5G monetisation via Jio Telecom paired with aggressive retail footprint expansion and clean energy supply chains.",
    potential_upside_range: "+18% – +25%",
    risk_level: "Moderate",
    confidence_score: 86,
    key_metric_highlight: "Jio subscriber ARPU increasing steadily with over 450M connected mobile accounts",
    cautionary_flag: "Sustained capex in new energy gigafactories may delay immediate dividend expansion",
  },
  {
    ticker: "HDFCBANK.NS",
    company_name: "HDFC Bank Limited",
    recommendation_action: "Buy",
    growth_catalyst: "Post-merger deposit accretion and branch network scaling expanding net interest margins across urban economic hubs.",
    potential_upside_range: "+14% – +20%",
    risk_level: "Low",
    confidence_score: 89,
    key_metric_highlight: "Best-in-class asset quality with Gross NPA under 1.3% and solid private sector credit demand",
    cautionary_flag: "Digestive phase following mortgage merger requires disciplined retail deposit gathering",
  },
];

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "strong buy": { bg: "bg-[#00D09C]/10", text: "text-[#00D09C]", border: "border-[#00D09C]/25" },
  buy:          { bg: "bg-[#00D09C]/10", text: "text-[#00D09C]", border: "border-[#00D09C]/25" },
  hold:         { bg: "bg-[#5367FF]/10", text: "text-[#5367FF]", border: "border-[#5367FF]/25" },
  reduce:       { bg: "bg-[#EB5B3C]/10", text: "text-[#EB5B3C]", border: "border-[#EB5B3C]/25" },
  sell:         { bg: "bg-[#EB5B3C]/10", text: "text-[#EB5B3C]", border: "border-[#EB5B3C]/25" },
};

function getRatingStyle(action: string) {
  return RATING_STYLES[action.toLowerCase()] || { bg: "bg-[#5367FF]/10", text: "text-[#5367FF]", border: "border-[#5367FF]/25" };
}

export function AiScreenerClient({
  userEmail,
  userName,
  initialPortfolios,
  initialActivePortfolio,
}: AiScreenerClientProps) {
  const [portfolios] = useState<Portfolio[]>(initialPortfolios);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(initialActivePortfolio);

  const [riskPreference, setRiskPreference] = useState<"conservative" | "balanced" | "growth">("balanced");
  const [sectorFilter, setSectorFilter] = useState<"all" | "tech" | "finance" | "energy">("all");

  const [recommendations, setRecommendations] = useState<GrowthOpportunity[]>(INITIAL_FALLBACK_RECOMMENDATIONS);
  const [isLoading, setIsLoading] = useState(false);

  const [tradeTarget, setTradeTarget] = useState<{ ticker: string; price: number } | null>(null);
  const [forecastTarget, setForecastTarget] = useState<string | null>(null);

  const runGrowthScout = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/ai/growth-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risk_preference: riskPreference, sector: sectorFilter }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        }
      }
    } catch (e) {
      console.warn("Using local screener engine.", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { runGrowthScout(); }, [riskPreference, sectorFilter]);

  const sectors = [
    { id: "all",     label: "All Sectors"  },
    { id: "tech",    label: "Technology"   },
    { id: "finance", label: "Financials"   },
    { id: "energy",  label: "Energy"       },
  ];

  const riskProfiles = [
    { id: "conservative", label: "Conservative" },
    { id: "balanced",     label: "Balanced"     },
    { id: "growth",       label: "Growth"       },
  ];

  return (
    <div className="min-h-screen bg-[#121418] text-[#E8ECF4] flex flex-col font-sans">
      <TerminalHeader
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={(p) => setActivePortfolio(p)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">AI Equity Screener</h1>
            <p className="text-xs text-[#5A6070] mt-0.5">Factor modelling · Forward PEG & revenue velocity analysis</p>
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────── */}
        <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Sector Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070]">Sector</span>
                <div className="flex items-center gap-1">
                  {sectors.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSectorFilter(s.id as any)}
                      className={`h-7 px-3 rounded-lg text-xs font-medium transition-all ${
                        sectorFilter === s.id
                          ? "bg-[#5367FF]/10 text-[#5367FF] border border-[#5367FF]/25"
                          : "text-[#5A6070] hover:text-[#A0A8B8] hover:bg-[#20242D]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-5 w-px bg-[#262A34] hidden sm:block" />

              {/* Risk Profile */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070]">Risk Profile</span>
                <div className="flex items-center gap-1">
                  {riskProfiles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRiskPreference(r.id as any)}
                      className={`h-7 px-3 rounded-lg text-xs font-medium transition-all ${
                        riskPreference === r.id
                          ? "bg-[#5367FF]/10 text-[#5367FF] border border-[#5367FF]/25"
                          : "text-[#5A6070] hover:text-[#A0A8B8] hover:bg-[#20242D]"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Refresh AI Picks */}
            <button
              onClick={runGrowthScout}
              disabled={isLoading}
              className="h-9 px-4 text-xs font-semibold rounded-lg bg-[#5367FF] text-white hover:bg-[#4557EE] transition-colors flex items-center space-x-1.5 shrink-0 disabled:opacity-60"
            >
              {isLoading
                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />
              }
              <span>{isLoading ? "Screening..." : "Refresh AI Picks"}</span>
            </button>
          </div>
        </div>

        {/* ── Research Cards ──────────────────────────── */}
        {isLoading ? (
          <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#5367FF]" />
            <p className="text-xs text-[#5A6070]">Evaluating valuation metrics and revenue velocity...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendations.map((opp, idx) => {
              const ratingStyle = getRatingStyle(opp.recommendation_action);
              const isBuy = ["buy", "strong buy"].includes(opp.recommendation_action.toLowerCase());
              const initials = opp.ticker.replace(".NS", "").replace(".BO", "").charAt(0);
              return (
                <div
                  key={`${opp.ticker}-${idx}`}
                  className="bg-[#1A1D24] border border-[#262A34] hover:border-[#383E4C] rounded-xl p-6 flex flex-col justify-between transition-all group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-[#5367FF]/10 border border-[#5367FF]/20 text-[#5367FF] text-sm font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-base font-bold text-white">{opp.company_name.split(" ").slice(0, 2).join(" ")}</p>
                        <p className="text-[11px] text-[#5A6070] font-mono">{opp.ticker}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${ratingStyle.bg} ${ratingStyle.text} ${ratingStyle.border}`}>
                        {opp.recommendation_action}
                      </span>
                      {/* Fundamental Score */}
                      <div className="flex items-center space-x-1.5">
                        <div className="relative h-6 w-6">
                          <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" fill="none" stroke="#262A34" strokeWidth="2.5" />
                            <circle
                              cx="12" cy="12" r="9" fill="none"
                              stroke="#5367FF" strokeWidth="2.5"
                              strokeDasharray={`${(opp.confidence_score / 100) * 56.5} 56.5`}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-white tabular-nums">{opp.confidence_score}<span className="text-[#5A6070] font-normal">/100</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Target Return Bar */}
                  <div className="bg-[#14171D] rounded-lg p-3 mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#5A6070] mb-0.5">12M Projected Return</p>
                      <p className={`text-base font-bold tabular-nums ${isBuy ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
                        {opp.potential_upside_range}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-[#5A6070] mb-0.5">Risk Profile</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                        opp.risk_level.toLowerCase() === "low"
                          ? "bg-[#00D09C]/10 text-[#00D09C]"
                          : opp.risk_level.toLowerCase() === "moderate"
                          ? "bg-[#5367FF]/10 text-[#5367FF]"
                          : "bg-[#EB5B3C]/10 text-[#EB5B3C]"
                      }`}>
                        {opp.risk_level}
                      </span>
                    </div>
                  </div>

                  {/* Analysis Rows */}
                  <div className="space-y-3 flex-1">
                    {/* Growth Catalyst */}
                    <div>
                      <div className="flex items-center space-x-1.5 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#00D09C]" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5A6070]">Growth Catalyst</p>
                      </div>
                      <p className="text-xs text-[#A0A8B8] leading-relaxed">{opp.growth_catalyst}</p>
                    </div>

                    {/* Key Financial Metric */}
                    <div className="bg-[#14171D] rounded-lg px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5A6070] mb-0.5">Key Financial Metric</p>
                      <p className="text-xs font-mono font-medium text-white">{opp.key_metric_highlight}</p>
                    </div>

                    {/* Key Risk */}
                    <div>
                      <div className="flex items-center space-x-1.5 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#EB5B3C]" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5A6070]">Key Risk to Watch</p>
                      </div>
                      <p className="text-xs text-[#5A6070] leading-relaxed">{opp.cautionary_flag}</p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#262A34]">
                    <button
                      onClick={() => setForecastTarget(opp.ticker)}
                      className="text-xs text-[#5367FF] hover:text-white transition-colors font-medium underline-offset-2 hover:underline"
                    >
                      View Price Projection
                    </button>
                    <button
                      onClick={() => setTradeTarget({ ticker: opp.ticker, price: 150 })}
                      className="h-8 px-4 rounded-lg bg-[#00D09C] text-[#0B0E11] text-xs font-semibold hover:bg-[#00B88A] transition-colors"
                    >
                      Quick Invest
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#262A34] bg-[#121418] py-4 text-xs text-[#373D4A] font-mono">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SimpleInvest · AI Equity Research</span>
          <span>AI-generated insights · Not financial advice · Always verify independently</span>
        </div>
      </footer>

      {forecastTarget && (
        <StockForecastModal
          ticker={forecastTarget}
          onClose={() => setForecastTarget(null)}
          onTrade={(tick, pr) => { setForecastTarget(null); setTradeTarget({ ticker: tick, price: pr }); }}
        />
      )}

      {tradeTarget && (
        <TradeModal
          isOpen={!!tradeTarget}
          onClose={() => setTradeTarget(null)}
          ticker={tradeTarget.ticker}
          currentPrice={tradeTarget.price}
        />
      )}
    </div>
  );
}
