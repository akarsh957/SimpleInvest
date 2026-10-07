"use client";

import React, { useState, useMemo } from "react";
import { Trash2, Plus, Layers, Search, ArrowUpDown, Filter, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Holding, HoldingAuditDetail } from "@/src/types/portfolio";
import { formatCurrency } from "@/src/lib/utils";

interface HoldingsTableProps {
  holdings: Holding[];
  auditDetails?: HoldingAuditDetail[];
  isLoading?: boolean;
  onDeleteHolding: (id: string) => Promise<void>;
  onOpenAddModal: () => void;
}

export function HoldingsTable({
  holdings,
  auditDetails = [],
  isLoading,
  onDeleteHolding,
  onOpenAddModal,
}: HoldingsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [sortField, setSortField] = useState<"ticker" | "invested" | "weight_percentage">("invested");
  const [sortAsc, setSortAsc] = useState(false);

  // Merge holdings with FastAPI audit detailed metrics
  const mergedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const detail = auditDetails.find(
        (d) => d.ticker.toUpperCase() === h.ticker.toUpperCase()
      );
      const invested = h.shares * h.average_buy_price;
      const currentValue = detail?.current_value || invested;
      const gainLoss = currentValue - invested;
      const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;

      return {
        ...h,
        company_name: detail?.company_name || h.ticker.replace(".NS", "").replace(".BO", ""),
        sector: detail?.sector || "Technology",
        current_value: currentValue,
        gainLoss,
        gainLossPercent,
        weight_percentage: detail?.weight_percentage || 0,
        risk_vibe: detail?.risk_vibe || "Moderate Bumps",
        invested,
      };
    });
  }, [holdings, auditDetails]);

  // Extract unique sectors
  const sectors = useMemo(() => {
    const list = Array.from(new Set(mergedHoldings.map((h) => h.sector)));
    return ["ALL", ...list];
  }, [mergedHoldings]);

  // Filter & Sort Holdings
  const filteredHoldings = useMemo(() => {
    return mergedHoldings
      .filter((h) => {
        const matchesQuery =
          h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.company_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = selectedSector === "ALL" || h.sector === selectedSector;
        return matchesQuery && matchesSector;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string") {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [mergedHoldings, searchQuery, selectedSector, sortField, sortAsc]);

  const toggleSort = (field: "ticker" | "invested" | "weight_percentage") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleDelete = async (id: string, ticker: string) => {
    if (confirm(`Are you sure you want to remove ${ticker} from your portfolio?`)) {
      setDeletingId(id);
      try {
        await onDeleteHolding(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getVibeBadge = (vibe: string) => {
    switch (vibe) {
      case "Smooth Ride":
        return <Badge variant="success" className="bg-emerald-950/80 text-emerald-300 border-emerald-500/30">Smooth</Badge>;
      case "Moderate Bumps":
        return <Badge variant="info" className="bg-blue-950/80 text-blue-300 border-blue-500/30">Moderate</Badge>;
      case "Rollercoaster":
        return <Badge variant="warning" className="bg-amber-950/80 text-amber-300 border-amber-500/30">Bumpy</Badge>;
      case "Wild Ride":
        return <Badge variant="destructive" className="bg-rose-950/80 text-rose-300 border-rose-500/30">Wild</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-800 text-slate-300">{vibe}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-slate-800 bg-slate-900/80 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <Skeleton className="h-6 w-40 bg-slate-800" />
          <Skeleton className="h-9 w-28 bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-800/60" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="obsidian-glass-card">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-extrabold text-white flex items-center space-x-2">
              <span>Portfolio Asset Positions</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-mono">
                {holdings.length}
              </span>
            </CardTitle>
            <p className="text-xs text-slate-400">
              Real-time positions breakdown, average costs, and risk vibes
            </p>
          </div>
        </div>

        <Button
          onClick={onOpenAddModal}
          variant="gradient"
          size="sm"
          className="shadow-lg font-bold"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Asset Position
        </Button>
      </CardHeader>

      {/* Filter & Search Toolbar */}
      {holdings.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-slate-800/60 bg-slate-950/40">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search position or ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Sector Pill Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {sectors.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition ${
                  selectedSector === sec
                    ? "bg-amber-600/80 text-white shadow-sm"
                    : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/60 text-amber-400 mb-3 border border-amber-500/30 shadow-lg">
              <Layers className="h-7 w-7" />
            </div>
            <h4 className="text-base font-bold text-white">
              No holdings in this portfolio yet
            </h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">
              Add your stock tickers (e.g. AAPL, NVDA, TSLA, SPY) to enable instant AI plain-English risk diagnostics.
            </p>
            <Button
              onClick={onOpenAddModal}
              variant="outline"
              size="sm"
              className="mt-5 border-amber-500/40 text-amber-400 hover:bg-amber-950/60 font-semibold"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Your First Asset Position
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-950/60">
              <TableRow className="border-b border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs uppercase font-bold">
                  <button onClick={() => toggleSort("ticker")} className="flex items-center space-x-1 hover:text-white">
                    <span>Asset / Sector</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right text-slate-400 text-xs uppercase font-bold">Shares</TableHead>
                <TableHead className="text-right text-slate-400 text-xs uppercase font-bold">Avg Buy Price</TableHead>
                <TableHead className="text-right text-slate-400 text-xs uppercase font-bold">
                  <button onClick={() => toggleSort("invested")} className="flex items-center space-x-1 ml-auto hover:text-white">
                    <span>Invested Capital</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-center text-slate-400 text-xs uppercase font-bold">
                  <button onClick={() => toggleSort("weight_percentage")} className="flex items-center space-x-1 mx-auto hover:text-white">
                    <span>Weight</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-center text-slate-400 text-xs uppercase font-bold">Volatility Vibe</TableHead>
                <TableHead className="text-right text-slate-400 text-xs uppercase font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHoldings.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-800/60 transition-colors hover:bg-slate-850/60">
                  <TableCell className="py-3.5">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-white text-sm tracking-tight font-mono">
                          {item.ticker}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-medium border border-slate-700/50">
                          {item.sector}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 truncate max-w-[160px] mt-0.5">
                        {item.company_name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right font-medium text-slate-200 tabular-nums">
                    {item.shares.toLocaleString()}
                  </TableCell>

                  <TableCell className="text-right text-slate-300 tabular-nums font-mono">
                    {formatCurrency(item.average_buy_price)}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    <span className="font-bold text-white font-mono block">
                      {formatCurrency(item.invested)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatCurrency(item.current_value)} val
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    <span className="inline-block rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-bold text-amber-400 font-mono border border-slate-700/50">
                      {item.weight_percentage > 0 ? `${item.weight_percentage}%` : '—'}
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    {getVibeBadge(item.risk_vibe)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id, item.ticker)}
                      className="h-8 w-8 text-slate-500 hover:bg-rose-950/60 hover:text-rose-400 transition"
                      title="Remove Holding"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

