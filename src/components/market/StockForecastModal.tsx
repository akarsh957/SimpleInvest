"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { formatCurrency } from "@/src/lib/utils";

export interface ChartPoint {
  date: string;
  display_date: string;
  price: number;
  historical_price: number | null;
  predicted_price: number | null;
  predicted_upper: number | null;
  predicted_lower: number | null;
  moving_average: number | null;
  volume: number | null;
  is_prediction: boolean;
  is_present: boolean;
}

export interface AIForecastInsights {
  signal: string;
  sentiment_score: number;
  target_price: number;
  projected_change_pct: number;
  confidence_score: number;
  time_horizon: string;
  trend_direction: string;
  bull_case_target: number;
  bear_case_target: number;
  key_support: number;
  key_resistance: number;
  catalysts: string[];
  risk_factors: string[];
  summary: string;
  plain_english_translation?: string;
}

export interface StockForecastData {
  ticker: string;
  company_name: string;
  sector: string;
  currency: string;
  current_price: number;
  change: number;
  change_percent: number;
  fifty_two_week_low: number;
  fifty_two_week_high: number;
  volume_formatted: string;
  pe_ratio: number | null;
  beta: number | null;
  timeframe: string;
  forecast_days: number;
  chart_data: ChartPoint[];
  ai_insights: AIForecastInsights;
}

interface StockForecastModalProps {
  ticker: string | null;
  initialData?: StockForecastData | null;
  onClose: () => void;
  onTrade?: (ticker: string, price: number) => void;
}

