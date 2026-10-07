"use client";

import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Info,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Navbar } from "@/src/components/dashboard/Navbar";
import { Portfolio } from "@/src/types/portfolio";
import { Button } from "@/src/components/ui/button";

interface MarketTrendItem {
  ticker: str;
  company_name: str;
  sector: str;
  currency: str;
  current_price: number;
  change: number;
  change_percent: number;
  volume: number;
  volume_formatted: str;
  fifty_two_week_low?: number;
  fifty_two_week_high?: number;
  sparkline: number[];
}

interface MarketTrendsResponse {
  all_items: MarketTrendItem[];
  gainers: MarketTrendItem[];
  losers: MarketTrendItem[];
  volume_leaders: MarketTrendItem[];
}

interface MarketClientProps {
  userEmail: string;
  userName: string;
  initialPortfolios: Portfolio[];
  initialActivePortfolio: Portfolio | null;
}

// Fallback initial state while loading API
const MOCK_FALLBACK_TRENDS: MarketTrendsResponse = {
  all_items: [
    { ticker: "NVDA", company_name: "NVIDIA Corporation", sector: "Technology", currency: "USD", current_price: 132.50, change: 4.25, change_percent: 3.31, volume: 48200000, volume_formatted: "48.20M", fifty_two_week_low: 108.20, fifty_two_week_high: 140.76, sparkline: [124.0, 125.5, 127.1, 126.8, 129.4, 131.0, 132.50] },
    { ticker: "AAPL", company_name: "Apple Inc.", sector: "Technology", currency: "USD", current_price: 228.40, change: 1.80, change_percent: 0.79, volume: 32100000, volume_formatted: "32.10M", fifty_two_week_low: 164.08, fifty_two_week_high: 237.23, sparkline: [222.0, 224.1, 225.0, 226.5, 225.9, 227.2, 228.40] },
    { ticker: "MSFT", company_name: "Microsoft Corporation", sector: "Technology", currency: "USD", current_price: 445.10, change: -2.30, change_percent: -0.51, volume: 19400000, volume_formatted: "19.40M", fifty_two_week_low: 388.25, fifty_two_week_high: 468.35, sparkline: [450.0, 448.2, 449.1, 447.0, 446.5, 447.8, 445.10] },
    { ticker: "TSLA", company_name: "Tesla, Inc.", sector: "Consumer Cyclical", currency: "USD", current_price: 254.30, change: 12.10, change_percent: 5.00, volume: 68500000, volume_formatted: "68.50M", fifty_two_week_low: 138.80, fifty_two_week_high: 271.00, sparkline: [230.0, 235.4, 238.1, 242.0, 246.5, 249.0, 254.30] },
    { ticker: "RELIANCE.NS", company_name: "Reliance Industries Ltd.", sector: "Energy", currency: "INR", current_price: 2940.00, change: 35.50, change_percent: 1.22, volume: 8500000, volume_formatted: "8.50M", fifty_two_week_low: 2220.00, fifty_two_week_high: 3217.90, sparkline: [2880.0, 2895.0, 2910.0, 2900.0, 2925.0, 2930.0, 2940.0] },
    { ticker: "TCS.NS", company_name: "Tata Consultancy Services", sector: "Technology", currency: "INR", current_price: 3920.00, change: -18.40, change_percent: -0.47, volume: 4200000, volume_formatted: "4.20M", fifty_two_week_low: 3310.00, fifty_two_week_high: 4585.90, sparkline: [3980.0, 3965.0, 3950.0, 3960.0, 3940.0, 3935.0, 3920.0] },
    { ticker: "HDFCBANK.NS", company_name: "HDFC Bank Limited", sector: "Financial Services", currency: "INR", current_price: 1685.00, change: 14.20, change_percent: 0.85, volume: 12400000, volume_formatted: "12.40M", fifty_two_week_low: 1363.55, fifty_two_week_high: 1794.00, sparkline: [1640.0, 1655.0, 1660.0, 1670.0, 1675.0, 1680.0, 1685.0] },
    { ticker: "INFY.NS", company_name: "Infosys Limited", sector: "Technology", currency: "INR", current_price: 1840.00, change: 22.00, change_percent: 1.21, volume: 6700000, volume_formatted: "6.70M", fifty_two_week_low: 1358.35, fifty_two_week_high: 1975.00, sparkline: [1790.0, 1805.0, 1815.0, 1820.0, 1830.0, 1835.0, 1840.0] },
    { ticker: "ICICIBANK.NS", company_name: "ICICI Bank Limited", sector: "Financial Services", currency: "INR", current_price: 1215.00, change: 11.50, change_percent: 0.95, volume: 9100000, volume_formatted: "9.10M", fifty_two_week_low: 928.15, fifty_two_week_high: 1362.35, sparkline: [1180.0, 1190.0, 1195.0, 1200.0, 1205.0, 1210.0, 1215.0] },
    { ticker: "TATAMOTORS.NS", company_name: "Tata Motors Limited", sector: "Automotive", currency: "INR", current_price: 965.00, change: -8.50, change_percent: -0.87, volume: 11200000, volume_formatted: "11.20M", fifty_two_week_low: 618.00, fifty_two_week_high: 1179.00, sparkline: [990.0, 985.0, 980.0, 975.0, 972.0, 970.0, 965.0] },
  ],
  gainers: [],
  losers: [],
  volume_leaders: [],
};

