"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, RefreshCw, Star, X, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { TerminalHeader } from "@/src/components/terminal/TerminalHeader";
import { Portfolio } from "@/src/types/portfolio";
import { StockForecastModal } from "./StockForecastModal";
import { TradeModal } from "@/src/components/trading/TradeModal";
import { getBackendUrl } from "@/src/lib/backend";

interface MarketTrendItem {
  ticker: string;
  company_name: string;
  sector: string;
  data_source?: "live" | "sample";
  currency: string;
  current_price: number;
  change: number;
  change_percent: number;
  volume: number;
  volume_formatted: string;
  fifty_two_week_low?: number;
  fifty_two_week_high?: number;
  sparkline: number[];
}

interface MarketTrendsResponse {
  all_items: MarketTrendItem[];
  gainers: MarketTrendItem[];
  losers: MarketTrendItem[];
  volume_leaders: MarketTrendItem[];
  data_status?: "live" | "partial" | "sample";
  live_items_count?: number;
  total_items_count?: number;
}

interface MarketClientProps {
  userEmail: string;
  userName: string;
  initialPortfolios: Portfolio[];
  initialActivePortfolio: Portfolio | null;
}

const MOCK_FALLBACK_TRENDS: MarketTrendsResponse = {
  all_items: [
    { ticker: "NVDA",           company_name: "NVIDIA Corporation",        sector: "Technology",       currency: "USD", current_price: 132.50, change: 4.25,   change_percent:  3.31, volume: 48200000, volume_formatted: "48.2M",  fifty_two_week_low: 108.20, fifty_two_week_high: 140.76, sparkline: [124.0, 125.5, 127.1, 126.8, 129.4, 131.0, 132.50] },
    { ticker: "AAPL",           company_name: "Apple Inc.",                sector: "Technology",       currency: "USD", current_price: 228.40, change: 1.80,   change_percent:  0.79, volume: 32100000, volume_formatted: "32.1M",  fifty_two_week_low: 164.08, fifty_two_week_high: 237.23, sparkline: [222.0, 224.1, 225.0, 226.5, 225.9, 227.2, 228.40] },
    { ticker: "MSFT",           company_name: "Microsoft Corporation",     sector: "Technology",       currency: "USD", current_price: 445.10, change: -2.30,  change_percent: -0.51, volume: 19400000, volume_formatted: "19.4M",  fifty_two_week_low: 388.25, fifty_two_week_high: 468.35, sparkline: [450.0, 448.2, 449.1, 447.0, 446.5, 447.8, 445.10] },
    { ticker: "TSLA",           company_name: "Tesla, Inc.",               sector: "Automotive",       currency: "USD", current_price: 254.30, change: 12.10,  change_percent:  5.00, volume: 68500000, volume_formatted: "68.5M",  fifty_two_week_low: 138.80, fifty_two_week_high: 271.00, sparkline: [230.0, 235.4, 238.1, 242.0, 246.5, 249.0, 254.30] },
    { ticker: "RELIANCE.NS",    company_name: "Reliance Industries Ltd.",  sector: "Energy",           currency: "INR", current_price: 2940.00,change: 35.50,  change_percent:  1.22, volume: 8500000,  volume_formatted: "8.5M",   fifty_two_week_low: 2220.00,fifty_two_week_high: 3217.90,sparkline: [2880, 2895, 2910, 2900, 2925, 2930, 2940] },
    { ticker: "TCS.NS",         company_name: "Tata Consultancy Services", sector: "Technology",       currency: "INR", current_price: 3920.00,change: -18.40, change_percent: -0.47, volume: 4200000,  volume_formatted: "4.2M",   fifty_two_week_low: 3310.00,fifty_two_week_high: 4585.90,sparkline: [3980, 3965, 3950, 3960, 3940, 3935, 3920] },
    { ticker: "HDFCBANK.NS",    company_name: "HDFC Bank Limited",         sector: "Financial Services",currency:"INR", current_price: 1685.00,change: 14.20,  change_percent:  0.85, volume: 12400000, volume_formatted: "12.4M",  fifty_two_week_low: 1363.55,fifty_two_week_high: 1794.00,sparkline: [1640, 1655, 1660, 1670, 1675, 1680, 1685] },
    { ticker: "INFY.NS",        company_name: "Infosys Limited",           sector: "Technology",       currency: "INR", current_price: 1840.00,change: 22.00,  change_percent:  1.21, volume: 6700000,  volume_formatted: "6.7M",   fifty_two_week_low: 1358.35,fifty_two_week_high: 1975.00,sparkline: [1790, 1805, 1815, 1820, 1830, 1835, 1840] },
    { ticker: "ICICIBANK.NS",   company_name: "ICICI Bank Limited",        sector: "Financial Services",currency:"INR", current_price: 1215.00,change: 11.50,  change_percent:  0.95, volume: 9100000,  volume_formatted: "9.1M",   fifty_two_week_low: 928.15, fifty_two_week_high: 1362.35,sparkline: [1180, 1190, 1195, 1200, 1205, 1210, 1215] },
    { ticker: "TATAMOTORS.NS",  company_name: "Tata Motors Limited",       sector: "Automotive",       currency: "INR", current_price: 965.00, change: -8.50,  change_percent: -0.87, volume: 11200000, volume_formatted: "11.2M",  fifty_two_week_low: 618.00, fifty_two_week_high: 1179.00,sparkline: [990, 985, 980, 975, 972, 970, 965] },
  ],
  gainers: [],
  losers: [],
  volume_leaders: [],
};