export function StockForecastModal({
  ticker,
  initialData,
  onClose,
  onTrade,
}: StockForecastModalProps) {
  const [data, setData] = useState<StockForecastData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("1M");
  const [forecastDays, setForecastDays] = useState<number>(30);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  useEffect(() => {
    if (!ticker) return;
    let isCancelled = false;

    async function fetchForecast() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:8000/api/market/stock-forecast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker,
            timeframe,
            forecast_days: forecastDays,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to load forecast (${res.status})`);
        }

        const json = await res.json();
        if (!isCancelled) setData(json);
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to load forecast model.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchForecast();
    return () => {
      isCancelled = true;
    };
  }, [ticker, timeframe, forecastDays]);

  if (!ticker) return null;

  const currencySymbol = data?.currency === "INR" ? "₹" : "$";
  const currentPrice = data?.current_price || 0;
  const targetPrice = data?.ai_insights.target_price || currentPrice * 1.05;
  const bullTarget = data?.ai_insights.bull_case_target || currentPrice * 1.15;
  const bearTarget = data?.ai_insights.bear_case_target || currentPrice * 0.90;
  const confidence = data?.ai_insights.confidence_score || 85;
  const projChangePct = data?.ai_insights.projected_change_pct || 5.0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.18 }}
          className={`w-full ${
            isMaximized ? "max-w-[98vw] h-[95vh]" : "max-w-5xl max-h-[92vh]"
          } flex flex-col rounded-md border border-zinc-800 bg-[#0c0c0e] shadow-2xl overflow-hidden transition-all`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0f0f12]">
            <div className="flex items-center space-x-3">
              <span className="font-mono font-bold text-base text-zinc-100">
                {ticker}
              </span>
              <span className="text-zinc-600 font-mono text-xs">•</span>
              <span className="text-xs text-zinc-400 font-mono truncate max-w-xs">
                {data?.company_name || "Asset"}
              </span>
              <span className="text-[10px] font-mono uppercase text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded">
                {data?.sector || "Equities"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {onTrade && (
                <button
                  onClick={() => onTrade(ticker, currentPrice)}
                  className="h-7 px-3 rounded bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-mono font-semibold transition-colors"
                >
                  TRADE {ticker}
                </button>
              )}
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="h-7 w-7 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center hover:bg-zinc-800 transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Clean 4-Column Hairline Stat Bar Under Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 border-b border-zinc-800 bg-[#0f0f12] text-xs font-mono">
            <div className="p-3">
              <span className="text-[10px] uppercase text-zinc-500 tracking-wider">
                {forecastDays}D PROJECTION
              </span>
              <div className="text-base font-semibold text-zinc-100 mt-0.5 tabular-nums">
                {currencySymbol}{targetPrice.toFixed(2)}
              </div>
              <span
                className={`text-[11px] ${
                  projChangePct >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {projChangePct >= 0 ? "+" : ""}{projChangePct.toFixed(2)}% expected
              </span>
            </div>

            <div className="p-3">
              <span className="text-[10px] uppercase text-zinc-500 tracking-wider">
                BULL TARGET (CEILING)
              </span>
              <div className="text-base font-semibold text-emerald-400 mt-0.5 tabular-nums">
                {currencySymbol}{bullTarget.toFixed(2)}
              </div>
              <span className="text-[11px] text-zinc-500">Optimistic boundary</span>
            </div>

            <div className="p-3">
              <span className="text-[10px] uppercase text-zinc-500 tracking-wider">
                BEAR FLOOR (SUPPORT)
              </span>
              <div className="text-base font-semibold text-rose-400 mt-0.5 tabular-nums">
                {currencySymbol}{bearTarget.toFixed(2)}
              </div>
              <span className="text-[11px] text-zinc-500">Downside floor</span>
            </div>

            <div className="p-3">
              <span className="text-[10px] uppercase text-zinc-500 tracking-wider">
                MODEL CONFIDENCE
              </span>
              <div className="text-base font-semibold text-zinc-100 mt-0.5 tabular-nums">
                {confidence}%
              </div>
              <span className="text-[11px] text-zinc-500">
                SIGNAL: {data?.ai_insights.signal || "ACCUMULATE"}
              </span>
            </div>
          </div>

          {/* Modal Main Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Chart Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
              <div className="flex items-center space-x-1 border border-zinc-800 rounded bg-zinc-900 p-0.5 font-mono text-xs">
                {(["1W", "1M", "3M", "6M", "1Y"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`h-6 px-2 rounded transition-colors ${
                      timeframe === tf
                        ? "bg-zinc-800 text-zinc-100 font-semibold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="text-zinc-500 text-[11px]">HORIZON:</span>
                {[15, 30, 60].map((d) => (
                  <button
                    key={d}
                    onClick={() => setForecastDays(d)}
                    className={`h-6 px-2 rounded border transition-colors ${
                      forecastDays === d
                        ? "border-zinc-700 bg-zinc-800 text-zinc-100 font-semibold"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {d}D
                  </button>
                ))}
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className={`h-6 px-2 rounded border transition-colors ${
                    showVolume
                      ? "border-zinc-700 bg-zinc-800 text-zinc-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-600"
                  }`}
                >
                  VOL
                </button>
              </div>
            </div>

            {/* Chart Container */}
            <div className="h-80 w-full border border-zinc-800/80 rounded bg-zinc-950/70 p-3">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2 font-mono text-xs text-zinc-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Computing Bayesian forecast projection...</span>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center font-mono text-xs text-rose-400">
                  {error}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data?.chart_data || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="display_date"
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#27272a" }}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      yAxisId="price"
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => `${currencySymbol}${val.toFixed(0)}`}
                      fontFamily="var(--font-mono)"
                    />
                    {showVolume && (
                      <YAxis
                        yAxisId="volume"
                        orientation="right"
                        stroke="#3f3f46"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                        fontFamily="var(--font-mono)"
                      />
                    )}
                    <Tooltip content={<ForecastTooltip currencySymbol={currencySymbol} />} />
                    
                    {/* Upper & Lower Bound Shading */}
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="predicted_upper"
                      stroke="none"
                      fill="url(#forecastArea)"
                      fillOpacity={1}
                    />

                    {/* Historical Close Line */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="historical_price"
                      name="Historical"
                      stroke="#e4e4e7"
                      strokeWidth={1.5}
                      dot={false}
                    />

                    {/* Predicted Price Line */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="predicted_price"
                      name="AI Projection"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                    />

                    {/* Moving average */}
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="moving_average"
                      name="20-Day SMA"
                      stroke="#71717a"
                      strokeWidth={1}
                      dot={false}
                    />

                    {/* Volume Bars */}
                    {showVolume && (
                      <Bar
                        yAxisId="volume"
                        dataKey="volume"
                        name="Volume"
                        fill="#27272a"
                        opacity={0.4}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Structured Insights Note */}
            {data?.ai_insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="border border-zinc-800 rounded bg-[#0f0f12] p-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                    PROJECTED CATALYSTS & DRIVERS
                  </div>
                  <ul className="space-y-1.5 text-zinc-300">
                    {data.ai_insights.catalysts.map((cat, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="font-mono text-zinc-500 shrink-0">[{idx + 1}]</span>
                        <span>{cat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-zinc-800 rounded bg-[#0f0f12] p-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                    RISK FACTORS & SENSITIVITIES
                  </div>
                  <ul className="space-y-1.5 text-zinc-400">
                    {data.ai_insights.risk_factors.map((risk, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="font-mono text-rose-400/80 shrink-0">!</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ForecastTooltip({ active, payload, label, currencySymbol }: any) {
  if (active && payload && payload.length) {
    const pt = payload[0]?.payload as ChartPoint;
    return (
      <div className="rounded border border-zinc-800 bg-[#0f0f12] p-3 shadow-xl font-mono text-xs space-y-1">
        <p className="text-zinc-400 font-semibold">{label}</p>
        <div className="flex justify-between items-center space-x-4">
          <span className="text-zinc-500">Price:</span>
          <span className="font-semibold text-zinc-100 tabular-nums">
            {currencySymbol}{pt.price?.toFixed(2)}
          </span>
        </div>
        {pt.is_prediction && (
          <div className="pt-1 border-t border-zinc-800 space-y-0.5 text-[11px]">
            {pt.predicted_upper && (
              <div className="flex justify-between text-emerald-400">
                <span>Upper:</span>
                <span>{currencySymbol}{pt.predicted_upper.toFixed(2)}</span>
              </div>
            )}
            {pt.predicted_lower && (
              <div className="flex justify-between text-rose-400">
                <span>Lower:</span>
                <span>{currencySymbol}{pt.predicted_lower.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
}
