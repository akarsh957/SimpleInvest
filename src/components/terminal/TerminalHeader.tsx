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
  Search,
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
  { symbol: "NIFTY 50",  val: "25,127.90", change: "+0.42%", pos: true  },
  { symbol: "SENSEX",    val: "82,948.65", change: "+0.38%", pos: true  },
  { symbol: "S&P 500",   val: "5,842.20",  change: "+0.64%", pos: true  },
  { symbol: "NASDAQ",    val: "18,485.10", change: "+1.12%", pos: true  },
  { symbol: "NVDA",      val: "$132.50",   change: "+3.31%", pos: true  },
  { symbol: "TSLA",      val: "$254.30",   change: "+5.00%", pos: true  },
  { symbol: "RELIANCE",  val: "₹2,940",   change: "+1.22%", pos: true  },
  { symbol: "TCS",       val: "₹3,920",   change: "-0.47%", pos: false },
];

export function TerminalHeader({
  userEmail = "investor@simpleinvest.in",
  userName = "Investor",
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
    { label: "Investments", href: "/dashboard" },
    { label: "Explore",     href: "/market"    },
    { label: "AI Screener", href: "/ai-screener" },
  ];

  const initials = (userName?.charAt(0) || userEmail?.charAt(0) || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* ── Index Strip ─────────────────────────────────── */}
      <div className="h-9 bg-[#0E1014] border-b border-[#262A34] px-6 flex items-center justify-between text-[11px] select-none">
        {/* Live dot + label */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00D09C] live-dot" />
          <span className="text-[10px] uppercase tracking-widest text-[#5A6070] font-semibold font-mono">LIVE</span>
        </div>

        {/* Ticker marquee */}
        <div className="flex-1 overflow-hidden mx-6 mask-gradient">
          <div className="animate-marquee flex items-center space-x-8 whitespace-nowrap font-mono">
            {[...LIVE_INDICES, ...LIVE_INDICES].map((item, idx) => (
              <div key={`${item.symbol}-${idx}`} className="inline-flex items-center space-x-1.5 tabular-nums">
                <span className="text-[#5A6070] font-medium text-[10px]">{item.symbol}</span>
                <span className="text-[#A0A8B8] text-[11px]">{item.val}</span>
                <span className={`font-medium text-[10px] ${item.pos ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Currency switcher */}
        <div className="flex items-center shrink-0">
          <div className="flex items-center rounded-md border border-[#262A34] bg-[#14171D] p-0.5">
            {(["USD", "INR"] as const).map((cur) => (
              <button
                key={cur}
                onClick={() => setSelectedCurrency(cur)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                  selectedCurrency === cur
                    ? "bg-[#1A1D24] text-white font-semibold shadow-sm"
                    : "text-[#5A6070] hover:text-[#A0A8B8]"
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Header ─────────────────────────────────── */}
      <div className="h-16 bg-[#121418]/90 backdrop-blur-md border-b border-[#262A34] px-6 flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center space-x-8">
          {/* Brand Mark */}
          <Link href="/dashboard" className="flex items-center space-x-2.5 group shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D09C] to-[#5367FF] flex items-center justify-center shadow-lg shadow-[#00D09C]/10">
              <TrendingUp className="h-4 w-4 text-[#0B0E11] stroke-[2.5]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              SimpleInvest
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-sm px-3 py-1.5 rounded-md transition-all whitespace-nowrap font-medium ${
                    isActive
                      ? "text-[#00D09C] nav-active-indicator"
                      : "text-[#A0A8B8] hover:text-white hover:bg-[#1A1D24]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + Portfolio + User */}
        <div className="flex items-center space-x-3">
          {/* Global Search */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-[#5A6070]" />
            <input
              type="text"
              placeholder="Search stocks, ETFs..."
              className="w-56 h-9 bg-[#1A1D24] border border-[#262A34] rounded-lg pl-9 pr-10 text-xs text-[#A0A8B8] placeholder:text-[#5A6070] focus:outline-none focus:border-[#383E4C] transition-colors"
            />
            <span className="absolute right-3 text-[10px] font-mono text-[#373D4A] select-none">⌘K</span>
          </div>

          {/* Portfolio Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-9 text-xs border border-[#262A34] bg-[#1A1D24] text-[#A0A8B8] rounded-lg px-3 flex items-center space-x-2 hover:bg-[#20242D] hover:border-[#383E4C] transition-all"
            >
              <span className="text-[#5A6070] text-[10px] font-mono uppercase tracking-wide">Portfolio:</span>
              <span className="max-w-[120px] truncate font-medium text-white">
                {activePortfolio ? activePortfolio.name : "Select"}
              </span>
              <ChevronDown className={`h-3 w-3 text-[#5A6070] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-[#262A34] bg-[#1A1D24] py-1.5 shadow-2xl shadow-black/40">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#5A6070]">
                    Your Portfolios
                  </div>
                  <div className="max-h-48 overflow-y-auto px-1.5 space-y-0.5">
                    {portfolios.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { onSelectPortfolio(p); setDropdownOpen(false); }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                          activePortfolio?.id === p.id
                            ? "bg-[#00D09C]/10 text-[#00D09C] font-medium"
                            : "text-[#A0A8B8] hover:bg-[#20242D] hover:text-white"
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {activePortfolio?.id === p.id && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                  <div className="my-1.5 border-t border-[#262A34]" />
                  <div className="px-1.5">
                    <button
                      onClick={() => { setDropdownOpen(false); setCreateModalOpen(true); }}
                      className="flex w-full items-center space-x-2 rounded-lg px-2.5 py-2 text-xs text-[#A0A8B8] hover:bg-[#20242D] hover:text-white transition-colors"
                    >
                      <FolderPlus className="h-3.5 w-3.5 text-[#5367FF]" />
                      <span>New Portfolio</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Avatar */}
          <div
            className="h-9 w-9 rounded-full bg-gradient-to-br from-[#5367FF] to-[#00D09C] text-[#0B0E11] text-sm flex items-center justify-center font-bold select-none cursor-default shadow-md"
            title={userEmail}
          >
            {initials}
          </div>

          {/* Logout */}
          <form action={async () => { await logout(); }}>
            <button
              type="submit"
              className="h-9 w-9 rounded-lg border border-[#262A34] bg-[#1A1D24] text-[#5A6070] hover:text-[#EB5B3C] hover:border-[#383E4C] flex items-center justify-center transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ── Create Portfolio Modal ───────────────────────── */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#262A34] bg-[#1A1D24] p-6 shadow-2xl">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-sm font-semibold text-white">
                Create Portfolio
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5A6070]">
                Give your new investment portfolio a name.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePortfolio} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#5A6070] mb-1.5">
                  Portfolio Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Core Tech, Retirement, India Growth"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="h-9 text-xs border-[#262A34] bg-[#14171D] text-white placeholder:text-[#373D4A] rounded-lg focus:border-[#00D09C]/50 focus:ring-0"
                  autoFocus
                  required
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-[#EB5B3C]">{errorMsg}</p>
              )}

              <DialogFooter className="flex justify-end space-x-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  className="h-9 px-4 text-xs border-[#262A34] bg-[#14171D] text-[#A0A8B8] hover:bg-[#20242D] rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !newPortfolioName.trim()}
                  className="h-9 px-4 text-xs bg-[#00D09C] text-[#0B0E11] hover:bg-[#00B88A] rounded-lg font-semibold"
                >
                  {isSubmitting ? "Creating..." : "Create Portfolio"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </Dialog>
    </header>
  );
}
