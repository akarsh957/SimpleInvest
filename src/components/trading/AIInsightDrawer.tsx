"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={reduceMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 240 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-[#e2e5de] bg-white p-5 text-[#20312d] shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#e2e5de]">
              <div className="flex items-center space-x-2">
                <Terminal className="text-[#246b55] h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#596a63]">
                  Technical insight
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close insight panel"
                className="text-[#7c8981] hover:text-[#20312d] transition-colors p-1 rounded hover:bg-[#f0f1eb]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="pt-3 pb-2">
              <span className="font-semibold text-lg text-[#20312d]">{ticker}</span>
              <p className="text-xs text-[#7c8981] mt-0.5">Momentum and trend summary</p>
            </div>

            <div className="flex-1 mt-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-3 text-xs text-[#7c8981]">
                  <div className="w-5 h-5 border-2 border-[#cbd3ca] border-t-[#246b55] rounded-full animate-spin" />
                  <span>Preparing technical summary…</span>
                </div>
              ) : insight ? (
                <div className="space-y-4 text-xs">
                  {/* Metric Strip */}
                  <div className="border border-[#e2e5de] rounded-md bg-[#f5f7f3] divide-y divide-[#e2e5de]">
                    <div className="flex justify-between items-center px-3 py-2.5">
                      <span className="text-[#7c8981] uppercase text-[10px] tracking-wider">Momentum index</span>
                      <span className="font-semibold text-[#20312d] tabular-nums">
                        {insight.momentum_score.toFixed(0)} / 100
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2.5">
                      <span className="text-[#7c8981] uppercase text-[10px] tracking-wider">Trend direction</span>
                      <div className="flex items-center space-x-1.5 font-semibold">
                        {insight.trend === "BULLISH" && <TrendingUp className="text-[#246b55] h-3.5 w-3.5" />}
                        {insight.trend === "BEARISH" && <TrendingDown className="text-[#b85447] h-3.5 w-3.5" />}
                        {insight.trend === "NEUTRAL" && <Minus className="text-[#7c8981] h-3.5 w-3.5" />}
                        <span
                          className={
                            insight.trend === "BULLISH"
                              ? "text-[#246b55]"
                              : insight.trend === "BEARISH"
                              ? "text-[#b85447]"
                              : "text-[#596a63]"
                          }
                        >
                          {insight.trend}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="border border-[#e2e5de] rounded-md bg-white p-4 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#7c8981] font-semibold">
                      Technical summary
                    </div>
                    <p className="text-xs text-[#596a63] leading-relaxed">
                      {insight.analysis}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-[#7c8981] text-xs">
                  No technical summary is available.
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
