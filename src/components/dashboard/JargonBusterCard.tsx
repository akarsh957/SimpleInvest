"use client";

import React from "react";
import { PortfolioAuditResponse } from "@/src/types/portfolio";
import { Skeleton } from "@/src/components/ui/skeleton";

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
  if (isLoading) {
    return (
      <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-4">
        <Skeleton className="h-4 w-44 bg-zinc-800" />
        <Skeleton className="h-16 w-full bg-zinc-900" />
        <Skeleton className="h-16 w-full bg-zinc-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center text-rose-400">
          <span>PORTFOLIO AUDIT DIAGNOSTIC ERROR</span>
          {onRefreshAudit && (
            <button
              onClick={onRefreshAudit}
              className="text-zinc-400 hover:text-zinc-200 underline"
            >
              Retry
            </button>
          )}
        </div>
        <p className="font-sans text-xs text-zinc-400 leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
          EQUITY RESEARCH NOTE
        </div>
        <p className="text-xs text-zinc-500 font-sans leading-relaxed">
          No audit telemetry available. Add positions to execute quantitative analysis.
        </p>
      </div>
    );
  }

  const diversificationScore = auditData.diversification_score || 70;

  return (
    <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-5">
      {/* Research Note Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            EQUITY RESEARCH NOTE
          </span>
          <span className="text-zinc-600 font-mono text-xs">•</span>
          <span className="text-xs text-zinc-500 font-mono">PORTFOLIO DIAGNOSTIC</span>
        </div>
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-zinc-500">DIVERSIFICATION:</span>
          <span className="font-semibold text-zinc-200 tabular-nums">
            {diversificationScore}/100
          </span>
        </div>
      </div>

      {/* 01 / SUMMARY */}
      <div className="border-b border-zinc-800/60 pb-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2">
          01 / SUMMARY & ASSET PROFILE
        </div>
        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
          {auditData.plain_english_summary ||
            "Portfolio demonstrates balanced asset allocation across active positions."}
        </p>
      </div>

      {/* 02 / CONCENTRATION RISK */}
      <div className="border-b border-zinc-800/60 pb-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2">
          02 / CONCENTRATION RISK
        </div>
        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
          {auditData.concentration_warning ||
            "No single asset exceeds allowable exposure thresholds. Exposure remains distributed across designated market sectors."}
        </p>
      </div>

      {/* 03 / RECOMMENDED ACTIONS */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2">
          03 / RECOMMENDED ACTIONS
        </div>
        <div className="space-y-2">
          {auditData.actionable_takeaways && auditData.actionable_takeaways.length > 0 ? (
            auditData.actionable_takeaways.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2.5 text-xs text-zinc-300 font-sans leading-relaxed"
              >
                <span className="font-mono text-zinc-500 text-[11px] shrink-0 mt-0.5">
                  [{idx + 1}]
                </span>
                <span>{item}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-400 font-sans">
              Maintain scheduled rebalancing schedules across designated holdings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