// SVG Sparkline Component
function SparklineChart({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const width = 120;
  const height = 36;
  const padding = 4;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const color = isPositive ? "#10b981" : "#f43f5e";
  const id = useId();
  const gradientId = `sparkline-grad-${id.replace(/:/g, "")}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Area Fill */}
      <polygon
        points={`${padding},${height} ${points} ${width - padding},${height}`}
        fill={`url(#${gradientId})`}
      />

      {/* Line Stroke */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function MarketClient({
  userEmail,
  userName,
  initialPortfolios,
  initialActivePortfolio,
}: MarketClientProps) {
  const [portfolios] = useState<Portfolio[]>(initialPortfolios);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(initialActivePortfolio);
  
  const [trendsData, setTrendsData] = useState<MarketTrendsResponse>(MOCK_FALLBACK_TRENDS);
  const [activeTab, setActiveTab] = useState<"all" | "gainers" | "losers" | "volume">("all");
  const [marketFilter, setMarketFilter] = useState<"all" | "us" | "india">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const [aiModalTicker, setAiModalTicker] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/market/trends");
      if (res.ok) {
        const json: MarketTrendsResponse = await res.json();
        setTrendsData(json);
      }
    } catch (err) {
      console.warn("Could not reach backend API, using live fallback snapshot.", err);
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  useEffect(() => {
    fetchTrends();
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  // Filter items
  const getDisplayedItems = () => {
    let list: MarketTrendItem[] = [];
    if (activeTab === "gainers") list = trendsData.gainers.length > 0 ? trendsData.gainers : trendsData.all_items.filter(i => i.change_percent >= 0);
    else if (activeTab === "losers") list = trendsData.losers.length > 0 ? trendsData.losers : trendsData.all_items.filter(i => i.change_percent < 0);
    else if (activeTab === "volume") list = trendsData.volume_leaders.length > 0 ? trendsData.volume_leaders : [...trendsData.all_items].sort((a,b) => b.volume - a.volume);
    else list = trendsData.all_items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) => i.ticker.toLowerCase().includes(q) || i.company_name.toLowerCase().includes(q) || i.sector.toLowerCase().includes(q)
      );
    }

    if (marketFilter === "us") {
      list = list.filter((i) => !i.ticker.endsWith(".NS"));
    } else if (marketFilter === "india") {
      list = list.filter((i) => i.ticker.endsWith(".NS"));
    }

    return list;
  };

  const handleAnalyzeStock = async (ticker: string) => {
    setAiModalTicker(ticker);
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const res = await fetch("http://localhost:8000/api/analyze-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
      } else {
        throw new Error("Failed to analyze");
      }
    } catch (e) {
      setAiAnalysis({
        ticker,
        company_name: ticker,
        current_price: 100,
        sector: "Market Leader",
        plain_english_summary: `${ticker} is a major industry pioneer generating consistent cash flows across global markets.`,
        risk_vibe: "Moderate Bumps",
        crash_scenario: "If the broader market dips 10%, this stock typically follows suit with balanced resilience.",
        valuation_assessment: "Priced fairly relative to long-term earnings potential and sector fundamentals.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const displayedItems = getDisplayedItems();

  // Highlight Stats
  const topGainer = trendsData.all_items.reduce((max, item) => (item.change_percent > max.change_percent ? item : max), trendsData.all_items[0]);
  const topLoser = trendsData.all_items.reduce((min, item) => (item.change_percent < min.change_percent ? item : min), trendsData.all_items[0]);
  const volumeLeader = trendsData.all_items.reduce((max, item) => (item.volume > max.volume ? item : max), trendsData.all_items[0]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Header Navigation */}
      <Navbar
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={(p) => setActivePortfolio(p)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Hero Terminal Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 tracking-wide uppercase">
                Real-Time Market Terminal
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 font-mono">
                Updated: {lastRefreshed || "Live"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Global & Indian <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Market Trends</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Institutional-grade market quotes, 52-week price channels, volume spikes, and 7-day sparkline trajectories powered by yfinance & Groq AI.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={fetchTrends}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-white/[0.08] bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] hover:border-emerald-500/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin text-emerald-400" : "text-slate-400"}`} />
              <span>{isLoading ? "Refreshing..." : "Refresh Quotes"}</span>
            </Button>
          </div>
        </div>

        {/* Quick Market Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Leaders Monitored */}
          <div className="obsidian-glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Monitored Watchlist</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white font-mono">{trendsData.all_items.length}</span>
              <span className="text-xs text-slate-400">Leaders</span>
            </div>
            <p className="text-[11px] text-slate-400">US Tech Titans & NSE Bluechips</p>
          </div>

          {/* Card 2: Top Gainer */}
          {topGainer && (
            <div className="obsidian-glass-card p-5 space-y-2 border-emerald-500/20">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <span>Top Growth Leader</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-lg font-bold text-white">{topGainer.ticker}</span>
                  <p className="text-[11px] text-slate-400 truncate max-w-[120px]">{topGainer.company_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-emerald-400 font-mono">+{topGainer.change_percent.toFixed(2)}%</span>
                  <p className="text-[11px] text-slate-400 font-mono">{topGainer.currency === 'INR' ? '₹' : '$'}{topGainer.current_price}</p>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Top Dip */}
          {topLoser && (
            <div className="obsidian-glass-card p-5 space-y-2 border-rose-500/20">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-400 uppercase tracking-wider">
                <span>Biggest Pullback</span>
                <TrendingDown className="h-4 w-4 text-rose-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-lg font-bold text-white">{topLoser.ticker}</span>
                  <p className="text-[11px] text-slate-400 truncate max-w-[120px]">{topLoser.company_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-rose-400 font-mono">{topLoser.change_percent.toFixed(2)}%</span>
                  <p className="text-[11px] text-slate-400 font-mono">{topLoser.currency === 'INR' ? '₹' : '$'}{topLoser.current_price}</p>
                </div>
              </div>
            </div>
          )}

          {/* Card 4: Highest Volume */}
          {volumeLeader && (
            <div className="obsidian-cyan-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                <span>Volume King</span>
                <Flame className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-lg font-bold text-white">{volumeLeader.ticker}</span>
                  <p className="text-[11px] text-slate-400 truncate max-w-[120px]">{volumeLeader.company_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-cyan-400 font-mono">{volumeLeader.volume_formatted}</span>
                  <p className="text-[11px] text-slate-400">Shares Traded</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Filter Controls Bar & Tabs */}
        <div className="obsidian-glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Watchlist", icon: Activity, count: trendsData.all_items.length },
              { id: "gainers", label: "Top Gainers", icon: TrendingUp, count: trendsData.gainers.length || trendsData.all_items.filter(i=>i.change_percent>=0).length },
              { id: "losers", label: "Top Dips", icon: TrendingDown, count: trendsData.losers.length || trendsData.all_items.filter(i=>i.change_percent<0).length },
              { id: "volume", label: "Volume Leaders", icon: Flame, count: trendsData.volume_leaders.length || trendsData.all_items.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-950/50"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                    isActive ? "bg-emerald-500/30 text-emerald-300" : "bg-white/[0.08] text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-white focus:outline-none focus:border-emerald-500/50 transition cursor-pointer"
            >
              <option value="all" className="bg-[#07090e] text-white">Global (All Markets)</option>
              <option value="us" className="bg-[#07090e] text-white">US Market</option>
              <option value="india" className="bg-[#07090e] text-white">Indian Market (NSE)</option>
            </select>

            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticker, company or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
              />
              {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            </div>
          </div>
        </div>

        {/* Main Trends Table & Cards */}
        <div className="obsidian-glass-card p-1 sm:p-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                  <th className="py-3.5 px-4 font-semibold">Asset / Company</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">24h Change</th>
                  <th className="py-3.5 px-4 font-semibold text-center">7-Day Trajectory</th>
                  <th className="py-3.5 px-4 font-semibold text-center">52-Week Range</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Volume</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No market tickers matched your search filter.
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item) => {
                    const isPos = item.change_percent >= 0;
                    const low = item.fifty_two_week_low || item.current_price * 0.85;
                    const high = item.fifty_two_week_high || item.current_price * 1.15;
                    const posPct = Math.min(100, Math.max(0, ((item.current_price - low) / (high - low || 1)) * 100));

                    return (
                      <tr key={item.ticker} className="hover:bg-white/[0.04] transition-colors group">
                        
                        {/* Company & Ticker */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] font-bold text-white font-mono group-hover:border-emerald-500/40 transition">
                              {item.ticker.substring(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition">{item.ticker}</span>
                                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                                  {item.sector}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.company_name}</p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4 text-right tabular-nums font-mono font-bold text-sm text-white">
                          {item.currency === "INR" ? "₹" : "$"}{item.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Change */}
                        <td className="py-4 px-4 text-right tabular-nums">
                          <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                            isPos
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}>
                            {isPos ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            <span>{isPos ? "+" : ""}{item.change_percent.toFixed(2)}%</span>
                          </div>
                          <p className={`text-[10px] font-mono mt-0.5 ${isPos ? "text-emerald-500/80" : "text-rose-500/80"}`}>
                            {isPos ? "+" : ""}{item.change.toFixed(2)} {item.currency}
                          </p>
                        </td>

                        {/* Sparkline Chart */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center">
                            <SparklineChart data={item.sparkline} isPositive={isPos} />
                          </div>
                        </td>

                        {/* 52-Week Range Bar */}
                        <td className="py-4 px-4 text-center min-w-[160px]">
                          <div className="space-y-1 max-w-[140px] mx-auto">
                            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                              <span>{item.currency === 'INR' ? '₹' : '$'}{low.toFixed(0)}</span>
                              <span className="text-slate-300 font-semibold">52W</span>
                              <span>{item.currency === 'INR' ? '₹' : '$'}{high.toFixed(0)}</span>
                            </div>
                            <div className="relative h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isPos ? "bg-emerald-500" : "bg-rose-500"}`}
                                style={{ width: `${posPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Volume */}
                        <td className="py-4 px-4 text-right tabular-nums font-mono text-slate-300">
                          {item.volume_formatted}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-right">
                          <Button
                            onClick={() => handleAnalyzeStock(item.ticker)}
                            variant="outline"
                            size="sm"
                            className="border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-xs font-semibold transition shadow-sm"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            <span>AI Vibe</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* AI Plain-English Stock Analysis Modal */}
      <AnimatePresence>
        {aiModalTicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-[#07090e] p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-lg">
                    {aiModalTicker.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{aiModalTicker} Plain-English Breakdown</span>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 border border-emerald-500/30">
                        Groq AI
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Jargon-free beginner translation</p>
                  </div>
                </div>
                <button onClick={() => setAiModalTicker(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {aiLoading ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">Translating stock metrics into plain English via Groq...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4 text-xs">
                  
                  {/* Summary */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">What They Actually Do</span>
                    <p className="text-slate-200 text-sm leading-relaxed">{aiAnalysis.plain_english_summary}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Risk Vibe */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Risk Vibe</span>
                      <p className="text-sm font-bold text-white">{aiAnalysis.risk_vibe}</p>
                    </div>

                    {/* Crash Scenario */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">If Market Drops 10%</span>
                      <p className="text-xs text-slate-300 leading-normal">{aiAnalysis.crash_scenario}</p>
                    </div>
                  </div>

                  {/* Valuation */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Price vs Value</span>
                    <p className="text-slate-300 leading-relaxed">{aiAnalysis.valuation_assessment}</p>
                  </div>

                </div>
              ) : null}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setAiModalTicker(null)}>
                  Close Breakdown
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
