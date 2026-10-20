"use client";

import React, { useState, useMemo } from "react";
import { Trash2, Plus, Search, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Holding, HoldingAuditDetail } from "@/src/types/portfolio";
import { formatCurrency } from "@/src/lib/utils";
import { TradeModal } from "@/src/components/trading/TradeModal";

interface HoldingsTableProps {
  holdings: Holding[];
  auditDetails?: HoldingAuditDetail[];
  isLoading?: boolean;
  onDeleteHolding: (id: string) => Promise<void>;
  onOpenAddModal: () => void;
  onTradeSuccess?: () => void;
}

export function HoldingsTable({
  holdings,
  auditDetails = [],
  isLoading,
  onDeleteHolding,
  onOpenAddModal,
  onTradeSuccess,
}: HoldingsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<"ALL" | "US" | "INDIA">("ALL");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [sortField, setSortField] = useState<"ticker" | "invested" | "weight_percentage">("invested");
  const [sortAsc, setSortAsc] = useState(false);
  const [tradeTarget, setTradeTarget] = useState<{
    ticker: string;
    price: number;
    side: "BUY" | "SELL";
  } | null>(null);

  const mergedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const detail = auditDetails.find(
        (d) => d.ticker.toUpperCase() === h.ticker.toUpperCase()
      );
      const invested = h.shares * h.average_buy_price;
      const currentValue = detail?.current_value || invested;
      const gainLoss = currentValue - invested;
      const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;
      const currentPrice = h.shares > 0 ? currentValue / h.shares : h.average_buy_price;

      return {
        ...h,
        company_name: detail?.company_name || h.ticker.replace(".NS", "").replace(".BO", ""),
        sector: detail?.sector || "Technology",
        current_value: currentValue,
        current_price: currentPrice,
        gainLoss,
        gainLossPercent,
        weight_percentage: detail?.weight_percentage || 0,
        risk_vibe: detail?.risk_vibe || "Moderate",
        invested,
      };
    });
  }, [holdings, auditDetails]);

  const sectors = useMemo(() => {
    const list = Array.from(new Set(mergedHoldings.map((h) => h.sector)));
    return ["ALL", ...list];
  }, [mergedHoldings]);

  const filteredHoldings = useMemo(() => {
    return mergedHoldings
      .filter((h) => {
        const matchesQuery =
          h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.company_name.toLowerCase().includes(searchQuery.toLowerCase());
        const isIndianEquity = /\.(NS|BO)$/i.test(h.ticker);
        const matchesMarket =
          selectedMarket === "ALL" ||
          (selectedMarket === "INDIA" && isIndianEquity) ||
          (selectedMarket === "US" && !isIndianEquity);
        const matchesSector = selectedSector === "ALL" || h.sector === selectedSector;
        return matchesQuery && matchesMarket && matchesSector;
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
  }, [mergedHoldings, searchQuery, selectedMarket, selectedSector, sortField, sortAsc]);

  const toggleSort = (field: "ticker" | "invested" | "weight_percentage") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const handleDelete = async (id: string, ticker: string) => {
    if (confirm(`Remove ${ticker} from portfolio?`)) {
      setDeletingId(id);
      try { await onDeleteHolding(id); }
      finally { setDeletingId(null); }
    }
  };

  const renderRiskBadge = (vibe: string) => {
    const v = vibe.toLowerCase();
    if (v.includes("smooth") || v.includes("low")) {
      return <span className="inline-flex items-center space-x-1 text-[11px]"><span className="h-1.5 w-1.5 rounded-full bg-[#00D09C]" /><span className="text-[#A0A8B8]">Low</span></span>;
    }
    if (v.includes("moderate") || v.includes("balanced")) {
      return <span className="inline-flex items-center space-x-1 text-[11px]"><span className="h-1.5 w-1.5 rounded-full bg-[#5367FF]" /><span className="text-[#A0A8B8]">Moderate</span></span>;
    }
    return <span className="inline-flex items-center space-x-1 text-[11px]"><span className="h-1.5 w-1.5 rounded-full bg-[#EB5B3C]" /><span className="text-[#A0A8B8]">High</span></span>;
  };

  if (isLoading) {
    return (
      <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-3">
        <Skeleton className="h-6 w-40 bg-[#262A34]" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full bg-[#20242D] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262A34]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-sm font-semibold text-white">Holdings</span>
            <span className="text-[10px] font-mono text-[#5A6070] uppercase tracking-wide">
              {holdings.length} positions
            </span>

            {/* Category pills */}
            <div className="flex items-center gap-1">
              {([
                { label: "ALL", value: "ALL" },
                { label: "US Equities", value: "US" },
                { label: "Indian Equities", value: "INDIA" },
              ] as const).map((cat) => {
                const active = selectedMarket === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedMarket(cat.value)}
                    className={`h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors ${
                      active
                        ? "bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/20"
                        : "text-[#5A6070] hover:text-[#A0A8B8] hover:bg-[#20242D]"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5A6070]" />
              <input
                type="text"
                placeholder="Filter holdings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-40 rounded-lg bg-[#14171D] border border-[#262A34] pl-8 pr-3 text-xs text-[#A0A8B8] placeholder:text-[#5A6070] focus:outline-none focus:border-[#383E4C]"
              />
            </div>

            {/* Sector filter (mobile fallback) */}
            {sectors.length > 2 && (
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="h-8 rounded-lg bg-[#14171D] border border-[#262A34] px-2 text-xs text-[#A0A8B8] focus:outline-none focus:border-[#383E4C] cursor-pointer"
              >
                {sectors.map((sec) => (
                  <option key={sec} value={sec} className="bg-[#1A1D24]">{sec}</option>
                ))}
              </select>
            )}

            <button
              onClick={onOpenAddModal}
              className="h-8 px-3 rounded-lg bg-[#00D09C] text-[#0B0E11] text-xs font-semibold flex items-center space-x-1 hover:bg-[#00B88A] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {holdings.length === 0 ? (
          <div className="py-16 text-center text-[#5A6070] text-xs font-mono">
            No holdings yet. Add your first position to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#262A34] bg-[#14171D]/50 hover:bg-transparent">
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070] py-3 pl-5">
                    <button onClick={() => toggleSort("ticker")} className="flex items-center space-x-1 hover:text-[#A0A8B8]">
                      <span>Company</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070] text-right">Shares & Avg</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070] text-right">Market Price</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070] text-right">
                    <button onClick={() => toggleSort("invested")} className="flex items-center space-x-1 ml-auto hover:text-[#A0A8B8]">
                      <span>Current Value & P&L</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070] text-right">
                    <button onClick={() => toggleSort("weight_percentage")} className="flex items-center space-x-1 ml-auto hover:text-[#A0A8B8]">
                      <span>Allocation</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070] text-center">Risk</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#5A6070] text-right pr-5">Trade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#262A34]/60">
                {filteredHoldings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-[#5A6070] text-xs">
                      No positions match these filters.
                    </TableCell>
                  </TableRow>
                ) : filteredHoldings.map((item) => {
                  const isPos = item.gainLoss >= 0;
                  const initial = item.ticker.charAt(0).toUpperCase();
                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-[#20242D] transition-colors group h-14"
                    >
                      {/* Company */}
                      <TableCell className="py-3 pl-5">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-[#5367FF]/10 border border-[#5367FF]/20 text-[#5367FF] text-xs font-bold flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-white">{item.company_name}</span>
                            <span className="text-[10px] text-[#5A6070] font-mono">{item.ticker} · {item.sector}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Shares & Avg */}
                      <TableCell className="text-right font-mono text-xs">
                        <div className="text-[#A0A8B8] tabular-nums">{item.shares.toLocaleString()} sh</div>
                        <div className="text-[#5A6070] text-[10px] tabular-nums">@ {formatCurrency(item.average_buy_price)}</div>
                      </TableCell>

                      {/* LTP */}
                      <TableCell className="text-right font-mono tabular-nums text-white text-sm font-semibold">
                        {formatCurrency(item.current_price)}
                      </TableCell>

                      {/* Current Value & P&L */}
                      <TableCell className="text-right font-mono text-xs">
                        <div className="text-white font-semibold tabular-nums">{formatCurrency(item.current_value)}</div>
                        <div className={`text-[10px] tabular-nums ${isPos ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
                          {isPos ? "+" : ""}{item.gainLossPercent.toFixed(1)}%
                          <span className="ml-1 text-[#5A6070]">({formatCurrency(Math.abs(item.gainLoss))})</span>
                        </div>
                      </TableCell>

                      {/* Allocation */}
                      <TableCell className="text-right font-mono text-xs">
                        <div className="text-[#A0A8B8] tabular-nums mb-1">
                          {item.weight_percentage > 0 ? `${item.weight_percentage}%` : "—"}
                        </div>
                        {item.weight_percentage > 0 && (
                          <div className="w-16 h-1 bg-[#262A34] rounded-full ml-auto overflow-hidden">
                            <div
                              className="h-full bg-[#5367FF] rounded-full transition-all"
                              style={{ width: `${Math.min(item.weight_percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </TableCell>

                      {/* Risk */}
                      <TableCell className="text-center font-mono">
                        {renderRiskBadge(item.risk_vibe)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end space-x-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setTradeTarget({ ticker: item.ticker, price: item.current_price, side: "BUY" })}
                            className="h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/20 hover:bg-[#00D09C]/20 transition-colors"
                          >
                            Buy
                          </button>
                          <button
                            onClick={() => setTradeTarget({ ticker: item.ticker, price: item.current_price, side: "SELL" })}
                            className="h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-[#EB5B3C]/10 text-[#EB5B3C] border border-[#EB5B3C]/20 hover:bg-[#EB5B3C]/20 transition-colors"
                          >
                            Sell
                          </button>
                          <button
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id, item.ticker)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-[#373D4A] hover:text-[#EB5B3C] hover:bg-[#EB5B3C]/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {tradeTarget && (
        <TradeModal
          isOpen={!!tradeTarget}
          onClose={() => setTradeTarget(null)}
          ticker={tradeTarget.ticker}
          currentPrice={tradeTarget.price}
          initialSide={tradeTarget.side}
          onTradeSuccess={() => {
            if (onTradeSuccess) onTradeSuccess();
            setTradeTarget(null);
          }}
        />
      )}
    </>
  );
}
