"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, Terminal } from "lucide-react";

interface AIInsightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  insight: {
    momentum_score: number;
    trend: string;
    analysis: string;
  } | null;
  isLoading: boolean;
}

export function AIInsightDrawer({
  isOpen,
  onClose,
  ticker,
  insight,
  isLoading,
}: AIInsightDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#0c0c0e] border-l border-zinc-800 p-5 shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Terminal className="text-zinc-400 h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  QUANT MOMENTUM DIAGNOSTIC
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-900"
              >
                <X size={16} />
              </button>
            </div>

            <div className="pt-3 pb-2">
              <span className="font-mono font-bold text-lg text-zinc-100">{ticker}</span>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">Statistical Trajectory & Trend Vector</p>
            </div>

            <div className="flex-1 mt-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-3 font-mono text-xs text-zinc-500">
                  <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  <span>Computing vector velocity...</span>
                </div>
              ) : insight ? (
                <div className="space-y-4 font-mono text-xs">
                  {/* Metric Strip */}
                  <div className="border border-zinc-800 rounded bg-zinc-950/70 divide-y divide-zinc-800">
                    <div className="flex justify-between items-center px-3 py-2.5">
                      <span className="text-zinc-500 uppercase text-[10px] tracking-wider">MOMENTUM INDEX</span>
                      <span className="font-semibold text-zinc-200 tabular-nums">
                        {insight.momentum_score.toFixed(0)} / 100
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2.5">
                      <span className="text-zinc-500 uppercase text-[10px] tracking-wider">TREND DIRECTION</span>
                      <div className="flex items-center space-x-1.5 font-semibold">
                        {insight.trend === "BULLISH" && <TrendingUp className="text-emerald-400 h-3.5 w-3.5" />}
                        {insight.trend === "BEARISH" && <TrendingDown className="text-rose-400 h-3.5 w-3.5" />}
                        {insight.trend === "NEUTRAL" && <Minus className="text-zinc-400 h-3.5 w-3.5" />}
                        <span
                          className={
                            insight.trend === "BULLISH"
                              ? "text-emerald-400"
                              : insight.trend === "BEARISH"
                              ? "text-rose-400"
                              : "text-zinc-300"
                          }
                        >
                          {insight.trend}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="border border-zinc-800 rounded bg-[#0f0f12] p-4 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                      TECHNICAL SYNTHESIS
                    </div>
                    <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                      {insight.analysis}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-zinc-600 font-mono text-xs">
                  NO MOMENTUM TELEMETRY
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
