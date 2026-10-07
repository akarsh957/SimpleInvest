"use client";

import React, { useState } from "react";
import { Plus, Search, CheckCircle2, AlertCircle, Sparkles, DollarSign } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { formatCurrency } from "@/src/lib/utils";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddHolding: (ticker: string, shares: number, buyPrice: number) => Promise<{ success: boolean; error?: string }>;
}

const POPULAR_TICKERS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "META", name: "Meta" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "TCS.NS", name: "Tata Consultancy" },
  { symbol: "RELIANCE.NS", name: "Reliance Ind." },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
];

export function AddAssetDialog({ open, onOpenChange, onAddHolding }: AddAssetDialogProps) {
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
      setErrorMessage("Please enter a valid stock ticker symbol.");
      return;
    }

    if (parsedShares <= 0) {
      setErrorMessage("Shares count must be greater than 0.");
      return;
    }

    if (parsedPrice < 0) {
      setErrorMessage("Average buy price cannot be negative.");
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
        setErrorMessage(res.error || "Failed to add holding.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPreset = (symbol: string) => {
    setTicker(symbol);
    setErrorMessage("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Add Asset Position</h3>
            <p className="text-xs text-slate-400">
              Enter ticker details to update your real-time risk diagnostic.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Stock / ETF Ticker Symbol
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL, NVDA, TCS.NS, RELIANCE.NS"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 font-mono font-bold uppercase focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Presets */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center mr-1">
                <Sparkles className="h-3 w-3 mr-1 text-emerald-400" /> Presets:
              </span>
              {POPULAR_TICKERS.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleSelectPreset(item.symbol)}
                  className={`rounded-lg border px-2 py-0.5 text-[11px] font-mono font-semibold transition ${
                    ticker === item.symbol
                      ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {item.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Shares & Buy Price Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Number of Shares
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="e.g. 25"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Avg Buy Price ($)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="e.g. 175.50"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Investment Total Calculation Preview */}
          {totalCost > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Total Capital Commitment:</span>
              <span className="font-extrabold text-emerald-400 font-mono text-sm">
                {formatCurrency(totalCost)}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-950/60 p-3 text-xs text-rose-300 border border-rose-500/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              disabled={isSubmitting}
              className="font-bold"
            >
              {isSubmitting ? "Adding Asset..." : "Confirm Asset Position"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
