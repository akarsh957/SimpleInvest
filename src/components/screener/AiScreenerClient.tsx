"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
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
    recommendation_action: "BUY",
    growth_catalyst: "Uncontested global monopoly in AI accelerators and datacenter GPU architecture, powered by enterprise LLM deployments.",
    potential_upside_range: "+15% - +25% (12M)",
    risk_level: "Moderate",
    confidence_score: 92,
    key_metric_highlight: "Revenue grew 122% YoY with zero balance sheet leverage and 75%+ gross margins",
    cautionary_flag: "Elevated forward valuation leaves minimal tolerance for delivery delays or supply disruptions",
  },
  {
    ticker: "MSFT",
    company_name: "Microsoft Corporation",
    recommendation_action: "BUY",
    growth_catalyst: "Azure Cloud scaling rapidly with integrated enterprise AI capabilities across Office and developer infrastructure.",
    potential_upside_range: "+15% - +22% (12M)",
    risk_level: "Low",
    confidence_score: 94,
    key_metric_highlight: "Commercial cloud revenue up 29% YoY with expanding multi-year contract backlog",
    cautionary_flag: "Substantial capital expenditure on compute facilities may moderate near-term free cash flow yield",
  },
  {
    ticker: "RELIANCE.NS",
    company_name: "Reliance Industries Ltd.",
    recommendation_action: "BUY",
    growth_catalyst: "5G monetization via Jio Telecom paired with aggressive retail footprint expansion and clean energy supply chains.",
    potential_upside_range: "+18% - +25% (12M)",
    risk_level: "Moderate",
    confidence_score: 86,
    key_metric_highlight: "Jio subscriber ARPU increasing steadily with over 450M connected mobile accounts",
    cautionary_flag: "Sustained capex in new energy gigafactories may delay immediate dividend expansion",
  },
  {
    ticker: "HDFCBANK.NS",
    company_name: "HDFC Bank Limited",
    recommendation_action: "BUY",
    growth_catalyst: "Post-merger deposit accretion and branch network scaling expanding net interest margins across urban economic hubs.",
    potential_upside_range: "+14% - +20% (12M)",
    risk_level: "Low",
    confidence_score: 89,
    key_metric_highlight: "Best-in-class asset quality with Gross NPA under 1.3% and solid private sector credit demand",
    cautionary_flag: "Digestive phase following mortgage merger requires disciplined retail deposit gathering",
  },
];

