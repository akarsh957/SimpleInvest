"use client";

import React from "react";

interface RiskGaugeProps {
  riskVibe?: string;
  diversificationScore?: number;
  isLoading?: boolean;
}

export function RiskGauge({
  riskVibe = "Moderate Bumps",
  diversificationScore = 70,
  isLoading,
}: RiskGaugeProps) {
  if (isLoading) {
    return (
      <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-zinc-800 rounded" />
        <div className="h-6 w-full bg-zinc-900 rounded" />
      </div>
    );
  }

  const v = riskVibe.toLowerCase();
  const score = v.includes("smooth") || v.includes("low") ? 25 : v.includes("wild") || v.includes("high") ? 85 : 50;

  return (
    <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <span className="uppercase tracking-wider text-zinc-400 font-semibold">
            VOLATILITY TELEMETRY
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500">BETA INDEX</span>
        </div>
        <span className="text-zinc-300 font-semibold">{riskVibe}</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between font-mono text-[10px] text-zinc-500 uppercase">
          <span>DEFENSIVE</span>
          <span>MARKET INDEX</span>
          <span>HIGH BETA</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-full relative">
          <div
            className="absolute h-3 w-3 rounded-full bg-zinc-100 top-1/2 -translate-y-1/2 -translate-x-1/2 border border-zinc-950 shadow-sm"
            style={{ left: `${score}%` }}
          />
        </div>
      </div>

      <div className="pt-2 text-xs font-sans text-zinc-400 leading-relaxed">
        Portfolio asset correlation exhibits baseline alignment with broader equity indices, absorbing market drawdowns through active multi-asset weighting.
      </div>
    </div>
  );
}
