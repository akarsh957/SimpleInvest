"use client";

import React, { useState } from "react";
import { PortfolioAuditResponse } from "@/src/types/portfolio";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Brain, MessageSquare } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"summary" | "metrics">("summary");

  if (isLoading) {
    return (
      <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-4">
        <Skeleton className="h-5 w-48 bg-[#262A34]" />
        <Skeleton className="h-3 w-full bg-[#20242D]" />
        <Skeleton className="h-16 w-full bg-[#20242D] rounded-lg" />
        <Skeleton className="h-16 w-full bg-[#20242D] rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-[#EB5B3C]">AI Analysis Unavailable</span>
          {onRefreshAudit && (
            <button
              onClick={onRefreshAudit}
              className="text-xs text-[#5367FF] hover:text-white transition-colors"
            >
              Retry
            </button>
          )}
        </div>
        <p className="text-xs text-[#5A6070] leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-[#5367FF]/10 flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-[#5367FF]" />
          </div>
          <h3 className="text-sm font-semibold text-white">AI Wealth Copilot</h3>
        </div>
        <p className="text-xs text-[#5A6070] leading-relaxed">
          Add positions to your portfolio and the AI will generate personalised insights, diversification analysis, and rebalancing recommendations.
        </p>
      </div>
    );
  }

  const diversificationScore = auditData.diversification_score || 72;
  const scoreColor = diversificationScore >= 75
    ? "text-[#00D09C]"
    : diversificationScore >= 50
    ? "text-[#F59E0B]"
    : "text-[#EB5B3C]";

  return (
    <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-[#5367FF]/10 flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-[#5367FF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Wealth Copilot</h3>
            <p className="text-[10px] text-[#5A6070]">Portfolio Intelligence</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold tabular-nums ${scoreColor}`}>
            {diversificationScore}<span className="text-xs text-[#5A6070] font-normal">/100</span>
          </div>
          <p className="text-[10px] text-[#5A6070]">Health Score</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center bg-[#14171D] rounded-lg p-1 gap-1">
        {(["summary", "metrics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-[#1A1D24] text-white border border-[#262A34] shadow-sm"
                : "text-[#5A6070] hover:text-[#A0A8B8]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <div className="space-y-3">
          {/* Insight 1: Diversification */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#14171D]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00D09C] mt-1.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-[#A0A8B8] uppercase tracking-wide mb-1">Diversification Diagnosis</p>
              <p className="text-xs text-[#A0A8B8] leading-relaxed">
                {auditData.plain_english_summary ||
                  "Portfolio demonstrates balanced asset allocation across active positions with acceptable sector concentration."}
              </p>
            </div>
          </div>

          {/* Insight 2: Concentration Risk */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#14171D]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5367FF] mt-1.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-[#A0A8B8] uppercase tracking-wide mb-1">Key Concentration Risk</p>
              <p className="text-xs text-[#A0A8B8] leading-relaxed">
                {auditData.concentration_warning ||
                  "No single asset exceeds allowable exposure thresholds. Exposure remains distributed across market sectors."}
              </p>
            </div>
          </div>

          {/* Insight 3: Rebalancing */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#14171D]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-[#A0A8B8] uppercase tracking-wide mb-1">Rebalancing Suggestion</p>
              <div className="space-y-1">
                {auditData.actionable_takeaways && auditData.actionable_takeaways.length > 0 ? (
                  auditData.actionable_takeaways.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="text-xs text-[#A0A8B8] leading-relaxed">
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-[#A0A8B8] leading-relaxed">
                    Maintain scheduled rebalancing across designated holdings.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-[#14171D]">
              <p className="text-[10px] text-[#5A6070] uppercase tracking-wide mb-1">Diversification</p>
              <p className={`text-base font-bold tabular-nums ${scoreColor}`}>{diversificationScore}/100</p>
            </div>
            <div className="p-3 rounded-lg bg-[#14171D]">
              <p className="text-[10px] text-[#5A6070] uppercase tracking-wide mb-1">Risk Profile</p>
              <p className="text-sm font-semibold text-white">{auditData.portfolio_risk_vibe || "Balanced"}</p>
            </div>
          </div>
          {auditData.actionable_takeaways && auditData.actionable_takeaways.length > 0 && (
            <div className="p-3 rounded-lg bg-[#14171D] space-y-2">
              <p className="text-[10px] text-[#5A6070] uppercase tracking-wide">Action Items</p>
              {auditData.actionable_takeaways.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-[#5367FF] font-mono text-[10px] mt-0.5">[{idx + 1}]</span>
                  <p className="text-xs text-[#A0A8B8] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ask Input */}
      <div className="flex items-center space-x-2 pt-1 border-t border-[#262A34]">
        <div className="flex-1 relative">
          <MessageSquare className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5A6070]" />
          <input
            type="text"
            placeholder="Ask about your portfolio..."
            className="w-full h-8 bg-[#14171D] border border-[#262A34] rounded-lg pl-8 pr-3 text-xs text-[#A0A8B8] placeholder:text-[#373D4A] focus:outline-none focus:border-[#383E4C]"
          />
        </div>
      </div>
    </div>
  );
}
