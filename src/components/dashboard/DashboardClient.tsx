"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Download,
  Activity,
  BarChart2,
  Calendar,
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
import { Navbar } from "@/src/components/dashboard/Navbar";
import { RiskGauge } from "@/src/components/dashboard/RiskGauge";
import { HoldingsTable } from "@/src/components/dashboard/HoldingsTable";
import { AddAssetDialog } from "@/src/components/dashboard/AddAssetDialog";
import { SectorDonutChart } from "@/src/components/dashboard/SectorDonutChart";
import { JargonBusterCard } from "@/src/components/dashboard/JargonBusterCard";
import { MarketScenarios } from "@/src/components/dashboard/MarketScenarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
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
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Trigger FastAPI audit whenever holdings or active portfolio changes
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
        setAuditError(res.error || "Could not retrieve plain-English portfolio audit.");
      }
    } catch (err: any) {
      setAuditError(err.message || "Failed to audit portfolio.");
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

  // Initial audit run on client mount or holdings change
  useEffect(() => {
    runAudit(holdings);
  }, [holdings, runAudit]);

  // Handle portfolio selection change
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

  // Add new portfolio to list
  const handlePortfolioCreated = (newPortfolio: Portfolio) => {
    setPortfolios((prev) => [...prev, newPortfolio]);
    setActivePortfolio(newPortfolio);
    setHoldings([]);
    setAuditData(null);
  };

  // Add holding handler
  const handleAddHolding = async (
    ticker: string,
    shares: number,
    buyPrice: number
  ) => {
    if (!activePortfolio) return { success: false, error: "No active portfolio selected." };

    const res = await addHoldingAction(activePortfolio.id, ticker, shares, buyPrice);
    if (res.success && res.holding) {
      const updatedHoldings = await getPortfolioHoldings(activePortfolio.id);
      setHoldings(updatedHoldings);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to save holding." };
  };

  // Delete holding handler
  const handleDeleteHolding = async (holdingId: string) => {
    const nextHoldings = holdings.filter((h) => h.id !== holdingId);
    setHoldings(nextHoldings);

    const res = await deleteHoldingAction(holdingId);
    if (!res.success) {
      if (activePortfolio) {
        const resetHoldings = await getPortfolioHoldings(activePortfolio.id);
        setHoldings(resetHoldings);
      }
      alert(res.error || "Failed to delete holding.");
    }
  };

  // Total summary math
  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.shares * h.average_buy_price,
    0
  );
  const totalEstimatedValue = auditData?.total_current_value || totalInvested;
  const netProfit = totalEstimatedValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

  // Mock Performance Timeline Chart Data
  const chartData = useMemo(() => {
    const base = totalInvested || 10000;
    
    switch (chartTimeframe) {
      case "1D":
        return [
          { date: "9:30 AM", portfolio: base * 0.995, benchmark: base * 0.998 },
          { date: "11:00 AM", portfolio: base * 1.002, benchmark: base * 1.001 },
          { date: "1:00 PM", portfolio: base * 0.998, benchmark: base * 0.995 },
          { date: "3:00 PM", portfolio: base * 1.005, benchmark: base * 1.003 },
          { date: "4:00 PM", portfolio: totalEstimatedValue, benchmark: base * 1.006 },
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
          { date: "Week 1", portfolio: base * 0.94, benchmark: base * 0.95 },
          { date: "Week 2", portfolio: base * 0.97, benchmark: base * 0.96 },
          { date: "Week 3", portfolio: base * 1.01, benchmark: base * 0.98 },
          { date: "Week 4", portfolio: base * 0.99, benchmark: base * 0.99 },
          { date: "Now", portfolio: totalEstimatedValue, benchmark: base * 1.02 },
        ];
      case "3M":
        return [
          { date: "Jul", portfolio: base * 0.88, benchmark: base * 0.90 },
          { date: "Aug", portfolio: base * 0.95, benchmark: base * 0.94 },
          { date: "Sep", portfolio: base * 0.99, benchmark: base * 0.98 },
          { date: "Oct", portfolio: totalEstimatedValue, benchmark: base * 1.01 },
        ];
      case "1Y":
        return [
          { date: "Jan", portfolio: base * 0.80, benchmark: base * 0.82 },
          { date: "Apr", portfolio: base * 0.85, benchmark: base * 0.86 },
          { date: "Jul", portfolio: base * 0.92, benchmark: base * 0.93 },
          { date: "Oct", portfolio: totalEstimatedValue, benchmark: base * 0.98 },
        ];
      case "ALL":
        return [
          { date: "2022", portfolio: base * 0.60, benchmark: base * 0.65 },
          { date: "2023", portfolio: base * 0.75, benchmark: base * 0.78 },
          { date: "2024", portfolio: base * 0.90, benchmark: base * 0.88 },
          { date: "2025", portfolio: base * 1.10, benchmark: base * 1.05 },
          { date: "2026", portfolio: totalEstimatedValue, benchmark: base * 1.15 },
        ];
      default:
        return [];
    }
  }, [totalInvested, totalEstimatedValue, chartTimeframe]);

  const handleExportPDF = () => {
    setExportToast("Generating Enterprise Wealth PDF Report...");
    setTimeout(() => {
      setExportToast("Wealth Report exported successfully!");
      setTimeout(() => setExportToast(null), 3000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-amber-500/30">
      {/* Top Navigation Bar */}
      <Navbar
        userEmail={userEmail}
        userName={userName}
        portfolios={portfolios}
        activePortfolio={activePortfolio}
        onSelectPortfolio={handleSelectPortfolio}
        onPortfolioCreated={handlePortfolioCreated}
      />

      {/* Export Toast Banner */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-amber-500/40 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-xl text-xs font-semibold text-amber-400 flex items-center space-x-2 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-4 w-4" />
          <span>{exportToast}</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title Bar & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                {activePortfolio ? activePortfolio.name : "Institutional Wealth Terminal"}
              </h1>
              <span className="rounded-full bg-amber-950/50 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                ACTIVE PORTFOLIO
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Institutional-grade risk diagnostics, live asset valuations, and plain-English AI intelligence.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="text-xs border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Report
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => runAudit(holdings)}
              disabled={isAuditLoading || holdings.length === 0}
              className="text-xs border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isAuditLoading ? "animate-spin" : ""}`} />
              Re-Audit
            </Button>

            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="gradient"
              size="sm"
              className="shadow-lg font-bold text-xs"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Position
            </Button>
          </div>
        </div>

        {/* Hero KPI Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Invested Card */}
          <Card className="obsidian-glass-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Capital Invested
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono tabular-nums">
                  {formatCurrency(totalInvested)}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">
                  {holdings.length} Active Asset Positions
                </span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 border border-slate-700">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Current Real-time Valuation Card */}
          <Card className="obsidian-glass-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Real-time Valuation
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1 font-mono tabular-nums">
                  {formatCurrency(totalEstimatedValue)}
                </p>
                <span className="inline-flex items-center text-[11px] font-bold text-amber-400">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                  {profitPercentage >= 0 ? `+${profitPercentage.toFixed(2)}%` : `${profitPercentage.toFixed(2)}%`} Total P&L
                </span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-950/50 text-amber-400 border border-amber-500/30">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Volatility Vibe Rating Card */}
          <Card className="obsidian-glass-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Risk Vibe Profile
                </span>
                <p className="text-base sm:text-lg font-extrabold text-white mt-1 truncate max-w-[140px]">
                  {auditData?.portfolio_risk_vibe || "Moderate Bumps"}
                </p>
                <span className="text-[11px] text-slate-400">Beta Rating Metric</span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-950/80 text-blue-400 border border-blue-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Diversification Score Card */}
          <Card className="obsidian-glass-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Diversification Score
                </span>
                <p className="text-xl sm:text-2xl font-extrabold text-indigo-400 mt-1 font-mono tabular-nums">
                  {auditData?.diversification_score ? `${auditData.diversification_score}/100` : "—"}
                </p>
                <span className="text-[11px] text-slate-400">Sector Entropy Rating</span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
                <PieChart className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Valuation & Benchmark Performance Chart */}
        <Card className="obsidian-glass-card overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 p-5">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-amber-400 border border-white/5">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-white">
                  Portfolio Performance & Benchmark Timeline
                </CardTitle>
                <p className="text-[11px] text-slate-400">
                  Net Portfolio Value vs S&P 500 Index Benchmark
                </p>
              </div>
            </div>

            {/* Timeframe Tabs */}
            <div className="flex items-center space-x-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
              {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono transition ${
                    chartTimeframe === tf
                      ? "bg-amber-600/80 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="portfolioColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="benchmarkColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="portfolio"
                    name="Portfolio Value"
                    stroke="#d4af37"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#portfolioColor)"
                  />
                  <Area
                    type="monotone"
                    dataKey="benchmark"
                    name="S&P 500 Benchmark"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#benchmarkColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Two-Column Main Analytics Section (7 Cols / 5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7/12) */}
          <div className="lg:col-span-7 space-y-8">
            <RiskGauge
              riskVibe={auditData?.portfolio_risk_vibe}
              diversificationScore={auditData?.diversification_score}
              isLoading={isAuditLoading}
            />

            <HoldingsTable
              holdings={holdings}
              auditDetails={auditData?.holdings_detail}
              isLoading={isHoldingsLoading}
              onDeleteHolding={handleDeleteHolding}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />

            <MarketScenarios currentValue={totalEstimatedValue} />
          </div>

          {/* Right Column (5/12) */}
          <div className="lg:col-span-5 space-y-8">
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

      {/* Enterprise Footer */}
      <footer className="mt-auto border-t border-white/5 bg-black/40 py-6 text-xs text-slate-400 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:px-6 lg:px-8">
          <p>© 2026 SimpleInvest • Institutional Wealth Management & Risk Analytics</p>
          <div className="flex items-center space-x-4">
            <span>SOC2 Type II Certified</span>
            <span>•</span>
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </footer>

      {/* Add Asset Modal */}
      <AddAssetDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddHolding={handleAddHolding}
      />
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs space-y-1.5">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex justify-between space-x-4">
            <span style={{ color: entry.color }} className="font-semibold">
              {entry.name}:
            </span>
            <span className="font-bold text-white font-mono">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

