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
import { Button } from "@/src/components/ui/button";
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
  userId?: string;
  onTradeSuccess?: () => void;
}

export function HoldingsTable({
  holdings,
  auditDetails = [],
  isLoading,
  onDeleteHolding,
  onOpenAddModal,
  userId,
  onTradeSuccess,
}: HoldingsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [sortField, setSortField] = useState<"ticker" | "invested" | "weight_percentage">("invested");
  const [sortAsc, setSortAsc] = useState(false);

  // Trade modal state
  const [tradeTarget, setTradeTarget] = useState<{
    ticker: string;
    price: number;
    side: "BUY" | "SELL";
  } | null>(null);

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
    if (confirm(`Remove position ${ticker}?`)) {
      setDeletingId(id);
      try {
        await onDeleteHolding(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const renderVolatilityIndicator = (vibe: string) => {
    const v = vibe.toLowerCase();
    if (v.includes("smooth") || v.includes("low")) {
      return (
        <span className="font-mono text-xs text-zinc-300 inline-flex items-center gap-1.5">
          <span className="text-emerald-400 text-[10px]">●</span> Low
        </span>
      );
    }
    if (v.includes("moderate") || v.includes("steady") || v.includes("balanced")) {
      return (
        <span className="font-mono text-xs text-zinc-300 inline-flex items-center gap-1.5">
          <span className="text-zinc-400 text-[10px]">●</span> Moderate
        </span>
      );
    }
    return (
      <span className="font-mono text-xs text-zinc-300 inline-flex items-center gap-1.5">
        <span className="text-rose-400 text-[10px]">●</span> High
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-3">
        <Skeleton className="h-6 w-40 bg-zinc-800" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full bg-zinc-900 rounded" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              POSITIONS
            </span>
            <span className="text-zinc-600 font-mono text-xs">•</span>
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              {holdings.length} ASSETS
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-44 rounded bg-zinc-900 border border-zinc-800 pl-8 pr-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Sector filter */}
            {sectors.length > 2 && (
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="h-7 rounded bg-zinc-900 border border-zinc-800 px-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
              >
                {sectors.map((sec) => (
                  <option key={sec} value={sec} className="bg-zinc-950 text-zinc-200">
                    {sec}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onOpenAddModal}
              className="h-7 px-2.5 rounded bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {holdings.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs">
            NO OPEN POSITIONS IN ACTIVE BOOK
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-zinc-800/80 bg-zinc-950/40 hover:bg-transparent text-[11px] font-mono uppercase text-zinc-500">
                  <TableHead className="w-[200px] text-zinc-500">
                    <button
                      onClick={() => toggleSort("ticker")}
                      className="flex items-center space-x-1 hover:text-zinc-300"
                    >
                      <span>ASSET / SECTOR</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right text-zinc-500">SHARES</TableHead>
                  <TableHead className="text-right text-zinc-500">AVG COST</TableHead>
                  <TableHead className="text-right text-zinc-500">
                    <button
                      onClick={() => toggleSort("invested")}
                      className="flex items-center space-x-1 ml-auto hover:text-zinc-300"
                    >
                      <span>POSITION VALUE</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right text-zinc-500">
                    <button
                      onClick={() => toggleSort("weight_percentage")}
                      className="flex items-center space-x-1 ml-auto hover:text-zinc-300"
                    >
                      <span>WEIGHT</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center text-zinc-500">RISK</TableHead>
                  <TableHead className="text-right text-zinc-500 w-[140px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-zinc-800/50">
                {filteredHoldings.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-[#141418] transition-colors group h-12"
                  >
                    {/* Ticker & Name */}
                    <TableCell className="py-2.5">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-zinc-100">
                            {item.ticker}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            {item.sector}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                          {item.company_name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Shares */}
                    <TableCell className="text-right font-mono tabular-nums text-zinc-300 text-xs">
                      {item.shares.toLocaleString()}
                    </TableCell>

                    {/* Avg Cost */}
                    <TableCell className="text-right font-mono tabular-nums text-zinc-400 text-xs">
                      {formatCurrency(item.average_buy_price)}
                    </TableCell>

                    {/* Invested & Current Value */}
                    <TableCell className="text-right font-mono tabular-nums text-xs">
                      <span className="text-zinc-100 font-semibold block">
                        {formatCurrency(item.current_value)}
                      </span>
                      <span
                        className={`text-[10px] ${
                          item.gainLoss >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {item.gainLoss >= 0 ? "+" : ""}
                        {item.gainLossPercent.toFixed(1)}%
                      </span>
                    </TableCell>

                    {/* Weight: Clean tabular numbers */}
                    <TableCell className="text-right font-mono tabular-nums text-zinc-200 text-xs">
                      {item.weight_percentage > 0 ? `${item.weight_percentage}%` : "—"}
                    </TableCell>

                    {/* Volatility Indicator: Dot indicator */}
                    <TableCell className="text-center font-mono">
                      {renderVolatilityIndicator(item.risk_vibe)}
                    </TableCell>

                    {/* Actions: Direct low-profile Buy / Sell on hover + Delete */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setTradeTarget({
                              ticker: item.ticker,
                              price: item.current_price,
                              side: "BUY",
                            })
                          }
                          className="h-6 px-2 text-[10px] font-mono font-semibold rounded bg-zinc-800 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                          title={`Buy ${item.ticker}`}
                        >
                          BUY
                        </button>
                        <button
                          onClick={() =>
                            setTradeTarget({
                              ticker: item.ticker,
                              price: item.current_price,
                              side: "SELL",
                            })
                          }
                          className="h-6 px-2 text-[10px] font-mono font-semibold rounded bg-zinc-800 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                          title={`Sell ${item.ticker}`}
                        >
                          SELL
                        </button>
                        <button
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id, item.ticker)}
                          className="h-6 w-6 rounded flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                          title="Delete holding"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {tradeTarget && (
        <TradeModal
          isOpen={!!tradeTarget}
          onClose={() => setTradeTarget(null)}
          ticker={tradeTarget.ticker}
          currentPrice={tradeTarget.price}
          userId={userId}
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
