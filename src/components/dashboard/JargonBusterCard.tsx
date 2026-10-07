"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  FileText,
  BarChart3,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Send,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PortfolioAuditResponse } from "@/src/types/portfolio";
import { formatCurrency } from "@/src/lib/utils";

interface JargonBusterCardProps {
  auditData?: PortfolioAuditResponse | null;
  isLoading?: boolean;
  error?: string | null;
  onRefreshAudit?: () => void;
}

export function JargonBusterCard({
  auditData,
  isLoading,
  error,
  onRefreshAudit,
}: JargonBusterCardProps) {
  const [viewMode, setViewMode] = useState<"plain" | "metrics">("plain");
  const [userQuery, setUserQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const handleAskCopilot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    setIsAsking(true);
    // Simulate AI response based on portfolio audit
    setTimeout(() => {
      setAiAnswer(
        `Based on your current portfolio allocation, asking about "${userQuery}": Your holdings show a heavy concentration in Technology (${auditData?.sector_breakdown?.["Technology"] || 50}%). To optimize risk, consider holding cash reserves or adding defensive assets like index ETFs (VOO/SPY) to offset potential volatility.`
      );
      setIsAsking(false);
    }, 800);
  };

  if (isLoading) {
    return (
      <Card className="border border-slate-800 bg-slate-900/80 shadow-xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full bg-slate-800" />
            <Skeleton className="h-6 w-48 bg-slate-800" />
          </div>
          <Skeleton className="h-8 w-44 rounded-lg bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-20 w-full rounded-xl bg-slate-800/60" />
          <Skeleton className="h-16 w-full rounded-xl bg-slate-800/60" />
          <Skeleton className="h-24 w-full rounded-xl bg-slate-800/60" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-rose-500/30 bg-rose-950/20 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle className="text-base font-bold">Audit Diagnostic Error</CardTitle>
          </div>
          {onRefreshAudit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshAudit}
              className="border-rose-500/40 text-rose-300 hover:bg-rose-950/60"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!auditData) {
    return (
      <Card className="border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-base font-bold text-white">
              AI Wealth Diagnostic Copilot
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-8 text-center text-slate-400">
          <p className="text-xs">
            Add holdings to your active portfolio to generate instant plain-English risk diagnostics & recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const score = auditData.diversification_score || 50;

  const getScoreBadge = (s: number) => {
    if (s >= 75) return <Badge variant="success" className="bg-emerald-950/80 text-emerald-300 border-emerald-500/30">Well Diversified ({s}/100)</Badge>;
    if (s >= 50) return <Badge variant="info" className="bg-blue-950/80 text-blue-300 border-blue-500/30">Moderate Spread ({s}/100)</Badge>;
    return <Badge variant="warning" className="bg-amber-950/80 text-amber-300 border-amber-500/30">Concentrated Risk ({s}/100)</Badge>;
  };

  return (
    <Card className="overflow-hidden border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
      {/* Executive Header */}
      <CardHeader className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base font-extrabold text-white">
                  Plain-English AI Copilot Report
                </CardTitle>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
                  Groq LLM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Institutional Risk Diagnostics • Zero Jargon
              </p>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("plain")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                viewMode === "plain"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Plain English</span>
            </button>
            <button
              onClick={() => setViewMode("metrics")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                viewMode === "metrics"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Metrics</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Diversification Score Banner */}
        <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-4 border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-950 font-bold text-emerald-400 text-sm border border-emerald-500/30 font-mono shadow-inner">
              {score}
            </div>
            <div>
              <span className="text-xs font-bold text-white">
                Portfolio Diversification Health
              </span>
              <p className="text-[11px] text-slate-400">
                Calculated entropy score across asset classes & sectors
              </p>
            </div>
          </div>
          {getScoreBadge(score)}
        </div>

        {/* View Mode 1: Plain English Mode */}
        {viewMode === "plain" && (
          <div className="space-y-4">
            {/* Executive Plain English Summary */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
              <h4 className="flex items-center text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                <Lightbulb className="h-4 w-4 mr-1.5" />
                Executive Summary
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {auditData.plain_english_summary}
              </p>
            </div>

            {/* Concentration Alert Warning */}
            {auditData.concentration_warning && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <h4 className="flex items-center text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                  <AlertTriangle className="h-4 w-4 mr-1.5 text-amber-400" />
                  Concentration & Volatility Flag
                </h4>
                <p className="text-xs text-amber-200 leading-relaxed">
                  {auditData.concentration_warning}
                </p>
              </div>
            )}

            {/* Actionable Takeaways */}
            {auditData.actionable_takeaways && auditData.actionable_takeaways.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
                  <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-400" />
                  Actionable Strategic Steps
                </h4>
                <ul className="space-y-2.5">
                  {auditData.actionable_takeaways.map((tip, idx) => (
                    <li key={idx} className="flex items-start text-xs text-slate-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold mr-2.5 mt-0.5 border border-emerald-500/30">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Ask Copilot Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
              <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider flex items-center">
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                Ask AI Wealth Copilot
              </span>
              <form onSubmit={handleAskCopilot} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ask a question about your portfolio (e.g. Is my Tech allocation too high?)..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <Button type="submit" variant="gradient" size="sm" disabled={isAsking || !userQuery.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
              {aiAnswer && (
                <div className="rounded-xl bg-slate-900 p-3 border border-emerald-500/30 text-xs text-slate-200 animate-in fade-in">
                  <p className="font-semibold text-emerald-400 mb-1">Copilot Answer:</p>
                  <p className="leading-relaxed text-[11px]">{aiAnswer}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode 2: Financial Metrics Mode */}
        {viewMode === "metrics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Capital Invested
                </span>
                <p className="text-base font-extrabold text-white mt-1 font-mono">
                  {formatCurrency(auditData.total_invested_amount)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Volatility Vibe
                </span>
                <p className="text-xs font-extrabold text-emerald-400 mt-1">
                  {auditData.portfolio_risk_vibe}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Holdings Count
                </span>
                <p className="text-base font-extrabold text-white mt-1 font-mono">
                  {auditData.holdings_count} Assets
                </p>
              </div>
            </div>

            {/* Sector Percentages Exposure Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Exact Sector Concentration
              </h4>
              <div className="space-y-2.5 pt-1">
                {Object.entries(auditData.sector_breakdown).map(([sec, pct]) => (
                  <div key={sec} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{sec}</span>
                      <span className="text-emerald-400 font-bold font-mono">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

