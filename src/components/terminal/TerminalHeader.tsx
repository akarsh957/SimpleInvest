"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  LogOut,
  FolderPlus,
  ChevronDown,
  Check,
  LayoutDashboard,
  Activity,
  Compass,
} from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { logout } from "@/actions/auth";
import { Portfolio } from "@/src/types/portfolio";
import { createPortfolioAction } from "@/src/actions/portfolio";

export interface TerminalHeaderProps {
  userEmail?: string;
  userName?: string;
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  onSelectPortfolio: (portfolio: Portfolio) => void;
  onPortfolioCreated?: (portfolio: Portfolio) => void;
}

const LIVE_INDICES = [
  { symbol: "S&P 500", val: "5,842.20", change: "+0.64%", pos: true },
  { symbol: "NASDAQ", val: "18,485.10", change: "+1.12%", pos: true },
  { symbol: "NIFTY 50", val: "25,127.90", change: "+0.42%", pos: true },
  { symbol: "BTC/USD", val: "$64,250", change: "+2.45%", pos: true },
  { symbol: "NVDA", val: "$132.50", change: "+3.31%", pos: true },
  { symbol: "TSLA", val: "$254.30", change: "+5.00%", pos: true },
  { symbol: "RELIANCE.NS", val: "₹2,940.00", change: "+1.22%", pos: true },
  { symbol: "TCS.NS", val: "₹3,920.00", change: "-0.47%", pos: false },
];

export function TerminalHeader({
  userEmail = "trader@simpleinvest.ai",
  userName = "Institutional Member",
  portfolios = [],
  activePortfolio,
  onSelectPortfolio,
  onPortfolioCreated,
}: TerminalHeaderProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "INR">("USD");

  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const res = await createPortfolioAction(newPortfolioName);
    setIsSubmitting(false);

    if (res.success && res.portfolio) {
      onSelectPortfolio(res.portfolio);
      if (onPortfolioCreated) onPortfolioCreated(res.portfolio);
      setNewPortfolioName("");
      setCreateModalOpen(false);
    } else {
      setErrorMsg(res.error || "Failed to create portfolio");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Markets", href: "/market", icon: Activity },
    { label: "Screener", href: "/ai-screener", icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950">
      {/* 1. Top Ticker Bar: h-8 border-b border-zinc-800/80 bg-zinc-950 px-4 */}
      <div className="h-8 border-b border-zinc-800/80 bg-zinc-950 px-4 flex items-center justify-between text-[11px] font-mono select-none">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">FEED</span>
        </div>

        {/* Ticker tape */}
        <div className="flex-1 overflow-hidden mx-4 mask-gradient">
          <div className="animate-marquee flex items-center space-x-6 whitespace-nowrap">
            {[...LIVE_INDICES, ...LIVE_INDICES].map((item, idx) => (
              <div key={`${item.symbol}-${idx}`} className="inline-flex items-center space-x-1.5 tabular-nums">
                <span className="text-zinc-400 font-medium">{item.symbol}</span>
                <span className="text-zinc-200">{item.val}</span>
                <span className={item.pos ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Compact USD / INR Currency Toggle */}
        <div className="flex items-center space-x-1 shrink-0">
          <div className="flex items-center rounded border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              onClick={() => setSelectedCurrency("USD")}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                selectedCurrency === "USD"
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setSelectedCurrency("INR")}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                selectedCurrency === "INR"
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              INR
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar: h-13 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 */}
      <div className="h-13 bg-zinc-950/90 backdrop-blur-md px-6 flex items-center justify-between">
        {/* Left: Minimalist monochrome logo + SimpleInvest */}
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-100 group-hover:border-zinc-700 transition-colors">
              <TrendingUp className="h-3.5 w-3.5 stroke-[2]" />
            </div>
            <span className="font-semibold tracking-tight text-zinc-100 text-base">
              SimpleInvest
            </span>
          </Link>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Nav Links: Single-line horizontal links */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-800/80 text-zinc-100 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Compact portfolio selector dropdown and user avatar button */}
        <div className="flex items-center space-x-3">
          {/* Portfolio Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-8 text-xs border border-zinc-800 bg-zinc-900 text-zinc-200 rounded px-2.5 flex items-center space-x-2 hover:bg-zinc-800/80 transition-colors"
            >
              <span className="font-mono text-zinc-500 uppercase text-[10px]">BOOK:</span>
              <span className="max-w-[130px] truncate font-medium">
                {activePortfolio ? activePortfolio.name : "Select"}
              </span>
              <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-56 rounded-md border border-zinc-800 bg-[#0f0f12] py-1 shadow-xl">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Portfolios
                  </div>
                  <div className="max-h-48 overflow-y-auto px-1 space-y-0.5">
                    {portfolios.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPortfolio(p);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs transition ${
                          activePortfolio?.id === p.id
                            ? "bg-zinc-800 text-zinc-100 font-medium"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {activePortfolio?.id === p.id && (
                          <Check className="h-3.5 w-3.5 text-zinc-200" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="my-1 border-t border-zinc-800" />
                  <div className="px-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setCreateModalOpen(true);
                      }}
                      className="flex w-full items-center space-x-2 rounded px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition"
                    >
                      <FolderPlus className="h-3.5 w-3.5 text-zinc-400" />
                      <span>New Portfolio</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Avatar */}
          <div
            className="h-8 w-8 rounded border border-zinc-800 bg-zinc-900 text-zinc-200 font-mono text-xs flex items-center justify-center font-medium select-none"
            title={userEmail}
          >
            {userName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()}
          </div>

          {/* Logout Form */}
          <form action={async () => { await logout(); }}>
            <button
              type="submit"
              className="h-8 w-8 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-zinc-700 flex items-center justify-center transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Create New Portfolio */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-md border border-zinc-800 bg-[#0f0f12] p-5 shadow-2xl">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-sm font-semibold text-zinc-100">
                Create Portfolio
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Enter an identifier for this asset account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePortfolio} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                  Portfolio Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Core Tech, Retirement"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="h-8 text-xs border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 rounded"
                  autoFocus
                  required
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-mono text-rose-400">{errorMsg}</p>
              )}

              <DialogFooter className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  className="h-8 px-3 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !newPortfolioName.trim()}
                  className="h-8 px-3 text-xs bg-zinc-100 text-zinc-950 hover:bg-white rounded font-medium"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </Dialog>
    </header>
  );
}