// ── Mini Sparkline ─────────────────────────────────────────
function MinimalSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 72; const h = 24; const p = 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - p * 2) + p;
    const y = h - p - ((v - min) / range) * (h - p * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={isPositive ? "#00D09C" : "#EB5B3C"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ── Pulse Card ─────────────────────────────────────────────
function PulseCard({ item, type }: { item: MarketTrendItem; type: "gainer" | "loser" | "volume" }) {
  const isPos = item.change_percent >= 0;
  const labelMap = { gainer: "Top Gainer", loser: "Top Loser", volume: "Most Active by Volume" };
  const iconMap = { gainer: TrendingUp, loser: TrendingDown, volume: Activity };
  const Icon = iconMap[type];
  const sym = item.currency === "INR" ? "₹" : "$";

  return (
    <div className="bg-[#1A1D24] border border-[#262A34] hover:border-[#383E4C] rounded-xl p-5 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#5A6070] mb-1">{labelMap[type]}</p>
          <p className="text-base font-bold text-white">{item.company_name.split(" ").slice(0, 2).join(" ")}</p>
          <p className="text-[11px] text-[#5A6070] font-mono mt-0.5">{item.ticker} · {item.sector}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            type === "gainer" ? "bg-[#00D09C]/10" : type === "loser" ? "bg-[#EB5B3C]/10" : "bg-[#5367FF]/10"
          }`}>
            <Icon className={`h-4 w-4 ${
              type === "gainer" ? "text-[#00D09C]" : type === "loser" ? "text-[#EB5B3C]" : "text-[#5367FF]"
            }`} />
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-white tabular-nums font-mono">
            {sym}{item.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className={`inline-flex text-xs font-semibold mt-1 px-2 py-0.5 rounded-md tabular-nums ${
            isPos ? "bg-[#00D09C]/10 text-[#00D09C]" : "bg-[#EB5B3C]/10 text-[#EB5B3C]"
          }`}>
            {isPos ? "+" : ""}{item.change_percent.toFixed(2)}%
          </span>
        </div>
        <MinimalSparkline data={item.sparkline} isPositive={isPos} />
      </div>
    </div>
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
  const reduceMotion = useReducedMotion();

  const [trendsData, setTrendsData] = useState<MarketTrendsResponse>(MOCK_FALLBACK_TRENDS);
  const [activeTab, setActiveTab] = useState<"watchlist" | "all" | "gainers" | "losers" | "volume">("all");
  const [marketFilter, setMarketFilter] = useState<"all" | "us" | "india">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [marketDataStatus, setMarketDataStatus] = useState<"live" | "partial" | "sample">("sample");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);

  const [selectedForecastTicker, setSelectedForecastTicker] = useState<string | null>(null);
  const [tradeModalTarget, setTradeModalTarget] = useState<{ ticker: string; price: number } | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("simpleinvest-market-watchlist");
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((ticker) => typeof ticker === "string")) {
          setWatchlist(parsed);
        } else {
          console.warn("Ignoring invalid saved market watchlist.");
        }
      }
    } catch (error) {
      console.warn("Could not restore the saved market watchlist.", error);
    } finally {
      setWatchlistLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!watchlistLoaded) return;
    try {
      window.localStorage.setItem("simpleinvest-market-watchlist", JSON.stringify(watchlist));
    } catch (error) {
      console.warn("Could not save the market watchlist.", error);
    }
  }, [watchlist, watchlistLoaded]);

  const toggleWatchlist = (ticker: string) => {
    setWatchlist((current) =>
      current.includes(ticker)
        ? current.filter((item) => item !== ticker)
        : [...current, ticker]
    );
  };

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      let res = await fetch("/api/market/trends");
      if (!res.ok) {
        res = await fetch(getBackendUrl("/api/market/trends"));
      }
      if (res.ok) {
        const json: MarketTrendsResponse = await res.json();
        if (!Array.isArray(json.all_items) || json.all_items.length === 0) {
          throw new Error("Market trends returned no instruments.");
        }
        setTrendsData(json);
        setMarketDataStatus(
          json.data_status === "live" || json.data_status === "partial"
            ? json.data_status
            : "sample"
        );
      } else {
        console.warn(`Market trends request failed (${res.status}); keeping the sample snapshot.`);
        setTrendsData(MOCK_FALLBACK_TRENDS);
        setMarketDataStatus("sample");
      }
    } catch (err) {
      console.warn("Using fallback market snapshot.", err);
      setTrendsData(MOCK_FALLBACK_TRENDS);
      setMarketDataStatus("sample");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTrends(); }, []);

  const getDisplayedItems = () => {
    let list: MarketTrendItem[] = [];
    if (activeTab === "watchlist") list = trendsData.all_items.filter((item) => watchlist.includes(item.ticker));
    else if (activeTab === "gainers")      list = trendsData.gainers.length     > 0 ? trendsData.gainers      : trendsData.all_items.filter((i) => i.change_percent >= 0);
    else if (activeTab === "losers")  list = trendsData.losers.length      > 0 ? trendsData.losers       : trendsData.all_items.filter((i) => i.change_percent < 0);
    else if (activeTab === "volume")  list = trendsData.volume_leaders.length > 0 ? trendsData.volume_leaders : [...trendsData.all_items].sort((a, b) => b.volume - a.volume);
    else                              list = trendsData.all_items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.ticker.toLowerCase().includes(q) || i.company_name.toLowerCase().includes(q) || i.sector.toLowerCase().includes(q));
    }
    if (marketFilter === "us")    list = list.filter((i) => !i.ticker.endsWith(".NS"));
    if (marketFilter === "india") list = list.filter((i) => i.ticker.endsWith(".NS"));
    return list;
  };

  const displayedItems = getDisplayedItems();
  const topGainer   = trendsData.all_items.reduce((m, i) => i.change_percent > m.change_percent ? i : m, trendsData.all_items[0]);
  const topLoser    = trendsData.all_items.reduce((m, i) => i.change_percent < m.change_percent ? i : m, trendsData.all_items[0]);
  const volumeLeader = trendsData.all_items.reduce((m, i) => i.volume > m.volume ? i : m, trendsData.all_items[0]);

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "watchlist", label: `Watchlist${watchlist.length ? ` · ${watchlist.length}` : ""}` },
    { id: "all",     label: "All Stocks"   },
    { id: "gainers", label: "Top Gainers"  },
    { id: "losers",  label: "Top Losers"   },
    { id: "volume",  label: "Most Active"  },
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

      <motion.main
        className="app-content flex-1 px-4 sm:px-6 md:px-8 space-y-6"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
      >
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Put the market in context.</h1>
            <p className="mt-1 text-sm text-[#5A6070]">Follow market movers and explore the companies behind the numbers.</p>
          </div>
          <button
            onClick={fetchTrends}
            disabled={isLoading}
            className="h-9 px-3 rounded-lg border border-[#262A34] bg-[#1A1D24] hover:bg-[#20242D] text-[#A0A8B8] text-xs flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>

        <div
          role={marketDataStatus !== "live" ? "status" : undefined}
          className={`flex flex-wrap items-center justify-between gap-2 rounded-md px-3.5 py-2.5 text-xs ${
            marketDataStatus !== "live"
              ? "border border-[#e8d9b9] bg-[#fbf6e9] text-[#796335]"
              : "border border-[#e2e5de] bg-white text-[#7c8981]"
          }`}
        >
          <span>
            {marketDataStatus === "live"
              ? "Market snapshot · Informational only"
              : marketDataStatus === "partial"
              ? `Limited live data · ${trendsData.live_items_count ?? 0} of ${trendsData.total_items_count ?? trendsData.all_items.length} stocks have live data; remaining values are sample only.`
              : "Sample market data · Live quotes are currently unavailable."}
          </span>
          <span className="text-[11px]">Prices may be delayed. Not investment advice.</span>
        </div>

        {/* ── Market Pulse Cards ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PulseCard item={topGainer}    type="gainer" />
          <PulseCard item={topLoser}     type="loser"  />
          <PulseCard item={volumeLeader} type="volume" />
        </div>

        {/* ── Equity Screener Table ───────────────────── */}
        <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-[#262A34]">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-8 px-3 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-[#00D09C] bg-[#00D09C]/5"
                      : "text-[#5A6070] hover:text-[#A0A8B8] hover:bg-[#20242D]"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#00D09C] rounded-t-sm" />
                  )}
                </button>
              ))}
            </div>

            {/* Right: Market filter + Search */}
            <div className="flex items-center space-x-2">
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value as typeof marketFilter)}
                className="h-8 rounded-lg bg-[#14171D] border border-[#262A34] px-2.5 text-xs text-[#A0A8B8] focus:outline-none focus:border-[#383E4C] cursor-pointer"
              >
                <option value="all">Global</option>
                <option value="us">US Markets</option>
                <option value="india">NSE India</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5A6070]" />
                <input
                  type="text"
                  placeholder="Search ticker or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-48 rounded-lg bg-[#14171D] border border-[#262A34] pl-8 pr-7 text-xs text-[#A0A8B8] placeholder:text-[#5A6070] focus:outline-none focus:border-[#383E4C]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5A6070] hover:text-[#A0A8B8]">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262A34] bg-[#14171D]/50 text-[11px] font-medium uppercase tracking-wider text-[#5A6070]">
                  <th className="py-3 pl-5 pr-4">Company</th>
                  <th className="py-3 px-4 text-right">Market Price</th>
                  <th className="py-3 px-4 text-right">1D Change</th>
                  <th className="py-3 px-4 text-center">7D Trend</th>
                  <th className="py-3 px-4 text-center">52W Range</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262A34]/60">
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5A6070] text-xs">
                      {activeTab === "watchlist"
                    ? "Your watchlist is empty. Select All Stocks and save companies with the star."
                    : "No matching equities found."}
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item) => {
                    const isPos = item.change_percent >= 0;
                    const sym   = item.currency === "INR" ? "₹" : "$";
                    const low   = item.fifty_two_week_low  || item.current_price * 0.85;
                    const high  = item.fifty_two_week_high || item.current_price * 1.15;
                    const posPct = Math.min(100, Math.max(0, ((item.current_price - low) / (high - low || 1)) * 100));
                    const initials = item.ticker.replace(".NS", "").replace(".BO", "").charAt(0);

                    return (
                      <tr key={item.ticker} className="hover:bg-[#20242D] transition-colors group h-14">
                        {/* Company */}
                        <td className="py-3 pl-5 pr-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-[#5367FF]/10 border border-[#5367FF]/20 text-[#5367FF] text-xs font-bold flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{item.company_name.split(" ").slice(0, 3).join(" ")}</p>
                              <p className="text-[10px] text-[#5A6070] font-mono">{item.ticker} · {item.sector}</p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-white font-semibold">
                          {sym}{item.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 1D Change */}
                        <td className="py-3 px-4 text-right tabular-nums">
                          <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isPos ? "bg-[#00D09C]/10 text-[#00D09C]" : "bg-[#EB5B3C]/10 text-[#EB5B3C]"
                          }`}>
                            {isPos ? "+" : ""}{item.change_percent.toFixed(2)}%
                          </span>
                        </td>

                        {/* 7D Trend Sparkline */}
                        <td className="py-3 px-4 text-center">
                          <MinimalSparkline data={item.sparkline} isPositive={isPos} />
                        </td>

                        {/* 52W Range */}
                        <td className="py-3 px-4 text-center min-w-[140px]">
                          <div className="max-w-[110px] mx-auto space-y-1">
                            <div className="flex justify-between text-[9px] text-[#5A6070] font-mono tabular-nums">
                              <span>{sym}{low.toFixed(0)}</span>
                              <span>{sym}{high.toFixed(0)}</span>
                            </div>
                            <div className="relative h-[3px] w-full rounded-full bg-[#262A34]">
                              <div
                                className="absolute h-2.5 w-2.5 rounded-full bg-[#00D09C] top-1/2 -translate-y-1/2 -translate-x-1/2 border-2 border-[#121418] shadow-sm shadow-[#00D09C]/30"
                                style={{ left: `${posPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Volume */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#5A6070]">
                          {item.volume_formatted}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right pr-5">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              aria-label={watchlist.includes(item.ticker) ? `Remove ${item.ticker} from watchlist` : `Add ${item.ticker} to watchlist`}
                              aria-pressed={watchlist.includes(item.ticker)}
                              onClick={() => toggleWatchlist(item.ticker)}
                              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                watchlist.includes(item.ticker)
                                  ? "text-[#246b55] hover:bg-[#e8f1eb]"
                                  : "text-[#7c8981] hover:bg-[#f0f1eb] hover:text-[#246b55]"
                              }`}
                            >
                              <Star size={14} fill={watchlist.includes(item.ticker) ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={() => setSelectedForecastTicker(item.ticker)}
                              className="h-7 px-2.5 text-[11px] rounded-lg border border-[#262A34] bg-[#14171D] text-[#A0A8B8] hover:text-white hover:border-[#383E4C] transition-colors font-medium"
                            >
                              Analyse
                            </button>
                            <button
                              onClick={() => setTradeModalTarget({ ticker: item.ticker, price: item.current_price })}
                              disabled={!item.current_price || item.current_price <= 0}
                              title={!item.current_price ? "Price unavailable for trading" : `Paper trade ${item.ticker}`}
                              className="h-7 px-2.5 text-[11px] rounded-lg bg-[#00D09C] text-[#0B0E11] hover:bg-[#00B88A] transition-colors font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Buy
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#262A34] bg-[#121418] py-4 text-xs text-[#373D4A] font-mono">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SimpleInvest · Market Intelligence</span>
          <span>Data for informational purposes only · Not financial advice</span>
        </div>
      </footer>

      {selectedForecastTicker && (
        <StockForecastModal
          ticker={selectedForecastTicker}
          onClose={() => setSelectedForecastTicker(null)}
          onTrade={(tick, pr) => {
            setSelectedForecastTicker(null);
            setTradeModalTarget({ ticker: tick, price: pr });
          }}
        />
      )}

      {tradeModalTarget && (
        <TradeModal
          isOpen={!!tradeModalTarget}
          onClose={() => setTradeModalTarget(null)}
          ticker={tradeModalTarget.ticker}
          currentPrice={tradeModalTarget.price}
        />
      )}
    </div>
  );
}
