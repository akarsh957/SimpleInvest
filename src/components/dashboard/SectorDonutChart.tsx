"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon, PieChartIcon, Target } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { SectorDataItem } from "@/src/types/portfolio";
import { formatCurrency } from "@/src/lib/utils";

interface SectorDonutChartProps {
  sectorBreakdown?: Record<string, number>;
  totalInvested?: number;
  isLoading?: boolean;
}

const SECTOR_COLORS = [
  "#10b981", // Emerald / Tech
  "#3b82f6", // Imperial Blue / Finance
  "#8b5cf6", // Violet / Healthcare
  "#f59e0b", // Amber / Energy
  "#ec4899", // Rose / Consumer
  "#06b6d4", // Cyan / Industrial
  "#f97316", // Orange / Real Estate
  "#64748b", // Slate / Other
];

export function SectorDonutChart({
  sectorBreakdown = {},
  totalInvested = 0,
  isLoading,
}: SectorDonutChartProps) {
  const chartData: SectorDataItem[] = Object.entries(sectorBreakdown).map(
    ([sector, percentage], idx) => {
      const estimatedValue = (percentage / 100) * totalInvested;
      return {
        name: sector,
        value: estimatedValue,
        percentage,
        color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
      };
    }
  );

  if (isLoading) {
    return (
      <Card className="border border-slate-800 bg-slate-900/80 shadow-xl">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40 bg-slate-800" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Skeleton className="h-48 w-48 rounded-full bg-slate-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
            <PieChartIcon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-extrabold text-white">
              Sector Distribution
            </CardTitle>
            <p className="text-[11px] text-slate-400">Target Diversification Weightings</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
            <PieIcon className="h-10 w-10 stroke-[1.5] mb-2 text-slate-600" />
            <p className="text-xs font-semibold text-slate-400">No sector data available</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Add holdings to calculate sector weightings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart with Center Total Label */}
            <div className="relative h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#090d16" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip totalInvested={totalInvested} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                <span className="text-sm font-extrabold text-white font-mono">{formatCurrency(totalInvested)}</span>
              </div>
            </div>

            {/* Custom Legend Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {chartData.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-slate-200 font-semibold">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-white font-mono shrink-0 ml-1">
                      {item.percentage}%
                    </span>
                  </div>
                  {/* Progress Weighting Bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, totalInvested }: any) {
  if (active && payload && payload.length) {
    const data: SectorDataItem = payload[0].payload;
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs">
        <div className="flex items-center space-x-2 mb-1.5">
          <span
            className="h-3 w-3 rounded-full shadow-sm"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-bold text-white">
            {data.name}
          </span>
        </div>
        <div className="flex justify-between space-x-6 text-slate-400">
          <span>Allocation Weight:</span>
          <span className="font-bold text-emerald-400 font-mono">
            {data.percentage}%
          </span>
        </div>
        <div className="flex justify-between space-x-6 text-slate-400 mt-1">
          <span>Est. Invested:</span>
          <span className="font-semibold text-white font-mono">
            {formatCurrency(data.value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

