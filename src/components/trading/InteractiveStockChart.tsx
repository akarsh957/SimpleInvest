"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  datetime: string;
  close: number;
}

interface InteractiveStockChartProps {
  data: ChartDataPoint[];
  color?: string;
}

export function InteractiveStockChart({
  data,
  color = "#10b981",
}: InteractiveStockChartProps) {
  const formattedData = useMemo(() => {
    return [...data].reverse().map((item) => ({
      ...item,
      displayDate: new Date(item.datetime).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center font-mono text-xs text-zinc-600">
        NO HISTORICAL TELEMETRY
      </div>
    );
  }

  const min = Math.min(...formattedData.map((d) => d.close));
  const max = Math.max(...formattedData.map((d) => d.close));
  const padding = (max - min) * 0.1;

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.12} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="displayDate"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 10, fontFamily: "var(--font-mono)" }}
            minTickGap={25}
          />
          <YAxis
            domain={[min - padding, max + padding]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#71717a", fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f0f12",
              border: "1px solid #27272a",
              borderRadius: "4px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#fafafa",
            }}
            itemStyle={{ color: "#fafafa" }}
            labelStyle={{ color: "#71717a", marginBottom: "4px" }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#chartGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
