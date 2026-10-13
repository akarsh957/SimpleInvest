"use client";

import React from "react";
import { formatCurrency } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/skeleton";

interface SectorDonutChartProps {
  sectorBreakdown?: Record<string, number>;
  totalInvested?: number;
  isLoading?: boolean;
}

// FinTech-grade sector color tokens
const SECTOR_COLORS = [
  { bg: "bg-[#00D09C]", text: "text-[#00D09C]", hex: "#00D09C" },
  { bg: "bg-[#5367FF]", text: "text-[#5367FF]", hex: "#5367FF" },
  { bg: "bg-[#EB5B3C]", text: "text-[#EB5B3C]", hex: "#EB5B3C" },
  { bg: "bg-[#F59E0B]", text: "text-[#F59E0B]", hex: "#F59E0B" },
  { bg: "bg-[#A78BFA]", text: "text-[#A78BFA]", hex: "#A78BFA" },
  { bg: "bg-[#38BDF8]", text: "text-[#38BDF8]", hex: "#38BDF8" },
  { bg: "bg-[#FB7185]", text: "text-[#FB7185]", hex: "#FB7185" },
];

function ConcentrationBadge({ pct }: { pct: number }) {
  if (pct > 40) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#EB5B3C]/10 text-[#EB5B3C] border border-[#EB5B3C]/20">
        Overweight
      </span>
    );
  }
  if (pct > 25) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
        Concentrated
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/20">
      Healthy
    </span>
  );
}

export function SectorDonutChart({
  sectorBreakdown = {},
  totalInvested = 0,
  isLoading,
}: SectorDonutChartProps) {
  const entries = Object.entries(sectorBreakdown);

  if (isLoading) {
    return (
      <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-3 animate-pulse">
        <Skeleton className="h-4 w-36 bg-[#262A34]" />
        <Skeleton className="h-3 w-full bg-[#20242D] rounded-full" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full bg-[#20242D] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Asset Allocation</h3>
          <p className="text-[11px] text-[#5A6070] mt-0.5">Portfolio X-Ray</p>
        </div>
        <span className="text-[11px] font-mono text-[#5A6070]">
          {entries.length} sectors
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-[#5A6070] text-xs">
          No sector data available. Add positions to see allocation.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Multi-Segment Horizontal Allocation Bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex gap-0.5 bg-[#14171D]">
            {entries.map(([sector, pct], idx) => {
              const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
              return (
                <div
                  key={sector}
                  style={{ width: `${Math.max(pct, 1.5)}%`, backgroundColor: color.hex }}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                  title={`${sector}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Breakdown List */}
          <div className="space-y-2">
            {entries.map(([sector, pct], idx) => {
              const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
              const estimatedVal = (pct / 100) * totalInvested;
              return (
                <div
                  key={sector}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#14171D] hover:bg-[#20242D] transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                    <div>
                      <span className="text-xs font-medium text-[#A0A8B8]">{sector}</span>
                      <p className="text-[10px] text-[#5A6070] font-mono tabular-nums">
                        {formatCurrency(estimatedVal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ConcentrationBadge pct={pct} />
                    <span className="text-xs font-semibold text-white font-mono tabular-nums w-10 text-right">
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