export function AiScreenerClient({
  userEmail,
  userName,
  initialPortfolios,
  initialActivePortfolio,
}: AiScreenerClientProps) {
  const [portfolios] = useState<Portfolio[]>(initialPortfolios);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(initialActivePortfolio);

  const [riskPreference, setRiskPreference] = useState<"balanced" | "aggressive">("balanced");
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
        body: JSON.stringify({
          risk_preference: riskPreference,
          sector: sectorFilter,
        }),
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

  useEffect(() => {
    runGrowthScout();
  }, [riskPreference, sectorFilter]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <TerminalHeader
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={(p) => setActivePortfolio(p)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              Quantitative Growth Screener
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              FACTOR MODELING • FORWARD PEG & REVENUE VELOCITY RADAR
            </p>
          </div>
        </div>

        {/* Filter Bar: Compact Single-Row Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-zinc-800/80 bg-[#0f0f12] rounded-md font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Target Sector Pills */}
            <div className="flex items-center space-x-1">
              <span className="text-zinc-500 uppercase text-[10px] mr-1">SECTOR:</span>
              {[
                { id: "all", label: "All" },
                { id: "tech", label: "Tech" },
                { id: "finance", label: "Financials" },
                { id: "energy", label: "Energy" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSectorFilter(s.id as any)}
                  className={`h-7 px-2.5 rounded transition-colors ${
                    sectorFilter === s.id
                      ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-zinc-800" />

            {/* Risk Profile Segmented Control */}
            <div className="flex items-center space-x-1">
              <span className="text-zinc-500 uppercase text-[10px] mr-1">RISK:</span>
              {[
                { id: "balanced", label: "Balanced" },
                { id: "aggressive", label: "Aggressive" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRiskPreference(r.id as any)}
                  className={`h-7 px-2.5 rounded transition-colors ${
                    riskPreference === r.id
                      ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: Run Screener */}
          <button
            onClick={runGrowthScout}
            disabled={isLoading}
            className="h-8 px-3 text-xs font-medium rounded bg-zinc-100 text-zinc-950 hover:bg-white transition-colors flex items-center justify-center space-x-1.5 shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Screening..." : "Run Screener"}</span>
          </button>
        </div>

        {/* Screener Cards: 2 Columns */}
        {isLoading ? (
          <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-12 text-center font-mono text-xs text-zinc-500 space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-zinc-400" />
            <p>Evaluating valuation metrics and revenue velocity...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((opp, idx) => {
              const isBuy = opp.recommendation_action?.toUpperCase() === "BUY";
              return (
                <div
                  key={`${opp.ticker}-${idx}`}
                  className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header: Ticker, Company Name, and right-aligned semantic badge + Conviction */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-mono font-bold text-zinc-100">
                            {opp.ticker}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded">
                            {opp.risk_level}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                          {opp.company_name}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                            isBuy
                              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                              : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                          }`}
                        >
                          {opp.recommendation_action}
                        </span>
                        <span className="font-mono text-xs text-zinc-300">
                          Conviction: {opp.confidence_score}%
                        </span>
                      </div>
                    </div>

                    {/* Key Target Strip: -mx-5 px-5 py-2.5 my-4 bg-zinc-900/80 border-y border-zinc-800/80 */}
                    <div className="bg-zinc-900/80 border-y border-zinc-800/80 -mx-5 px-5 py-2.5 my-4 flex justify-between items-center font-mono text-xs">
                      <span className="text-zinc-500 uppercase text-[11px] tracking-wider">
                        12M Target Upside
                      </span>
                      <span className="font-semibold text-zinc-100 tabular-nums">
                        {opp.potential_upside_range}
                      </span>
                    </div>

                    {/* Structured Thesis Rows: 3 Clean Sections */}
                    <div className="space-y-3 text-xs">
                      {/* CATALYST */}
                      <div>
                        <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1">
                          CATALYST
                        </div>
                        <p className="text-zinc-300 font-sans leading-relaxed">
                          {opp.growth_catalyst}
                        </p>
                      </div>

                      <div className="border-t border-zinc-800/50 pt-2.5">
                        <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1">
                          FUNDAMENTAL METRIC
                        </div>
                        <p className="font-mono text-xs text-zinc-200">
                          {opp.key_metric_highlight}
                        </p>
                      </div>

                      <div className="border-t border-zinc-800/50 pt-2.5">
                        <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1">
                          RISK FACTOR
                        </div>
                        <p className="text-zinc-400 font-sans leading-relaxed">
                          {opp.cautionary_flag}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Direct Action Buttons */}
                  <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-zinc-800/80 font-mono text-xs">
                    <button
                      onClick={() => setForecastTarget(opp.ticker)}
                      className="h-7 px-3 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                    >
                      View Trajectory
                    </button>
                    <button
                      onClick={() => setTradeTarget({ ticker: opp.ticker, price: 150 })}
                      className="h-7 px-3 rounded bg-zinc-100 text-zinc-950 hover:bg-white font-medium transition-colors"
                    >
                      Execute Trade
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Trajectory Modal */}
      {forecastTarget && (
        <StockForecastModal
          ticker={forecastTarget}
          onClose={() => setForecastTarget(null)}
          onTrade={(tick, pr) => {
            setForecastTarget(null);
            setTradeTarget({ ticker: tick, price: pr });
          }}
        />
      )}

      {/* Trade Modal */}
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
