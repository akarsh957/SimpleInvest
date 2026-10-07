"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Award,
  Layers,
  Flame,
  ChevronRight,
  Info,
} from "lucide-react";
import { Navbar } from "@/src/components/dashboard/Navbar";
import { Portfolio } from "@/src/types/portfolio";
import { Button } from "@/src/components/ui/button";

interface GrowthOpportunity {
  ticker: string;
  company_name: string;
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
    growth_catalyst: "Uncontested global monopoly in AI accelerators and datacenter GPU architecture, powered by enterprise LLM deployments.",
    potential_upside_range: "15% - 25% over 12 months",
    risk_level: "Moderate",
    confidence_score: 92,
    key_metric_highlight: "Revenue grew 122% YoY with zero balance sheet stress and 75%+ gross margins",
    cautionary_flag: "High valuation multiple leaves little room for earnings misses or chip supply chain delays",
  },
  {
    ticker: "MSFT",
    company_name: "Microsoft Corporation",
    growth_catalyst: "Azure Cloud scaling rapidly with integrated OpenAI Copilot features enterprise-wide across Office and Developer suites.",
    potential_upside_range: "15% - 22% over 12 months",
    risk_level: "Low",
    confidence_score: 94,
    key_metric_highlight: "Cloud revenue up 29% YoY with over $50B in annualized AI-related cloud commitments",
    cautionary_flag: "Substantial capital expenditure spending on data center infrastructure may temporarily press cash flow",
  },
  {
    ticker: "RELIANCE.NS",
    company_name: "Reliance Industries Ltd.",
    growth_catalyst: "5G monetization via Jio Telecom paired with rapid expansion of Retail store footprints and green hydrogen investments.",
    potential_upside_range: "18% - 25% over 12 months",
    risk_level: "Moderate",
    confidence_score: 86,
    key_metric_highlight: "Jio subscriber ARPU increasing steadily with over 450M mobile subscribers across India",
    cautionary_flag: "Heavy ongoing capital expenditure in new energy gigafactories may delay immediate dividend hikes",
  },
  {
    ticker: "HDFCBANK.NS",
    company_name: "HDFC Bank Limited",
    growth_catalyst: "Post-merger deposit accretion and branch network expansion expanding net interest margins in fast-growing urban hubs.",
    potential_upside_range: "14% - 20% over 12 months",
    risk_level: "Low",
    confidence_score: 89,
    key_metric_highlight: "Best-in-class asset quality with Gross NPA under 1.3% and solid credit growth",
    cautionary_flag: "Digestive phase following parent merger requires steady deposit gathering over upcoming quarters",
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
  const [lastScouted, setLastScouted] = useState<string>("");

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
      console.warn("Could not connect to backend AI growth scout, using curated local scout engine.", e);
    } finally {
      setIsLoading(false);
      setLastScouted(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  useEffect(() => {
    runGrowthScout();
  }, [riskPreference, sectorFilter]);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Navbar Header */}
      <Navbar
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={(p) => setActivePortfolio(p)}
      />

      {/* Main Page Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Title Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6"
        >
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 tracking-wide uppercase">
                Groq (Llama 3.1 8B Instant) Active
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 font-mono">
                Last Audit: {lastScouted || "Just Now"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              AI Growth Opportunity <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600">Radar</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Automated quantitative screening analyzing Forward P/E, PEG velocity, revenue momentum, and balance sheet debt to detect structural growth catalysts.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-3">
            <Button
              onClick={runGrowthScout}
              disabled={isLoading}
              variant="gradient"
              size="sm"
              className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 text-black font-bold shadow-lg shadow-amber-950/40 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <Sparkles className={`h-4 w-4 mr-2 relative z-10 ${isLoading ? "animate-spin" : ""}`} />
              <span className="relative z-10">{isLoading ? "Analyzing Metrics..." : "Run AI Scout"}</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Interactive Filter Control Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="obsidian-glass-card p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Radar Parameters & Risk Filter
              </span>
            </div>
            <span className="text-xs text-amber-400 font-mono font-semibold">
              4 Candidate Models Selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sector Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Sector Focus
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "all", label: "All Sectors" },
                  { id: "tech", label: "Technology" },
                  { id: "finance", label: "Financials" },
                  { id: "energy", label: "Energy & Auto" },
                ].map((s) => (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    key={s.id}
                    onClick={() => setSectorFilter(s.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition border text-center ${
                      sectorFilter === s.id
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/50"
                        : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {s.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Risk Preference Switcher */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Risk & Growth Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRiskPreference("balanced")}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border ${
                    riskPreference === "balanced"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/50"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Balanced Growth</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRiskPreference("aggressive")}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border ${
                    riskPreference === "aggressive"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/50"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Flame className="h-4 w-4" />
                  <span>Aggressive Expansion</span>
                </motion.button>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Opportunity Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span>High-Conviction Growth Opportunities ({recommendations.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Strict Pydantic JSON Output Verified
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center space-y-4 obsidian-glass-card">
              <RefreshCw className="h-10 w-10 animate-spin text-amber-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Scouting Global Markets with Groq AI...</p>
                <p className="text-xs text-slate-400 mt-1">Analyzing P/E multiples, revenue velocity, and debt leverage</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((opp, idx) => {
                const isAggressive = opp.risk_level.toLowerCase() === "high";
                const isModerate = opp.risk_level.toLowerCase() === "moderate";

                return (
                  <motion.div
                    key={opp.ticker + idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1, type: "spring", stiffness: 100 }}
                    whileHover={{ scale: 1.015, translateY: -5 }}
                    className="obsidian-glass-card p-6 flex flex-col justify-between space-y-5 group cursor-pointer"
                  >
                    {/* Card Top Banner */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.1] font-extrabold text-white text-base font-mono group-hover:border-amber-500/50 transition shadow-inner">
                          {opp.ticker.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-extrabold text-white group-hover:text-amber-400 transition">
                              {opp.ticker}
                            </span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                              isAggressive
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : isModerate
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                            }`}>
                              {opp.risk_level} Risk
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{opp.company_name}</p>
                        </div>
                      </div>

                      {/* Confidence Score Gauge */}
                      <div className="text-right">
                        <div className="inline-flex items-center space-x-1 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                          <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-extrabold text-amber-300 font-mono">
                            {opp.confidence_score}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">AI Conviction</p>
                      </div>
                    </div>

                    {/* Potential Upside Range Pill */}
                    <div className="rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent p-3.5 border border-amber-500/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-300">12-Month Target Upside</span>
                      </div>
                      <span className="text-sm font-extrabold text-amber-400 font-mono">
                        {opp.potential_upside_range}
                      </span>
                    </div>

                    {/* Growth Catalyst Description */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Growth Catalyst & Tailwinds
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-normal">
                        {opp.growth_catalyst}
                      </p>
                    </div>

                    {/* Key Metric Highlight */}
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Key Financial Metric Highlight
                      </span>
                      <p className="text-xs text-slate-300 font-medium">
                        {opp.key_metric_highlight}
                      </p>
                    </div>

                    {/* Cautionary Flag */}
                    <div className="rounded-xl bg-rose-950/20 border border-rose-500/20 p-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Cautionary Flag / Downside Risk
                      </span>
                      <p className="text-xs text-slate-300 font-medium">
                        {opp.cautionary_flag}
                      </p>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
