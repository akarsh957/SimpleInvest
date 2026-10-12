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

const PRESET_TICKERS = [
  "NVDA",
  "AAPL",
  "MSFT",
  "TSLA",
  "RELIANCE.NS",
  "TCS.NS",
  "HDFCBANK.NS",
  "SPY",
];

export function AddAssetDialog({
  open,
  onOpenChange,
  onAddHolding,
}: AddAssetDialogProps) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parsedShares = parseFloat(shares) || 0;
  const parsedPrice = parseFloat(buyPrice) || 0;
  const totalCost = parsedShares * parsedPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();

    if (!cleanTicker) {
      setErrorMessage("Enter a valid asset symbol.");
      return;
    }
    if (parsedShares <= 0) {
      setErrorMessage("Quantity must be greater than zero.");
      return;
    }
    if (parsedPrice < 0) {
      setErrorMessage("Execution price cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await onAddHolding(cleanTicker, parsedShares, parsedPrice);
      if (res.success) {
        setTicker("");
        setShares("");
        setBuyPrice("");
        onOpenChange(false);
      } else {
        setErrorMessage(res.error || "Failed to commit position.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Position commit error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-md border border-zinc-800 bg-[#0f0f12] p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Add Position</h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              COMMIT HOLDING TO ACTIVE BOOK
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-900"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker Input */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Ticker Symbol
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. NVDA, AAPL, RELIANCE.NS"
                className="w-full h-8 rounded bg-zinc-900 border border-zinc-800 pl-8 pr-3 text-xs font-mono text-zinc-100 uppercase focus:border-zinc-600 focus:outline-none placeholder:text-zinc-600"
                required
                autoFocus
              />
            </div>

            {/* Presets */}
            <div className="mt-2 flex flex-wrap gap-1 items-center">
              <span className="text-[10px] font-mono uppercase text-zinc-500 mr-1">
                QUICK:
              </span>
              {PRESET_TICKERS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setTicker(sym);
                    setErrorMessage("");
                  }}
                  className={`h-5 px-1.5 rounded text-[10px] font-mono border transition-colors ${
                    ticker === sym
                      ? "border-zinc-600 bg-zinc-800 text-zinc-100 font-semibold"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Shares & Buy Price Inputs */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                className="w-full h-8 rounded bg-zinc-900 border border-zinc-800 px-3 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none placeholder:text-zinc-600 tabular-nums"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">
                Avg Price
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-8 rounded bg-zinc-900 border border-zinc-800 px-3 text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none placeholder:text-zinc-600 tabular-nums"
                required
              />
            </div>
          </div>

          {/* Total Preview */}
          {totalCost > 0 && (
            <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-2.5 flex justify-between items-center font-mono text-xs">
              <span className="text-zinc-500">Committed Capital:</span>
              <span className="font-semibold text-zinc-100 tabular-nums">
                {formatCurrency(totalCost)}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 font-mono text-xs">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-8 px-3 rounded text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-3 rounded text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-white transition-colors"
            >
              {isSubmitting ? "Committing..." : "Commit Position"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
