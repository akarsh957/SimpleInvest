"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { formatCurrency } from "@/src/lib/utils";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddHolding: (
    ticker: string,
    shares: number,
    buyPrice: number
  ) => Promise<{ success: boolean; error?: string }>;
}

const PRESET_TICKERS = ["NVDA", "AAPL", "MSFT", "TSLA", "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "SPY"];

export function AddAssetDialog({ open, onOpenChange, onAddHolding }: AddAssetDialogProps) {
  const [ticker, setTicker]       = useState("");
  const [shares, setShares]       = useState("");
  const [buyPrice, setBuyPrice]   = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parsedShares = parseFloat(shares) || 0;
  const parsedPrice  = parseFloat(buyPrice) || 0;
  const totalCost    = parsedShares * parsedPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) { setErrorMessage("Enter a valid asset symbol."); return; }
    if (parsedShares <= 0) { setErrorMessage("Quantity must be greater than zero."); return; }
    if (parsedPrice < 0)   { setErrorMessage("Buy price cannot be negative."); return; }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await onAddHolding(cleanTicker, parsedShares, parsedPrice);
      if (res.success) {
        setTicker(""); setShares(""); setBuyPrice("");
        onOpenChange(false);
      } else {
        setErrorMessage(res.error || "Failed to add position.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Position add error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#262A34] bg-[#1A1D24] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Add Position</h3>
            <p className="text-[11px] text-[#5A6070] mt-0.5">Add a holding to your portfolio</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-lg border border-[#262A34] text-[#5A6070] hover:text-[#A0A8B8] flex items-center justify-center hover:bg-[#20242D] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker Input */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#5A6070] mb-1.5">
              Ticker Symbol
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5A6070]" />
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. NVDA, AAPL, RELIANCE.NS"
                className="w-full h-9 rounded-lg bg-[#14171D] border border-[#262A34] pl-9 pr-3 text-xs font-mono text-white uppercase focus:border-[#383E4C] focus:outline-none placeholder:text-[#373D4A]"
                required
                autoFocus
              />
            </div>

            {/* Quick-select chips */}
            <div className="mt-2 flex flex-wrap gap-1">
              {PRESET_TICKERS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => { setTicker(sym); setErrorMessage(""); }}
                  className={`h-6 px-2 rounded-md text-[10px] font-mono border transition-all ${
                    ticker === sym
                      ? "border-[#00D09C]/30 bg-[#00D09C]/10 text-[#00D09C]"
                      : "border-[#262A34] bg-[#14171D] text-[#5A6070] hover:text-[#A0A8B8] hover:border-[#383E4C]"
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Shares & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#5A6070] mb-1.5">
                Quantity (Shares)
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                className="w-full h-9 rounded-lg bg-[#14171D] border border-[#262A34] px-3 text-xs font-mono text-white focus:border-[#383E4C] focus:outline-none placeholder:text-[#373D4A] tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#5A6070] mb-1.5">
                Avg Buy Price
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 rounded-lg bg-[#14171D] border border-[#262A34] px-3 text-xs font-mono text-white focus:border-[#383E4C] focus:outline-none placeholder:text-[#373D4A] tabular-nums"
                required
              />
            </div>
          </div>

          {/* Total Cost Preview */}
          {totalCost > 0 && (
            <div className="rounded-lg border border-[#262A34] bg-[#14171D] px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-[#5A6070]">Invested Amount:</span>
              <span className="text-sm font-bold text-white tabular-nums font-mono">
                {formatCurrency(totalCost)}
              </span>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="p-3 bg-[#EB5B3C]/10 border border-[#EB5B3C]/25 rounded-lg text-[#EB5B3C] text-xs">
              {errorMessage}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end space-x-2 pt-1 border-t border-[#262A34]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg text-xs text-[#A0A8B8] border border-[#262A34] bg-[#14171D] hover:bg-[#20242D] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-[#00D09C] text-[#0B0E11] hover:bg-[#00B88A] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Adding..." : "Add to Portfolio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
