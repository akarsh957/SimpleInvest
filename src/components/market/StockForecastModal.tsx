"use client";

import React, { useState, useEffect } from "react";
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
} from "recharts";
import { X, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
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
  confidence_basis: "language_model" | "quantitative_model";
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
        const timeframeMap: Record<string, string> = {
          "1W": "1mo",
          "1M": "1mo",
          "3M": "3mo",
          "6M": "6mo",
          "1Y": "1y",
        };
        const res = await fetch("/api/market/forecast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker,
            timeframe: timeframeMap[timeframe] ?? "1mo",
            forecast_days: forecastDays,
          }),
        });
        if (!res.ok) {
          const failure = await res.json().catch(() => null);
          throw new Error(failure?.detail || `Failed to load forecast (${res.status})`);
        }
        const json = await res.json();
        if (!isCancelled) setData(json);
      } catch (err: any) {
        if (!isCancelled) setError(err.message || "Failed to load forecast model.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchForecast();
    return () => { isCancelled = true; };
  }, [ticker, timeframe, forecastDays]);

  if (!ticker) return null;

  const sym = data?.currency === "INR" ? "₹" : "$";
  const currentPrice  = data?.current_price || 0;
  const targetPrice   = data?.ai_insights.target_price   || currentPrice * 1.05;
  const bullTarget    = data?.ai_insights.bull_case_target || currentPrice * 1.15;
  const bearTarget    = data?.ai_insights.bear_case_target || currentPrice * 0.90;
  const confidence    = data?.ai_insights.confidence_score;
  const projChangePct = data?.ai_insights.projected_change_pct || 5.0;

  const metricBar = [
    {
      label: `${forecastDays}D AI Target`,
      value: `${sym}${targetPrice.toFixed(2)}`,
      sub: `${projChangePct >= 0 ? "+" : ""}${projChangePct.toFixed(2)}% projected`,
      subColor: projChangePct >= 0 ? "text-[#00D09C]" : "text-[#EB5B3C]",
      accent: "text-white",
    },
    {
      label: "Bull Case",
      value: `${sym}${bullTarget.toFixed(2)}`,
      sub: "Optimistic boundary",
      subColor: "text-[#5A6070]",
      accent: "text-[#00D09C]",
    },
    {
      label: "Bear Case",
      value: `${sym}${bearTarget.toFixed(2)}`,
      sub: "Downside floor",
      subColor: "text-[#5A6070]",
      accent: "text-[#EB5B3C]",
    },
    {
      label: "Signal Confidence",
      value: confidence == null ? "—" : `${confidence}%`,
      sub: confidence == null
        ? "Confidence unavailable"
        : `Signal: ${data?.ai_insights.signal || "N/A"} · ${
          data?.ai_insights.confidence_basis === "quantitative_model"
            ? "Quantitative estimate"
            : "Language model estimate"
        }`,
      subColor: "text-[#5367FF]",
      accent: "text-[#5367FF]",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`w-full ${isMaximized ? "max-w-[98vw] h-[95vh]" : "max-w-5xl max-h-[92vh]"} flex flex-col rounded-xl border border-[#262A34] bg-[#1A1D24] shadow-2xl overflow-hidden transition-all`}
        >
          {/* ── Modal Header ─────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#262A34] bg-[#14171D] shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-[#5367FF]/10 border border-[#5367FF]/20 text-[#5367FF] text-sm font-bold flex items-center justify-center">
                {ticker.replace(".NS", "").charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base text-white font-mono">{ticker}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md border border-[#262A34] text-[#5A6070] font-mono">
                    {data?.sector || "Equities"}
                  </span>
                </div>
                <p className="text-xs text-[#5A6070] mt-0.5">{data?.company_name || "Asset"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onTrade && (
                <button
                  onClick={() => onTrade(ticker, currentPrice)}
                  className="h-8 px-4 rounded-lg bg-[#00D09C] text-[#0B0E11] text-xs font-semibold hover:bg-[#00B88A] transition-colors"
                >
                  Buy {ticker}
                </button>
              )}
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="h-8 w-8 rounded-lg border border-[#262A34] text-[#5A6070] hover:text-[#A0A8B8] flex items-center justify-center hover:bg-[#20242D] transition-colors"
              >
                {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg border border-[#262A34] text-[#5A6070] hover:text-[#A0A8B8] flex items-center justify-center hover:bg-[#20242D] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* ── 4-Column Metric Bar ───────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#262A34] border-b border-[#262A34] bg-[#14171D] shrink-0">
            {metricBar.map((m, i) => (
              <div key={i} className="p-4">
                <p className="text-[10px] uppercase tracking-widest text-[#5A6070] mb-1 font-medium">{m.label}</p>
                <p className={`text-lg font-bold tabular-nums font-mono ${m.accent}`}>{m.value}</p>
                <p className={`text-[11px] mt-0.5 ${m.subColor}`}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Modal Body ───────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Chart Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-[#14171D] rounded-lg p-1">
                {(["1W", "1M", "3M", "6M", "1Y"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${
                      timeframe === tf
                        ? "bg-[#1A1D24] text-white border border-[#262A34] shadow-sm"
                        : "text-[#5A6070] hover:text-[#A0A8B8]"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-[#5A6070] font-mono">HORIZON:</span>
                {[15, 30, 60].map((d) => (
                  <button
                    key={d}
                    onClick={() => setForecastDays(d)}
                    className={`h-7 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                      forecastDays === d
                        ? "border-[#5367FF]/40 bg-[#5367FF]/10 text-[#5367FF]"
                        : "border-[#262A34] bg-[#14171D] text-[#5A6070] hover:text-[#A0A8B8]"
                    }`}
                  >
                    {d}D
                  </button>
                ))}
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className={`h-7 px-2.5 rounded-lg text-xs border transition-all ${
                    showVolume
                      ? "border-[#262A34] bg-[#20242D] text-[#A0A8B8]"
                      : "border-[#262A34] bg-[#14171D] text-[#5A6070]"
                  }`}
                >
                  Vol
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-72 w-full border border-[#262A34] rounded-xl bg-[#14171D] p-4">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2 text-[#5A6070] text-xs font-mono">
                  <RefreshCw className="h-5 w-5 animate-spin text-[#5367FF]" />
                  <span>Computing AI price projection...</span>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center text-[#EB5B3C] text-xs font-mono">{error}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data?.chart_data || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#5367FF" stopOpacity={0.10} />
                        <stop offset="100%" stopColor="#5367FF" stopOpacity={0.00} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262A34" vertical={false} />
                    <XAxis dataKey="display_date" stroke="#5A6070" fontSize={10} tickLine={false} axisLine={{ stroke: "#262A34" }} fontFamily="var(--font-mono)" />
                    <YAxis yAxisId="price" stroke="#5A6070" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `${sym}${v.toFixed(0)}`} fontFamily="var(--font-mono)" />
                    {showVolume && (
                      <YAxis yAxisId="volume" orientation="right" stroke="#373D4A" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} fontFamily="var(--font-mono)" />
                    )}
                    <Tooltip content={<ForecastTooltip currencySymbol={sym} />} />
                    <Area yAxisId="price" type="monotone" dataKey="predicted_upper" stroke="none" fill="url(#aiGradient)" fillOpacity={1} />
                    <Line yAxisId="price" type="monotone" dataKey="historical_price" name="Historical" stroke="#00D09C" strokeWidth={2} dot={false} />
                    <Line yAxisId="price" type="monotone" dataKey="predicted_price" name="AI Projection" stroke="#5367FF" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                    <Line yAxisId="price" type="monotone" dataKey="moving_average" name="20D SMA" stroke="#5A6070" strokeWidth={1} dot={false} />
                    {showVolume && <Bar yAxisId="volume" dataKey="volume" name="Volume" fill="#262A34" opacity={0.5} />}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Insights Grid */}
            {data?.ai_insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#14171D] border border-[#262A34] rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00D09C]" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6070]">Growth Catalysts</p>
                  </div>
                  <ul className="space-y-2">
                    {data.ai_insights.catalysts.map((cat, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-[#A0A8B8] leading-relaxed">
                        <span className="text-[#00D09C] font-mono text-[10px] shrink-0 mt-0.5">[{idx + 1}]</span>
                        <span>{cat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#14171D] border border-[#262A34] rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#EB5B3C]" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6070]">Key Risks to Watch</p>
                  </div>
                  <ul className="space-y-2">
                    {data.ai_insights.risk_factors.map((risk, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-[#A0A8B8] leading-relaxed">
                        <span className="text-[#EB5B3C] font-mono text-[10px] shrink-0 mt-0.5">!</span>
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
      <div className="rounded-xl border border-[#262A34] bg-[#1A1D24] p-3 shadow-2xl font-mono text-xs space-y-1.5">
        <p className="text-[#5A6070] font-medium">{label}</p>
        <div className="flex justify-between items-center space-x-4">
          <span className="text-[#5A6070]">Price:</span>
          <span className="font-semibold text-white tabular-nums">{currencySymbol}{pt.price?.toFixed(2)}</span>
        </div>
        {pt.is_prediction && (
          <div className="pt-1.5 border-t border-[#262A34] space-y-1">
            {pt.predicted_upper && (
              <div className="flex justify-between text-[#00D09C] text-[11px]">
                <span>Bull target:</span>
                <span>{currencySymbol}{pt.predicted_upper.toFixed(2)}</span>
              </div>
            )}
            {pt.predicted_lower && (
              <div className="flex justify-between text-[#EB5B3C] text-[11px]">
                <span>Bear floor:</span>
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
