"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  ChevronDown,
  Check,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  ScanSearch,
  TrendingUp,
} from "lucide-react";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
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

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/market", icon: ChartNoAxesCombined },
  { label: "AI Screener", href: "/ai-screener", icon: ScanSearch },
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
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const pageName = NAV_ITEMS.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`))?.label
    ?? "Overview";
  const initials = (userName?.charAt(0) || userEmail?.charAt(0) || "U").toUpperCase();

  const handleCreatePortfolio = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newPortfolioName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const result = await createPortfolioAction(newPortfolioName);
      if (result.success && result.portfolio) {
        onSelectPortfolio(result.portfolio);
        onPortfolioCreated?.(result.portfolio);
        setNewPortfolioName("");
        setCreateModalOpen(false);
      } else {
        setErrorMsg(result.error || "Failed to create portfolio.");
      }
    } catch (error) {
      console.error("Failed to create portfolio:", error);
      setErrorMsg("Unable to create portfolio. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const portfolioPicker = (
    <div className="relative">
      <button
        type="button"
        aria-expanded={dropdownOpen}
        onClick={() => setDropdownOpen((open) => !open)}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-left text-sm text-[#F4F7F3] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bc8af]"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A9BFBA]">Workspace</span>
          <span className="block truncate font-medium">{activePortfolio?.name ?? "Select portfolio"}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#A9BFBA] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>
      {dropdownOpen && (
        <>
          <button
            type="button"
            aria-label="Close portfolio menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-56 rounded-lg border border-[#e2e5de] bg-white p-1.5 text-[#20312d] shadow-xl">
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7c8981]">
              Your portfolios
            </p>
            <div className="max-h-48 overflow-y-auto">
              {portfolios.map((portfolio) => (
                <button
                  type="button"
                  key={portfolio.id}
                  onClick={() => {
                    onSelectPortfolio(portfolio);
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors ${
                    activePortfolio?.id === portfolio.id
                      ? "bg-[#e8f1eb] font-medium text-[#246b55]"
                      : "text-[#596a63] hover:bg-[#f5f7f3]"
                  }`}
                >
                  <span className="truncate">{portfolio.name}</span>
                  {activePortfolio?.id === portfolio.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
            <div className="my-1 border-t border-[#e2e5de]" />
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setCreateModalOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-[#596a63] transition-colors hover:bg-[#f5f7f3]"
            >
              <FolderPlus className="h-4 w-4" />
              Create portfolio
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <aside className="app-sidebar fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#173B3B] px-4 py-5 text-[#F4F7F3] lg:flex">
        <Link href="/dashboard" className="mb-9 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#d6e6d9] text-[#173B3B]">
            <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.03em]">SimpleInvest</span>
        </Link>

        <nav aria-label="Main navigation" className="space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bc8af] ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-[#B9CBC5] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#A9BFBA]">Your workspace</p>
          {portfolioPicker}
          <p className="mt-2 px-1 text-xs leading-5 text-[#A9BFBA]">
            Personal portfolio
            <br />
            Paper money. Real learning.
          </p>
        </div>

        <div className="mt-auto space-y-4 border-t border-white/10 pt-4">
          <Link href="/market" className="block px-2 text-xs text-[#B9CBC5] transition-colors hover:text-white">
            Help &amp; learning
          </Link>
          <div className="flex items-center gap-2.5 px-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d6e6d9] text-xs font-semibold text-[#173B3B]">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-[#F4F7F3]">{userName}</span>
              <span className="block truncate text-[10px] text-[#A9BFBA]">{userEmail}</span>
            </span>
            <form action={async () => { await logout(); }}>
              <button
                type="submit"
                aria-label="Sign out"
                className="rounded-md p-2 text-[#B9CBC5] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bc8af]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 flex h-[62px] items-center justify-between border-b border-[#e2e5de] bg-[#fbfaf7] px-4 lg:left-60 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-[#7c8981] sm:inline">Workspace</span>
          <span className="hidden text-[#a0aaa2] sm:inline">/</span>
          <span className="truncate font-semibold text-[#20312d]">{pageName}</span>
          <span className="ml-2 hidden rounded-full bg-[#e8f1eb] px-2.5 py-1 text-[10px] font-medium text-[#246b55] sm:inline-flex">
            Indicative data
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden text-xs text-[#7c8981] lg:block">Paper trading · No live orders</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e1ebe3] text-xs font-semibold text-[#246b55] lg:hidden">
            {initials}
          </span>
          <span className="hidden text-xs text-[#596a63] lg:block">{userName}</span>
          <form className="lg:hidden" action={async () => { await logout(); }}>
            <button
              type="submit"
              aria-label="Sign out"
              className="rounded-md p-2 text-[#596a63] hover:bg-[#f0f1eb]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#e2e5de] bg-[#fbfaf7] px-2 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-medium ${
                isActive ? "text-[#246b55]" : "text-[#7c8981]"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="fixed left-3 right-3 top-[70px] z-30 lg:hidden">{portfolioPicker}</div>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <div className="w-full">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold text-[#20312d]">Create portfolio</DialogTitle>
            <DialogDescription className="text-sm text-[#7c8981]">
              Give your paper-trading workspace a name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePortfolio} className="mt-5 space-y-4">
            <div>
              <label htmlFor="portfolio-name" className="mb-1.5 block text-xs font-medium text-[#596a63]">
                Portfolio name
              </label>
              <Input
                id="portfolio-name"
                type="text"
                placeholder="e.g. Long-term portfolio"
                value={newPortfolioName}
                onChange={(event) => setNewPortfolioName(event.target.value)}
                className="h-10 rounded-md border-[#e2e5de] bg-white text-sm text-[#20312d] placeholder:text-[#a0aaa2] focus:border-[#246b55] focus:ring-0"
                autoFocus
                required
              />
            </div>
            {errorMsg && <p role="alert" className="text-sm text-[#b85447]">{errorMsg}</p>}
            <DialogFooter className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !newPortfolioName.trim()}
                className="bg-[#246b55] text-white hover:bg-[#1d5b48]"
              >
                {isSubmitting ? "Creating..." : "Create portfolio"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </>
  );
}
