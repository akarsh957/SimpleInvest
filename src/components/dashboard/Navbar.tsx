"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  LogOut,
  FolderPlus,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  Check,
  Bell,
  Search,
  Zap,
  Sparkles,
  LayoutDashboard,
  Compass,
  X,
  Activity,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { logout } from "@/actions/auth";
import { Portfolio } from "@/src/types/portfolio";
import { createPortfolioAction } from "@/src/actions/portfolio";

interface NavbarProps {
  userEmail?: string;
  userName?: string;
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  onSelectPortfolio: (portfolio: Portfolio) => void;
  onPortfolioCreated?: (portfolio: Portfolio) => void;
}

const MARKET_TICKERS = [
  { symbol: "S&P 500", val: "5,842.20", change: "+0.64%", positive: true },
  { symbol: "NASDAQ", val: "18,485.10", change: "+1.12%", positive: true },
  { symbol: "NVDA", val: "$132.50", change: "+3.31%", positive: true },
  { symbol: "TSLA", val: "$254.30", change: "+5.00%", positive: true },
  { symbol: "RELIANCE.NS", val: "₹2,940.00", change: "+1.22%", positive: true },
  { symbol: "TCS.NS", val: "₹3,920.00", change: "-0.47%", positive: false },
  { symbol: "HDFCBANK.NS", val: "₹1,685.00", change: "+0.85%", positive: true },
  { symbol: "BTC/USD", val: "$64,250", change: "+2.45%", positive: true },
];

export function Navbar({
  userEmail = "investor@simpleinvest.ai",
  userName = "Institutional Member",
  portfolios = [],
  activePortfolio,
  onSelectPortfolio,
  onPortfolioCreated,
}: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);


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
    { label: "Market Trends", href: "/market", icon: Activity },
    { label: "AI Growth Radar", href: "/ai-screener", icon: Compass, badge: "Groq" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-black/40 backdrop-blur-2xl">
      {/* Top Live Market Ticker Ribbon */}
      <div className="border-b border-white/[0.05] bg-white/[0.02] px-4 py-1 text-[11px] text-slate-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Markets Open • NYSE & NSE Live Stream
            </span>
          </div>

          {/* Animated Marquee Container */}
          <div className="hidden md:flex flex-1 items-center overflow-hidden mx-6 mask-gradient relative">
            <div className="animate-marquee flex items-center space-x-8 w-max">
              {[...MARKET_TICKERS, ...MARKET_TICKERS].map((t, idx) => (
                <div key={`${t.symbol}-${idx}`} className="flex items-center space-x-1.5 tabular-nums cursor-default group transition-colors">
                  <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">{t.symbol}</span>
                  <span className="text-slate-400">{t.val}</span>
                  <span className={`font-bold ${t.positive ? "text-amber-400 group-hover:text-amber-300" : "text-rose-400 group-hover:text-rose-300"} transition-colors`}>
                    {t.change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[10px] text-slate-400">
            <span className="hidden sm:inline">256-Bit SSL Encrypted</span>
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-slate-300 font-mono border border-white/[0.08]">
              USD & INR
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Enterprise Logo & Portfolio Selector */}
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 shadow-lg shadow-amber-950/50 border border-amber-400/30 text-black">
              <TrendingUp className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Simple<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">Invest</span>
                </span>
                <span className="rounded-full bg-amber-950/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-400 border border-amber-500/30 shadow-sm">
                  Platinum
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400">
                Enterprise AI Wealth Intelligence
              </p>
            </div>
          </Link>

          <div className="h-6 w-[1px] bg-white/[0.1]" />

          {/* Main Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-950/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-amber-950/90 text-amber-400 px-1.5 py-0.5 text-[9px] font-bold border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block h-6 w-[1px] bg-white/[0.1]" />

          {/* Portfolio Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.07] hover:border-amber-500/30 shadow-sm"
            >
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span className="max-w-[120px] truncate sm:max-w-[160px]">
                {activePortfolio ? activePortfolio.name : "Select Portfolio"}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 z-50 w-64 rounded-2xl border border-white/[0.1] bg-black/95 py-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Your Portfolios
                  </div>
                  <div className="max-h-56 overflow-y-auto px-1 space-y-1">
                    {portfolios.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPortfolio(p);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                          activePortfolio?.id === p.id
                            ? "bg-amber-950/60 text-amber-300 border border-amber-500/30 font-semibold"
                            : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {activePortfolio?.id === p.id && (
                          <Check className="h-4 w-4 text-amber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="my-2 border-t border-white/[0.08]" />
                  <div className="px-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setCreateModalOpen(true);
                      }}
                      className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-950/40 border border-dashed border-amber-500/30 transition"
                    >
                      <FolderPlus className="h-4 w-4" />
                      <span>Create New Portfolio</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Navigation (Mobile) + Quick Search, Notifications, Profile & Logout */}
        <div className="flex items-center space-x-3">
          {/* Quick Nav for Mobile */}
          <div className="flex lg:hidden items-center space-x-1 border-r border-white/[0.08] pr-2 mr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2 rounded-xl text-xs transition ${
                    isActive ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white"
                  }`}
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>


          {/* Notification Center Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-slate-300 hover:bg-white/[0.06] hover:text-white transition"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-80 rounded-2xl border border-white/[0.1] bg-[#07090e]/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="text-xs font-bold text-white">Market & AI Alerts</span>
                    <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                      2 Unread
                    </span>
                  </div>
                  <div className="mt-3 space-y-3 text-xs">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-2.5">
                      <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Growth Radar Updated</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        New high-conviction opportunity detected in Tech sector with 25%+ upside potential.
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-2.5">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold mb-1">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Live Stream Connected</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Real-time market feeds active for NYSE & NSE tickers via yfinance & Groq API.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center space-x-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-md">
              {userName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-none">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <form action={async () => { await logout(); }}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-rose-400 hover:border-rose-500/30"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Modal: Create New Portfolio */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#07090e] p-6 shadow-2xl">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-lg font-bold text-white">
                Create Enterprise Portfolio
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Group your equities, mutual funds, and crypto assets into an isolated risk portfolio.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePortfolio} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Portfolio Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. High Growth Tech, Retirement IRA, Clean Energy"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="border-white/[0.1] bg-white/[0.03] text-white placeholder:text-slate-600"
                  autoFocus
                  required
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-400">{errorMsg}</p>
              )}

              <DialogFooter className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  disabled={isSubmitting || !newPortfolioName.trim()}
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
