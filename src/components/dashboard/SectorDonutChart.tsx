"use client";

import React from "react";
import { formatCurrency } from "@/src/lib/utils";

interface SectorDonutChartProps {
  sectorBreakdown?: Record<string, number>;
  totalInvested?: number;
  isLoading?: boolean;
}

// Sophisticated institutional color tokens for stacked progress
const SECTOR_TONES = [
  "bg-zinc-100",
  "bg-zinc-300",
  "bg-zinc-400",
  "bg-zinc-500",
  "bg-zinc-600",
  "bg-zinc-700",
  "bg-zinc-800",
];

export function SectorDonutChart({
  sectorBreakdown = {},
  totalInvested = 0,
  isLoading,
}: SectorDonutChartProps) {
  const entries = Object.entries(sectorBreakdown);

  if (isLoading) {
    return (
      <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-zinc-800 rounded" />
        <div className="h-3 w-full bg-zinc-900 rounded" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-full bg-zinc-900/60 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            SECTOR EXPOSURE
          </span>
          <span className="text-zinc-600 font-mono text-xs">•</span>
          <span className="text-xs text-zinc-500 font-mono">WEIGHT MATRIX</span>
        </div>
        <span className="font-mono text-xs text-zinc-500 tabular-nums">
          {entries.length} SECTORS
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 font-mono text-xs">
          NO SECTOR EXPOSURE DETECTED
        </div>
      ) : (
        <div className="space-y-4">
          {/* Clean Horizontal Stacked Progress Bar */}
          <div className="h-2.5 w-full rounded bg-zinc-900 overflow-hidden flex border border-zinc-800/80">
            {entries.map(([sector, pct], idx) => {
              const tone = SECTOR_TONES[idx % SECTOR_TONES.length];
              return (
                <div
                  key={sector}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                  className={`h-full ${tone} transition-all duration-300`}
                  title={`${sector}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Compact Legend Table with Exact Percentages and Values */}
          <div className="border border-zinc-800/60 rounded divide-y divide-zinc-800/60 font-mono text-xs">
            {entries.map(([sector, pct], idx) => {
              const estimatedVal = (pct / 100) * totalInvested;
              const tone = SECTOR_TONES[idx % SECTOR_TONES.length];

              return (
                <div
                  key={sector}
                  className="flex items-center justify-between px-3 py-2 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={`h-2 w-2 rounded-full ${tone}`} />
                    <span className="text-zinc-300 font-sans text-xs">{sector}</span>
                  </div>
                  <div className="flex items-center space-x-4 tabular-nums">
                    <span className="text-zinc-400 text-xs">
                      {formatCurrency(estimatedVal)}
                    </span>
                    <span className="text-zinc-100 font-semibold text-xs w-12 text-right">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
