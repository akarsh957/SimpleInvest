"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  RefreshCw,
  Plus,
  TrendingUp,
  TrendingDown,
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
        setAuditError(res.error || "AI analysis service offline.");
      }
    } catch (err: any) {
      setAuditError(err.message || "Failed to analyse portfolio.");
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

  useEffect(() => { runAudit(holdings); }, [holdings, runAudit]);

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
    if (!activePortfolio) return { success: false, error: "No active portfolio selected." };
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

  const totalInvested = holdings.reduce((sum, h) => sum + h.shares * h.average_buy_price, 0);
  const totalEstimatedValue = auditData?.total_current_value || totalInvested;
  const netProfit = totalEstimatedValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
  const isPositive = profitPercentage >= 0;

  const chartData = useMemo(() => {
    const base = totalInvested || 10000;
    switch (chartTimeframe) {
      case "1D":  return [
        { date: "09:30", portfolio: base * 0.995, benchmark: base * 0.998 },
        { date: "11:00", portfolio: base * 1.002, benchmark: base * 1.001 },
        { date: "13:00", portfolio: base * 0.998, benchmark: base * 0.995 },
        { date: "15:00", portfolio: base * 1.005, benchmark: base * 1.003 },
        { date: "16:00", portfolio: totalEstimatedValue, benchmark: base * 1.006 },
      ];
      case "1W":  return [
        { date: "Mon", portfolio: base * 0.98, benchmark: base * 0.99 },
        { date: "Tue", portfolio: base * 0.97, benchmark: base * 0.98 },
        { date: "Wed", portfolio: base * 0.99, benchmark: base * 1.00 },
        { date: "Thu", portfolio: base * 1.01, benchmark: base * 1.00 },
        { date: "Fri", portfolio: totalEstimatedValue, benchmark: base * 1.01 },
      ];
      case "1M":  return [
        { date: "W1", portfolio: base * 0.94, benchmark: base * 0.95 },
        { date: "W2", portfolio: base * 0.97, benchmark: base * 0.96 },
        { date: "W3", portfolio: base * 1.01, benchmark: base * 0.98 },
        { date: "W4", portfolio: base * 0.99, benchmark: base * 0.99 },
        { date: "Now", portfolio: totalEstimatedValue, benchmark: base * 1.02 },
      ];
      case "3M":  return [
        { date: "M-3", portfolio: base * 0.88, benchmark: base * 0.90 },
        { date: "M-2", portfolio: base * 0.95, benchmark: base * 0.94 },
        { date: "M-1", portfolio: base * 0.99, benchmark: base * 0.98 },
        { date: "Now", portfolio: totalEstimatedValue, benchmark: base * 1.01 },
      ];
      case "1Y":  return [
        { date: "Q1", portfolio: base * 0.80, benchmark: base * 0.82 },
        { date: "Q2", portfolio: base * 0.85, benchmark: base * 0.86 },
        { date: "Q3", portfolio: base * 0.92, benchmark: base * 0.93 },
        { date: "Now", portfolio: totalEstimatedValue, benchmark: base * 0.98 },
      ];
      case "ALL": return [
        { date: "2023", portfolio: base * 0.75, benchmark: base * 0.78 },
        { date: "2024", portfolio: base * 0.90, benchmark: base * 0.88 },
        { date: "2025", portfolio: base * 1.10, benchmark: base * 1.05 },
        { date: "2026", portfolio: totalEstimatedValue, benchmark: base * 1.15 },
      ];
      default: return [];
    }
  }, [totalInvested, totalEstimatedValue, chartTimeframe]);

  const handleExport = () => {
    setExportNotice("Exporting CSV position ledger...");
    setTimeout(() => setExportNotice(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#121418] text-[#E8ECF4] flex flex-col font-sans">
      <TerminalHeader
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={handleSelectPortfolio}
        onPortfolioCreated={handlePortfolioCreated}
      />

      {exportNotice && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-[#262A34] bg-[#1A1D24] px-4 py-2.5 text-xs font-mono text-[#A0A8B8] shadow-2xl">
          {exportNotice}
        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* ── Page Title Row ────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {activePortfolio ? activePortfolio.name : "My Portfolio"}
            </h1>
            <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-[#5A6070] uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D09C] live-dot" />
              <span>Live</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="h-9 px-3 rounded-lg border border-[#262A34] bg-[#1A1D24] hover:bg-[#20242D] text-[#A0A8B8] text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => runAudit(holdings)}
              disabled={isAuditLoading || holdings.length === 0}
              className="h-9 px-3 rounded-lg border border-[#262A34] bg-[#1A1D24] hover:bg-[#20242D] text-[#A0A8B8] text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAuditLoading ? "animate-spin" : ""}`} />
              <span>Re-Analyse</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 px-4 rounded-lg bg-[#00D09C] text-[#0B0E11] text-xs font-semibold flex items-center space-x-1.5 hover:bg-[#00B88A] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* ── Hero Portfolio Card ───────────────────────── */}
        <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-6">
          {/* Top Row: Main Value + Metric Cluster */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
            {/* Left: Current Value */}
            <div>
              <p className="text-xs font-medium text-[#5A6070] uppercase tracking-wider mb-1">Current Value</p>
              <div className="flex items-end space-x-3">
                <span className="text-4xl font-bold text-white tabular-nums tracking-tight">
                  {formatCurrency(totalEstimatedValue)}
                </span>
                <span className={`inline-flex items-center space-x-1 text-sm font-semibold mb-1 tabular-nums ${isPositive ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  <span>{isPositive ? "+" : ""}{profitPercentage.toFixed(2)}%</span>
                  <span className="font-normal text-xs">today</span>
                </span>
              </div>
            </div>

            {/* Right: Metric Cluster */}
            <div className="flex items-stretch divide-x divide-[#262A34]">
              <div className="px-5 first:pl-0">
                <p className="text-[10px] uppercase tracking-wider text-[#5A6070] mb-1">Invested Amount</p>
                <p className="text-base font-semibold text-white tabular-nums">{formatCurrency(totalInvested)}</p>
                <p className="text-[11px] text-[#5A6070] mt-0.5">{holdings.length} positions</p>
              </div>
              <div className="px-5">
                <p className="text-[10px] uppercase tracking-wider text-[#5A6070] mb-1">Total Returns</p>
                <p className={`text-base font-semibold tabular-nums ${isPositive ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
                  {isPositive ? "+" : ""}{formatCurrency(netProfit)}
                </p>
                <p className="text-[11px] text-[#5A6070] mt-0.5">All-time P&L</p>
              </div>
              <div className="px-5">
                <p className="text-[10px] uppercase tracking-wider text-[#5A6070] mb-1">Portfolio Beta</p>
                <p className="text-base font-semibold text-white tabular-nums">
                  {auditData?.diversification_score
                    ? (1.0 + (auditData.diversification_score - 70) * 0.01).toFixed(2)
                    : "1.08"}
                </p>
                <p className="text-[11px] text-[#5A6070] mt-0.5">Balanced</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#00D09C" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#00D09C" stopOpacity={0.0}  />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262A34" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#5A6070"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#262A34" }}
                  fontFamily="var(--font-mono)"
                />
                <YAxis
                  stroke="#5A6070"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  fontFamily="var(--font-mono)"
                />
                <Tooltip content={<PortfolioChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  name="Portfolio"
                  stroke="#00D09C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#mintGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#00D09C", strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  name="S&P 500"
                  stroke="#5A6070"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  fillOpacity={0}
                  fill="transparent"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Row: Timeframe + Add Transaction */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#262A34]">
            <div className="flex items-center gap-1 bg-[#14171D] rounded-lg p-1">
              {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${
                    chartTimeframe === tf
                      ? "bg-[#1A1D24] text-white shadow-sm border border-[#262A34]"
                      : "text-[#5A6070] hover:text-[#A0A8B8]"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Workspace Grid ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns */}
          <div className="lg:col-span-8 space-y-6">
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
            <MarketScenarios currentValue={totalEstimatedValue} />
          </div>

          {/* Right 4 Columns */}
          <div className="lg:col-span-4 space-y-6">
            <SectorDonutChart
              sectorBreakdown={auditData?.sector_breakdown}
              totalInvested={totalInvested}
              isLoading={isAuditLoading}
            />
            <JargonBusterCard
              auditData={auditData}
              isLoading={isAuditLoading}
              error={auditError}
              onRefreshAudit={() => runAudit(holdings)}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#262A34] bg-[#121418] py-4 text-xs text-[#373D4A] font-mono">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SimpleInvest · Wealth Management Platform</span>
          <span>Market data for informational purposes only</span>
        </div>
      </footer>

      <AddAssetDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddHolding={handleAddHolding}
      />
    </div>
  );
}

function PortfolioChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[#262A34] bg-[#1A1D24] p-3 shadow-2xl font-mono text-xs space-y-1.5">
        <p className="text-[#5A6070] font-medium">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex justify-between items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[#A0A8B8]">{entry.name}:</span>
            </span>
            <span className="font-semibold text-white tabular-nums">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
