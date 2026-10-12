"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  currentPrice: number;
  userId?: string;
  initialSide?: "BUY" | "SELL";
  onTradeSuccess?: () => void;
}

export function TradeModal({
  isOpen,
  onClose,
  ticker,
  currentPrice,
  userId = "00000000-0000-0000-0000-000000000000",
  initialSide = "BUY",
  onTradeSuccess,
}: TradeModalProps) {
  const [side, setSide] = useState<"BUY" | "SELL">(initialSide);
  const [shares, setShares] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSide) setSide(initialSide);
  }, [initialSide]);

  const totalValue = typeof shares === "number" ? shares * currentPrice : 0;
  const buyingPower = 100000.0;

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shares || shares <= 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/trade/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ticker,
          side,
          shares: Number(shares),
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        data = { detail: text || "Trade execution failed" };
      }

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Trade execution failed");
      }

      if (onTradeSuccess) onTradeSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to execute order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-md p-5 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800/80">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                  ORDER TICKET
                </span>
                <span className="text-zinc-600">•</span>
                <span className="font-mono font-bold text-sm text-zinc-100">
                  {ticker}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-900"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTrade} className="mt-4 space-y-4">
              {error && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 font-mono text-xs">
                  {error}
                </div>
              )}

              {/* Segmented Buy / Sell Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded">
                <button
                  type="button"
                  onClick={() => setSide("BUY")}
                  className={`py-1.5 text-xs font-mono font-semibold rounded transition-colors ${
                    side === "BUY"
                      ? "bg-zinc-800 text-emerald-400 border border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setSide("SELL")}
                  className={`py-1.5 text-xs font-mono font-semibold rounded transition-colors ${
                    side === "SELL"
                      ? "bg-zinc-800 text-rose-400 border border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Order Inputs */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                      Quantity (Shares)
                    </label>
                    <span className="text-[10px] font-mono text-zinc-600">LIMIT / MKT</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={shares}
                    onChange={(e) =>
                      setShares(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded px-3 text-sm font-mono text-zinc-100 outline-none focus:border-zinc-600 transition placeholder:text-zinc-600 tabular-nums"
                    placeholder="0"
                    autoFocus
                  />
                </div>

                {/* Tabular Order Breakdown */}
                <div className="border border-zinc-800/80 divide-y divide-zinc-800/80 rounded bg-zinc-950/60 font-mono text-xs">
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-zinc-500">Market Price</span>
                    <span className="text-zinc-200 tabular-nums">
                      ${currentPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-zinc-500">Quantity</span>
                    <span className="text-zinc-200 tabular-nums">
                      {shares ? Number(shares).toLocaleString() : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-zinc-500">Estimated Total</span>
                    <span className={`font-semibold tabular-nums ${side === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>
                      ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-zinc-500">Available Buying Power</span>
                    <span className="text-zinc-400 tabular-nums">
                      ${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !shares || shares <= 0}
                className={`w-full h-9 rounded font-medium text-xs transition-colors font-mono ${
                  isSubmitting || !shares || shares <= 0
                    ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                    : side === "BUY"
                    ? "bg-zinc-100 text-zinc-950 hover:bg-white font-semibold"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 font-semibold"
                }`}
              >
                {isSubmitting
                  ? "TRANSMITTING..."
                  : `TRANSMIT ${side} ORDER`}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
