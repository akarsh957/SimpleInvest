"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { TerminalHeader } from "@/src/components/terminal/TerminalHeader";
import { Portfolio } from "@/src/types/portfolio";
import { TradeModal } from "@/src/components/trading/TradeModal";
import { StockForecastModal } from "@/src/components/market/StockForecastModal";
import { getBackendUrl } from "@/src/lib/backend";

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
  const reduceMotion = useReducedMotion();

  const [riskPreference, setRiskPreference] = useState<"conservative" | "balanced" | "growth">("balanced");
  const [sectorFilter, setSectorFilter] = useState<"all" | "tech" | "finance" | "energy">("all");

  const [recommendations, setRecommendations] = useState<GrowthOpportunity[]>(INITIAL_FALLBACK_RECOMMENDATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSampleData, setIsSampleData] = useState(true);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [tradePendingTicker, setTradePendingTicker] = useState<string | null>(null);
  const [tradeLaunchError, setTradeLaunchError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState(INITIAL_FALLBACK_RECOMMENDATIONS[0].ticker);

  const [tradeTarget, setTradeTarget] = useState<{ ticker: string; price: number } | null>(null);
  const [forecastTarget, setForecastTarget] = useState<string | null>(null);

  const runGrowthScout = async () => {
    setIsLoading(true);
    setScoutError(null);
    try {
      const res = await fetch(getBackendUrl("/api/ai/growth-scout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risk_preference: riskPreference, sector: sectorFilter }),
      });
      if (!res.ok) {
        throw new Error(`Screener request failed (${res.status}).`);
      }

      const data: { recommendations?: GrowthOpportunity[] } = await res.json();
      if (!Array.isArray(data.recommendations)) {
        throw new Error("The screener returned an invalid response.");
      }
      setRecommendations(data.recommendations);
      setSelectedTicker(data.recommendations[0]?.ticker ?? "");
      setIsSampleData(false);
    } catch (error) {
      console.warn("Using sample screener results.", error);
      setIsSampleData(true);
      setScoutError("Live screening is unavailable. Sample results are shown for layout and learning only.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { runGrowthScout(); }, [riskPreference, sectorFilter]);

  const openPaperTrade = async (ticker: string) => {
    setTradePendingTicker(ticker);
    setTradeLaunchError(null);
    try {
      const response = await fetch("/api/market/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, timeframe: "1mo", forecast_days: 30 }),
      });
      if (!response.ok) {
        throw new Error(`A current market quote is unavailable for ${ticker}.`);
      }
      const quote: { current_price?: number } = await response.json();
      if (typeof quote.current_price !== "number" || !Number.isFinite(quote.current_price) || quote.current_price <= 0) {
        throw new Error(`A valid market quote is unavailable for ${ticker}.`);
      }
      setTradeTarget({ ticker, price: quote.current_price });
    } catch (error) {
      console.error("Unable to prepare a paper trade:", error);
      setTradeLaunchError(error instanceof Error ? error.message : "Unable to prepare this paper trade.");
    } finally {
      setTradePendingTicker(null);
    }
  };

  const sectors: { id: typeof sectorFilter; label: string }[] = [
    { id: "all",     label: "All Sectors"  },
    { id: "tech",    label: "Technology"   },
    { id: "finance", label: "Financials"   },
    { id: "energy",  label: "Energy"       },
  ];

  const riskProfiles: { id: typeof riskPreference; label: string }[] = [
    { id: "conservative", label: "Conservative" },
    { id: "balanced",     label: "Balanced"     },
    { id: "growth",       label: "Growth"       },
  ];
  const selectedOpportunity = recommendations.find((item) => item.ticker === selectedTicker)
    ?? recommendations[0]
    ?? null;

  return (
    <div className="min-h-screen bg-[#121418] text-[#E8ECF4] flex flex-col font-sans">
      <TerminalHeader
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={(p) => setActivePortfolio(p)}
      />

      <motion.main
        className="app-content flex-1 px-4 sm:px-6 md:px-8 space-y-6"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
      >
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#246b55]">Research / quantitative first</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Find companies. Understand why.</h1>
            <p className="mt-1 text-sm text-[#5A6070]">Start with transparent filters, then use AI-assisted context to ask better questions.</p>
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
                      onClick={() => setSectorFilter(s.id)}
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
                      onClick={() => setRiskPreference(r.id)}
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

        <div className={`rounded-md border px-4 py-3 text-xs leading-5 ${
          scoutError || isSampleData
            ? "border-[#ebdfc3] bg-[#fbf6e9] text-[#796335]"
            : "border-[#d4e5d9] bg-[#e8f1eb] text-[#44574f]"
        }`}>
          <p className="font-semibold">Your criteria lead. AI explains.</p>
          <p className="mt-0.5">
            {scoutError || (isSampleData
              ? "Sample research data is displayed until live screening is available."
              : "Matches and summaries are informational estimates—not investment recommendations or a promise of performance.")}
          </p>
        </div>

        {tradeLaunchError && (
          <p role="alert" className="rounded-md border border-[#edd4cf] bg-[#f8ece9] px-4 py-3 text-xs text-[#a7463b]">
            {tradeLaunchError}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-[#e2e5de] bg-white p-12 text-center">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#246b55]" />
            <p className="mt-3 text-sm font-medium text-[#20312d]">Applying your criteria</p>
            <p className="mt-1 text-xs text-[#7c8981]">Reviewing available company fundamentals…</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="rounded-xl border border-[#e2e5de] bg-white px-6 py-14 text-center">
            <h2 className="text-sm font-semibold text-[#20312d]">No companies match these criteria</h2>
            <p className="mt-1 text-xs text-[#7c8981]">Try another sector or risk profile, then apply the filters again.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-[#e2e5de] bg-white">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#e2e5de] px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#20312d]">{recommendations.length} companies match</h2>
                  <p className="mt-1 text-xs text-[#7c8981]">Sorted by the screen’s model signal · Select a company for context</p>
                </div>
                <span className="rounded-full bg-[#f0f1eb] px-2.5 py-1 text-[10px] font-medium text-[#596a63]">Research only</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e5de] bg-[#f5f7f3] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7c8981]">
                      <th className="px-5 py-3">Company</th>
                      <th className="px-4 py-3">Model signal</th>
                      <th className="px-4 py-3 text-right">Illustrative 12M range</th>
                      <th className="px-4 py-3 text-right">Risk</th>
                      <th className="px-5 py-3 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e5de]">
                    {recommendations.map((opportunity) => {
                      const ratingStyle = getRatingStyle(opportunity.recommendation_action);
                      const isSelected = selectedOpportunity?.ticker === opportunity.ticker;
                      const initials = opportunity.ticker.replace(".NS", "").replace(".BO", "").charAt(0);
                      return (
                        <tr
                          key={opportunity.ticker}
                          className={`transition-colors ${isSelected ? "bg-[#e8f1eb]" : "hover:bg-[#f5f7f3]"}`}
                        >
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => setSelectedTicker(opportunity.ticker)}
                              className="flex items-center gap-3 text-left"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9f0ed] text-xs font-semibold text-[#3c716c]">
                                {initials}
                              </span>
                              <span>
                                <span className="block font-semibold text-[#20312d]">{opportunity.company_name}</span>
                                <span className="mt-0.5 block text-[10px] text-[#7c8981]">{opportunity.ticker}</span>
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-medium ${ratingStyle.bg} ${ratingStyle.text} ${ratingStyle.border}`}>
                              {opportunity.recommendation_action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-[#246b55]">
                            {opportunity.potential_upside_range}
                          </td>
                          <td className="px-4 py-3 text-right text-[#596a63]">{opportunity.risk_level}</td>
                          <td className="px-5 py-3 text-right font-medium tabular-nums text-[#20312d]">
                            {opportunity.confidence_score}<span className="font-normal text-[#7c8981]">/100</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOpportunity && (
              <div className="rounded-xl border border-[#e2e5de] bg-white p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-[#e2e5de] pb-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7c8981]">AI-assisted explanation · {selectedOpportunity.ticker}</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#20312d]">Why {selectedOpportunity.company_name.split(" ").slice(0, 2).join(" ")} matches</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setForecastTarget(selectedOpportunity.ticker)}
                      className="h-9 rounded-md border border-[#e2e5de] bg-white px-3 text-xs font-medium text-[#596a63] transition-colors hover:bg-[#f5f7f3] hover:text-[#20312d]"
                    >
                      View price projection
                    </button>
                    <button
                      type="button"
                      onClick={() => openPaperTrade(selectedOpportunity.ticker)}
                      disabled={tradePendingTicker === selectedOpportunity.ticker}
                      className="h-9 rounded-md bg-[#246b55] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#1d5b48] disabled:cursor-wait disabled:opacity-60"
                    >
                      {tradePendingTicker === selectedOpportunity.ticker ? "Getting quote…" : "Paper trade"}
                    </button>
                  </div>
                </div>
                <div className="grid gap-5 pt-4 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#246b55]">What matches</p>
                    <p className="mt-2 text-sm leading-6 text-[#596a63]">{selectedOpportunity.growth_catalyst}</p>
                    <div className="mt-4 rounded-md bg-[#f5f7f3] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7c8981]">Metric context</p>
                      <p className="mt-1 text-xs leading-5 text-[#44574f]">{selectedOpportunity.key_metric_highlight}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#796335]">What to question</p>
                    <p className="mt-2 text-sm leading-6 text-[#596a63]">{selectedOpportunity.cautionary_flag}</p>
                    <p className="mt-4 text-xs leading-5 text-[#7c8981]">
                      Model signals and ranges can be incomplete or inaccurate. Verify source data and consider your own objectives before making decisions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </motion.main>

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
