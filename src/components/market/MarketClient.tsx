"use client";

import React, { useState, useEffect, useId } from "react";
import { Search, RefreshCw, X } from "lucide-react";
import { TerminalHeader } from "@/src/components/terminal/TerminalHeader";
import { Portfolio } from "@/src/types/portfolio";
import { StockForecastModal } from "./StockForecastModal";
import { TradeModal } from "@/src/components/trading/TradeModal";

interface MarketTrendItem {
  ticker: string;
  company_name: string;
  sector: string;
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
}

interface MarketClientProps {
  userEmail: string;
  userName: string;
  initialPortfolios: Portfolio[];
  initialActivePortfolio: Portfolio | null;
}

const MOCK_FALLBACK_TRENDS: MarketTrendsResponse = {
  all_items: [
    { ticker: "NVDA", company_name: "NVIDIA Corporation", sector: "Technology", currency: "USD", current_price: 132.50, change: 4.25, change_percent: 3.31, volume: 48200000, volume_formatted: "48.20M", fifty_two_week_low: 108.20, fifty_two_week_high: 140.76, sparkline: [124.0, 125.5, 127.1, 126.8, 129.4, 131.0, 132.50] },
    { ticker: "AAPL", company_name: "Apple Inc.", sector: "Technology", currency: "USD", current_price: 228.40, change: 1.80, change_percent: 0.79, volume: 32100000, volume_formatted: "32.10M", fifty_two_week_low: 164.08, fifty_two_week_high: 237.23, sparkline: [222.0, 224.1, 225.0, 226.5, 225.9, 227.2, 228.40] },
    { ticker: "MSFT", company_name: "Microsoft Corporation", sector: "Technology", currency: "USD", current_price: 445.10, change: -2.30, change_percent: -0.51, volume: 19400000, volume_formatted: "19.40M", fifty_two_week_low: 388.25, fifty_two_week_high: 468.35, sparkline: [450.0, 448.2, 449.1, 447.0, 446.5, 447.8, 445.10] },
    { ticker: "TSLA", company_name: "Tesla, Inc.", sector: "Automotive", currency: "USD", current_price: 254.30, change: 12.10, change_percent: 5.00, volume: 68500000, volume_formatted: "68.50M", fifty_two_week_low: 138.80, fifty_two_week_high: 271.00, sparkline: [230.0, 235.4, 238.1, 242.0, 246.5, 249.0, 254.30] },
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

// Crisp 1.5px Sparkline Component
function MinimalSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 24;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor = isPositive ? "#34d399" : "#fb7185";

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
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

  const [selectedForecastTicker, setSelectedForecastTicker] = useState<string | null>(null);
  const [tradeModalTarget, setTradeModalTarget] = useState<{ ticker: string; price: number } | null>(null);

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/market/trends");
      if (res.ok) {
        const json: MarketTrendsResponse = await res.json();
        setTrendsData(json);
      }
    } catch (err) {
      console.warn("Using fallback market snapshot.", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const getDisplayedItems = () => {
    let list: MarketTrendItem[] = [];
    if (activeTab === "gainers") {
      list = trendsData.gainers.length > 0 ? trendsData.gainers : trendsData.all_items.filter((i) => i.change_percent >= 0);
    } else if (activeTab === "losers") {
      list = trendsData.losers.length > 0 ? trendsData.losers : trendsData.all_items.filter((i) => i.change_percent < 0);
    } else if (activeTab === "volume") {
      list = trendsData.volume_leaders.length > 0 ? trendsData.volume_leaders : [...trendsData.all_items].sort((a, b) => b.volume - a.volume);
    } else {
      list = trendsData.all_items;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.ticker.toLowerCase().includes(q) ||
          i.company_name.toLowerCase().includes(q) ||
          i.sector.toLowerCase().includes(q)
      );
    }

    if (marketFilter === "us") {
      list = list.filter((i) => !i.ticker.endsWith(".NS"));
    } else if (marketFilter === "india") {
      list = list.filter((i) => i.ticker.endsWith(".NS"));
    }

    return list;
  };

  const displayedItems = getDisplayedItems();

  const topGainer = trendsData.all_items.reduce(
    (max, item) => (item.change_percent > max.change_percent ? item : max),
    trendsData.all_items[0]
  );
  const topLoser = trendsData.all_items.reduce(
    (min, item) => (item.change_percent < min.change_percent ? item : min),
    trendsData.all_items[0]
  );
  const volumeLeader = trendsData.all_items.reduce(
    (max, item) => (item.volume > max.volume ? item : max),
    trendsData.all_items[0]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <TerminalHeader
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={(p) => setActivePortfolio(p)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-5">
        {/* Compact Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              Markets
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              US & NSE EQUITIES • 52-WEEK CHANNELS • 7D TRAJECTORIES
            </p>
          </div>

          <button
            onClick={fetchTrends}
            disabled={isLoading}
            className="h-8 px-3 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-zinc-400" : ""}`} />
            <span>{isLoading ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>

        {/* 4-Column Hairline Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 border border-zinc-800/80 bg-[#0f0f12] rounded-md font-mono text-xs">
          <div className="p-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              WATCHLIST COVERAGE
            </span>
            <div className="text-2xl font-semibold text-zinc-100 mt-1 tabular-nums">
              {trendsData.all_items.length}
            </div>
            <span className="text-zinc-500 text-[11px]">Equities Monitored</span>
          </div>

          <div className="p-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              TOP ADVANCER
            </span>
            <div className="text-2xl font-semibold text-emerald-400 mt-1 tabular-nums">
              +{topGainer?.change_percent.toFixed(2)}%
            </div>
            <span className="text-zinc-400 text-[11px]">
              {topGainer?.ticker} ({topGainer?.company_name.split(" ")[0]})
            </span>
          </div>

          <div className="p-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              TOP DECLINER
            </span>
            <div className="text-2xl font-semibold text-rose-400 mt-1 tabular-nums">
              {topLoser?.change_percent.toFixed(2)}%
            </div>
            <span className="text-zinc-400 text-[11px]">
              {topLoser?.ticker} ({topLoser?.company_name.split(" ")[0]})
            </span>
          </div>

          <div className="p-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              VOLUME LEADER
            </span>
            <div className="text-2xl font-semibold text-zinc-100 mt-1 tabular-nums">
              {volumeLeader?.volume_formatted}
            </div>
            <span className="text-zinc-400 text-[11px]">
              {volumeLeader?.ticker}
            </span>
          </div>
        </div>

        {/* Filter & Search Toolbar: Single compact row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-zinc-800/80">
          {/* Left: Clean Segmented Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800 font-mono text-xs overflow-x-auto">
            {[
              { id: "all", label: "All" },
              { id: "gainers", label: "Top Gainers" },
              { id: "losers", label: "Top Losers" },
              { id: "volume", label: "Most Active" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Market filter + compact search input */}
          <div className="flex items-center space-x-2">
            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value as any)}
              className="h-8 rounded bg-zinc-900 border border-zinc-800 px-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="all">Global</option>
              <option value="us">US Markets</option>
              <option value="india">NSE (India)</option>
            </select>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-44 rounded bg-zinc-900 border border-zinc-800 pl-8 pr-7 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Market Data Table */}
        <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[11px] font-mono uppercase text-zinc-500">
                  <th className="py-2.5 px-4 font-medium">Ticker & Name</th>
                  <th className="py-2.5 px-4 font-medium text-right">Price</th>
                  <th className="py-2.5 px-4 font-medium text-right">24h Change</th>
                  <th className="py-2.5 px-4 font-medium text-center">7D Trend</th>
                  <th className="py-2.5 px-4 font-medium text-center">52W Range</th>
                  <th className="py-2.5 px-4 font-medium text-right">Volume</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-mono">
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-500 font-mono text-xs">
                      No matching market assets found.
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item) => {
                    const isPos = item.change_percent >= 0;
                    const low = item.fifty_two_week_low || item.current_price * 0.85;
                    const high = item.fifty_two_week_high || item.current_price * 1.15;
                    const posPct = Math.min(100, Math.max(0, ((item.current_price - low) / (high - low || 1)) * 100));

                    return (
                      <tr
                        key={item.ticker}
                        className="h-12 hover:bg-zinc-900/50 transition-colors group"
                      >
                        {/* Ticker & Name: Bold mono ticker + muted company name + subtle sector text */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-zinc-100 text-sm">
                              {item.ticker}
                            </span>
                            <span className="text-zinc-500 text-[11px] truncate max-w-[140px] font-sans">
                              {item.company_name}
                            </span>
                            <span className="text-[10px] text-zinc-600 uppercase">
                              {item.sector}
                            </span>
                          </div>
                        </td>

                        {/* Price: Right-aligned mono */}
                        <td className="py-2.5 px-4 text-right tabular-nums text-zinc-100 font-medium">
                          {item.currency === "INR" ? "₹" : "$"}{item.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 24h Change: Clean mono text in emerald/rose */}
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          <span className={isPos ? "text-emerald-400" : "text-rose-400"}>
                            {isPos ? "+" : ""}{item.change_percent.toFixed(2)}%
                          </span>
                        </td>

                        {/* 7D Trend: Crisp 1.5px sparkline */}
                        <td className="py-2.5 px-4 text-center">
                          <MinimalSparkline data={item.sparkline} isPositive={isPos} />
                        </td>

                        {/* 52W Range: Thin 2px zinc track with crisp white position dot */}
                        <td className="py-2.5 px-4 text-center min-w-[150px]">
                          <div className="max-w-[120px] mx-auto space-y-1">
                            <div className="flex justify-between text-[9px] text-zinc-500 tabular-nums">
                              <span>{item.currency === 'INR' ? '₹' : '$'}{low.toFixed(0)}</span>
                              <span>{item.currency === 'INR' ? '₹' : '$'}{high.toFixed(0)}</span>
                            </div>
                            <div className="relative h-[2px] w-full rounded-full bg-zinc-800">
                              <div
                                className="absolute h-2 w-2 rounded-full bg-zinc-100 top-1/2 -translate-y-1/2 -translate-x-1/2 border border-zinc-950 shadow-sm"
                                style={{ left: `${posPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Volume: Mono */}
                        <td className="py-2.5 px-4 text-right tabular-nums text-zinc-400">
                          {item.volume_formatted}
                        </td>

                        {/* Actions: Subtle ghost button Chart and Trade button */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedForecastTicker(item.ticker)}
                              className="h-6 px-2 text-[10px] rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors font-mono"
                            >
                              Chart
                            </button>
                            <button
                              onClick={() =>
                                setTradeModalTarget({
                                  ticker: item.ticker,
                                  price: item.current_price,
                                })
                              }
                              className="h-6 px-2 text-[10px] rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-mono font-medium"
                            >
                              Trade
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
      </main>

      {/* Stock Forecast Modal */}
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

      {/* Trade Modal */}
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
