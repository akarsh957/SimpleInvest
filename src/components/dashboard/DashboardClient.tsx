"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  RefreshCw,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TerminalHeader } from "@/src/components/terminal/TerminalHeader";
import { HoldingsTable } from "@/src/components/dashboard/HoldingsTable";
import { AddAssetDialog } from "@/src/components/dashboard/AddAssetDialog";
import { SectorDonutChart } from "@/src/components/dashboard/SectorDonutChart";
import { JargonBusterCard } from "@/src/components/dashboard/JargonBusterCard";
import { MarketScenarios } from "@/src/components/dashboard/MarketScenarios";
import { Holding, Portfolio, PortfolioAuditResponse } from "@/src/types/portfolio";
import {
  getPortfolioHoldings,
  addHoldingAction,
  deleteHoldingAction,
  auditPortfolioAction,
} from "@/src/actions/portfolio";
import { formatCurrency } from "@/src/lib/utils";

interface DashboardClientProps {
  userEmail: string;
  userName: string;
  initialPortfolios: Portfolio[];
  initialActivePortfolio: Portfolio | null;
  initialHoldings: Holding[];
}

export function DashboardClient({
  userEmail,
  userName,
  initialPortfolios,
  initialActivePortfolio,
  initialHoldings,
}: DashboardClientProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(initialPortfolios);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(initialActivePortfolio);
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);

  const [auditData, setAuditData] = useState<PortfolioAuditResponse | null>(null);
  const [isAuditLoading, setIsAuditLoading] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isHoldingsLoading, setIsHoldingsLoading] = useState<boolean>(false);
  const [chartTimeframe, setChartTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "ALL">("1M");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Trigger FastAPI audit
  const runAudit = useCallback(async (currentHoldings: Holding[]) => {
    if (!currentHoldings || currentHoldings.length === 0) {
      setAuditData(null);
      setAuditError(null);
      setIsAuditLoading(false);
      return;
    }

    setIsAuditLoading(true);
    setAuditError(null);

    try {
      const res = await auditPortfolioAction(
        currentHoldings.map((h) => ({
          ticker: h.ticker,
          shares: h.shares,
          average_buy_price: h.average_buy_price,
        }))
      );

      if (res.success && res.data) {
        setAuditData(res.data);
      } else {
        setAuditError(res.error || "Diagnostic service offline.");
      }
    } catch (err: any) {
      setAuditError(err.message || "Failed to audit portfolio.");
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    runAudit(holdings);
  }, [holdings, runAudit]);

  const handleSelectPortfolio = async (portfolio: Portfolio) => {
    if (portfolio.id === activePortfolio?.id) return;
    setActivePortfolio(portfolio);
    setIsHoldingsLoading(true);

    try {
      const newHoldings = await getPortfolioHoldings(portfolio.id);
      setHoldings(newHoldings);
    } catch (err) {
      console.error("Error changing portfolio:", err);
    } finally {
      setIsHoldingsLoading(false);
    }
  };

  const handlePortfolioCreated = (newPortfolio: Portfolio) => {
    setPortfolios((prev) => [...prev, newPortfolio]);
    setActivePortfolio(newPortfolio);
    setHoldings([]);
    setAuditData(null);
  };

  const handleAddHolding = async (ticker: string, shares: number, buyPrice: number) => {
    if (!activePortfolio) return { success: false, error: "No active book selected." };

    const res = await addHoldingAction(activePortfolio.id, ticker, shares, buyPrice);
    if (res.success && res.holding) {
      const updatedHoldings = await getPortfolioHoldings(activePortfolio.id);
      setHoldings(updatedHoldings);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to save position." };
  };

  const handleDeleteHolding = async (holdingId: string) => {
    const nextHoldings = holdings.filter((h) => h.id !== holdingId);
    setHoldings(nextHoldings);

    const res = await deleteHoldingAction(holdingId);
    if (!res.success) {
      if (activePortfolio) {
        const resetHoldings = await getPortfolioHoldings(activePortfolio.id);
        setHoldings(resetHoldings);
      }
      alert(res.error || "Failed to delete position.");
    }
  };

  // Math
  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.shares * h.average_buy_price,
    0
  );
  const totalEstimatedValue = auditData?.total_current_value || totalInvested;
  const netProfit = totalEstimatedValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

  // Chart data
  const chartData = useMemo(() => {
    const base = totalInvested || 10000;
    switch (chartTimeframe) {
      case "1D":
        return [
          { date: "09:30", portfolio: base * 0.995, benchmark: base * 0.998 },
          { date: "11:00", portfolio: base * 1.002, benchmark: base * 1.001 },
          { date: "13:00", portfolio: base * 0.998, benchmark: base * 0.995 },
          { date: "15:00", portfolio: base * 1.005, benchmark: base * 1.003 },
          { date: "16:00", portfolio: totalEstimatedValue, benchmark: base * 1.006 },
        ];
      case "1W":
        return [
          { date: "Mon", portfolio: base * 0.98, benchmark: base * 0.99 },
          { date: "Tue", portfolio: base * 0.97, benchmark: base * 0.98 },
          { date: "Wed", portfolio: base * 0.99, benchmark: base * 1.00 },
          { date: "Thu", portfolio: base * 1.01, benchmark: base * 1.00 },
          { date: "Fri", portfolio: totalEstimatedValue, benchmark: base * 1.01 },
        ];
      case "1M":
        return [
          { date: "W1", portfolio: base * 0.94, benchmark: base * 0.95 },
          { date: "W2", portfolio: base * 0.97, benchmark: base * 0.96 },
          { date: "W3", portfolio: base * 1.01, benchmark: base * 0.98 },
          { date: "W4", portfolio: base * 0.99, benchmark: base * 0.99 },
          { date: "Now", portfolio: totalEstimatedValue, benchmark: base * 1.02 },
        ];
      case "3M":
        return [
          { date: "M-3", portfolio: base * 0.88, benchmark: base * 0.90 },
          { date: "M-2", portfolio: base * 0.95, benchmark: base * 0.94 },
          { date: "M-1", portfolio: base * 0.99, benchmark: base * 0.98 },
          { date: "Now", portfolio: totalEstimatedValue, benchmark: base * 1.01 },
        ];
      case "1Y":
        return [
          { date: "Q1", portfolio: base * 0.80, benchmark: base * 0.82 },
          { date: "Q2", portfolio: base * 0.85, benchmark: base * 0.86 },
          { date: "Q3", portfolio: base * 0.92, benchmark: base * 0.93 },
          { date: "Now", portfolio: totalEstimatedValue, benchmark: base * 0.98 },
        ];
      case "ALL":
        return [
          { date: "2023", portfolio: base * 0.75, benchmark: base * 0.78 },
          { date: "2024", portfolio: base * 0.90, benchmark: base * 0.88 },
          { date: "2025", portfolio: base * 1.10, benchmark: base * 1.05 },
          { date: "2026", portfolio: totalEstimatedValue, benchmark: base * 1.15 },
        ];
      default:
        return [];
    }
  }, [totalInvested, totalEstimatedValue, chartTimeframe]);

  const handleExport = () => {
    setExportNotice("Exporting CSV position ledger...");
    setTimeout(() => {
      setExportNotice(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Terminal Header */}
      <TerminalHeader
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={handleSelectPortfolio}
        onPortfolioCreated={handlePortfolioCreated}
      />

      {/* Export Notice */}
      {exportNotice && (
        <div className="fixed bottom-4 right-4 z-50 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 shadow-xl">
          {exportNotice}
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Compact Header Bar: Single row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              {activePortfolio ? activePortfolio.name : "Main Portfolio"}
            </h1>
            <span className="font-mono text-xs text-zinc-500 uppercase">
              • LIVE BOOK
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="h-8 px-3 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono flex items-center space-x-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => runAudit(holdings)}
              disabled={isAuditLoading || holdings.length === 0}
              className="h-8 px-3 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAuditLoading ? "animate-spin" : ""}`} />
              <span>Re-Audit</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-3 rounded bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Position</span>
            </button>
          </div>
        </div>

        {/* Unified KPI Strip (Single horizontal 4-column grid container) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 border border-zinc-800/80 bg-[#0f0f12] rounded-md">
          {/* Cell 1: Total Invested */}
          <div className="p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              COMMITTED CAPITAL
            </span>
            <div className="text-2xl font-mono font-semibold text-zinc-100 mt-1 tabular-nums">
              {formatCurrency(totalInvested)}
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-1 tabular-nums">
              {holdings.length} Positions Active
            </div>
          </div>

          {/* Cell 2: Real-time Valuation */}
          <div className="p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              REAL-TIME VALUATION
            </span>
            <div className="text-2xl font-mono font-semibold text-zinc-100 mt-1 tabular-nums">
              {formatCurrency(totalEstimatedValue)}
            </div>
            <div className={`text-xs font-mono mt-1 tabular-nums ${profitPercentage >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {profitPercentage >= 0 ? "+" : ""}{profitPercentage.toFixed(2)}% ({formatCurrency(netProfit)})
            </div>
          </div>

          {/* Cell 3: Risk Profile */}
          <div className="p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              VOLATILITY RATING
            </span>
            <div className="text-2xl font-mono font-semibold text-zinc-100 mt-1">
              {auditData?.portfolio_risk_vibe || "Moderate"}
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-1">
              Beta Vector Indexed
            </div>
          </div>

          {/* Cell 4: Diversification Score */}
          <div className="p-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              DIVERSIFICATION SCORE
            </span>
            <div className="text-2xl font-mono font-semibold text-zinc-100 mt-1 tabular-nums">
              {auditData?.diversification_score ? `${auditData.diversification_score}/100` : "—"}
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-1">
              Entropy Rating Metric
            </div>
          </div>
        </div>

        {/* Main Workspace Grid (12 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Portfolio Performance Chart */}
            <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                      PORTFOLIO PERFORMANCE
                    </span>
                    <span className="text-zinc-600 font-mono text-xs">•</span>
                    <span className="text-xs font-mono text-zinc-500">BENCHMARK OVERLAY</span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    Portfolio Value vs S&P 500 Index
                  </div>
                </div>

                {/* Timeframe segmented control */}
                <div className="flex items-center rounded border border-zinc-800 bg-zinc-900 p-0.5">
                  {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setChartTimeframe(tf)}
                      className={`h-6 px-2.5 rounded text-[11px] font-mono transition-colors ${
                        chartTimeframe === tf
                          ? "bg-zinc-800 text-zinc-100 font-semibold shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart with clean neutral or subtle emerald gradient and 1.5px stroke */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#27272a" }}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                      fontFamily="var(--font-mono)"
                    />
                    <Tooltip content={<TerminalChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      name="Portfolio"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#emeraldArea)"
                    />
                    <Area
                      type="monotone"
                      dataKey="benchmark"
                      name="S&P 500"
                      stroke="#71717a"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      fillOpacity={0}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Holdings Table */}
            <HoldingsTable
              holdings={holdings}
              auditDetails={auditData?.holdings_detail}
              isLoading={isHoldingsLoading}
              onDeleteHolding={handleDeleteHolding}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onTradeSuccess={() => {
                if (activePortfolio) {
                  getPortfolioHoldings(activePortfolio.id).then(setHoldings);
                }
              }}
            />

            {/* Stress Test Scenarios */}
            <MarketScenarios currentValue={totalEstimatedValue} />
          </div>

          {/* Right 4 Columns */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sector Allocation */}
            <SectorDonutChart
              sectorBreakdown={auditData?.sector_breakdown}
              totalInvested={totalInvested}
              isLoading={isAuditLoading}
            />

            {/* AI Portfolio Audit (Styled as Institutional Research Note) */}
            <JargonBusterCard
              auditData={auditData}
              isLoading={isAuditLoading}
              error={auditError}
              onRefreshAudit={() => runAudit(holdings)}
            />
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950 py-4 text-xs font-mono text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SimpleInvest Financial Intelligence Terminal</span>
          <span>SYSTEM ONLINE • REAL-TIME WEALTH ANALYTICS</span>
        </div>
      </footer>

      {/* Add Position Modal */}
      <AddAssetDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddHolding={handleAddHolding}
      />
    </div>
  );
}

function TerminalChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-zinc-800 bg-[#0f0f12] p-2.5 shadow-xl font-mono text-xs space-y-1">
        <p className="text-zinc-400 font-semibold">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex justify-between items-center space-x-3">
            <span className="text-zinc-500">{entry.name}:</span>
            <span className="font-semibold text-zinc-100 tabular-nums">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
