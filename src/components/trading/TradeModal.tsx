"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown } from "lucide-react";

export interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  currentPrice: number;
  initialSide?: "BUY" | "SELL";
  onTradeSuccess?: () => void;
}

export function TradeModal({
  isOpen,
  onClose,
  ticker,
  currentPrice,
  initialSide = "BUY",
  onTradeSuccess,
}: TradeModalProps) {
  const [side, setSide]         = useState<"BUY" | "SELL">(initialSide);
  const [shares, setShares]     = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => { if (initialSide) setSide(initialSide); }, [initialSide]);
  useEffect(() => { if (isOpen) { setShares(""); setError(null); } }, [isOpen]);

  const numShares    = typeof shares === "number" ? shares : 0;
  const estimatedCost = numShares * currentPrice;
  const buyingPower   = 100000.0;
  const remainingCash = buyingPower - (side === "BUY" ? estimatedCost : 0);

  const addShares = (n: number) => {
    setShares((prev) => Math.max(1, (typeof prev === "number" ? prev : 0) + n));
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shares || shares <= 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/trade/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, side, shares: Number(shares) }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        data = { detail: text || "Trade execution failed" };
      }

      if (!response.ok) throw new Error(data?.detail || data?.message || "Trade execution failed");

      if (onTradeSuccess) onTradeSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to execute order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBuy = side === "BUY";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-[#1A1D24] border border-[#262A34] rounded-xl p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-white font-mono">{ticker}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    isBuy ? "bg-[#00D09C]/10 text-[#00D09C]" : "bg-[#EB5B3C]/10 text-[#EB5B3C]"
                  }`}>
                    {isBuy ? "BUY" : "SELL"}
                  </span>
                </div>
                <p className="text-xl font-bold text-white tabular-nums font-mono mt-0.5">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg border border-[#262A34] text-[#5A6070] hover:text-[#A0A8B8] flex items-center justify-center hover:bg-[#20242D] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleTrade} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="p-3 bg-[#EB5B3C]/10 border border-[#EB5B3C]/25 rounded-lg text-[#EB5B3C] text-xs">
                  {error}
                </div>
              )}

              {/* BUY / SELL Segmented Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#14171D] border border-[#262A34] rounded-xl">
                <button
                  type="button"
                  onClick={() => setSide("BUY")}
                  className={`py-2 text-sm font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                    isBuy
                      ? "bg-[#00D09C] text-[#0B0E11] shadow-md shadow-[#00D09C]/20"
                      : "text-[#5A6070] hover:text-[#A0A8B8]"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Buy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSide("SELL")}
                  className={`py-2 text-sm font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                    !isBuy
                      ? "bg-[#EB5B3C] text-white shadow-md shadow-[#EB5B3C]/20"
                      : "text-[#5A6070] hover:text-[#A0A8B8]"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>Sell</span>
                </button>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#5A6070] mb-1.5">
                  Quantity (Shares)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={shares}
                  onChange={(e) => setShares(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-10 bg-[#14171D] border border-[#262A34] rounded-lg px-3 text-sm font-mono text-white outline-none focus:border-[#383E4C] transition-colors placeholder:text-[#373D4A] tabular-nums"
                  placeholder="0"
                  autoFocus
                />
                {/* Quick-Add chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 5, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => addShares(n)}
                      className="h-6 px-2 rounded-md text-[11px] font-medium bg-[#262A34] text-[#A0A8B8] hover:bg-[#383E4C] hover:text-white transition-colors"
                    >
                      +{n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const maxShares = Math.floor(buyingPower / currentPrice);
                      setShares(maxShares);
                    }}
                    className="h-6 px-2 rounded-md text-[11px] font-medium bg-[#262A34] text-[#A0A8B8] hover:bg-[#383E4C] hover:text-white transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Live Portfolio Impact Preview */}
              <div className="bg-[#14171D] border border-[#262A34] rounded-lg divide-y divide-[#262A34] text-xs">
                <div className="flex justify-between items-center px-3 py-2.5">
                  <span className="text-[#5A6070]">Market Price</span>
                  <span className="text-[#A0A8B8] font-mono tabular-nums">
                    ${currentPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5">
                  <span className="text-[#5A6070]">Quantity</span>
                  <span className="text-[#A0A8B8] font-mono tabular-nums">
                    {numShares ? numShares.toLocaleString() : "0"} shares
                  </span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5">
                  <span className="text-[#5A6070]">Estimated Cost</span>
                  <span className={`font-semibold font-mono tabular-nums ${isBuy ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
                    ${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {isBuy && (
                  <div className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-[#5A6070]">Remaining Cash</span>
                    <span className="text-[#A0A8B8] font-mono tabular-nums">
                      ${remainingCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting || !shares || shares <= 0}
                className={`w-full h-11 rounded-xl font-bold text-sm transition-all ${
                  isSubmitting || !shares || shares <= 0
                    ? "bg-[#262A34] text-[#5A6070] cursor-not-allowed"
                    : isBuy
                    ? "bg-[#00D09C] text-[#0B0E11] hover:bg-[#00B88A] shadow-lg shadow-[#00D09C]/20"
                    : "bg-[#EB5B3C] text-white hover:bg-[#D94E31] shadow-lg shadow-[#EB5B3C]/20"
                }`}
              >
                {isSubmitting
                  ? "Processing..."
                  : `${isBuy ? "Buy" : "Sell"} ${numShares || ""} ${ticker} ${numShares ? `· $${estimatedCost.toFixed(2)}` : ""}`}
              </button>

              <p className="text-center text-[10px] text-[#373D4A]">
                Market order · Executed at best available price
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
