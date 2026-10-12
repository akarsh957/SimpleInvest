"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/src/lib/utils";

interface MarketScenariosProps {
  currentValue: number;
}

type ScenarioKey = "base" | "bull" | "bear" | "inflation" | "ai_boom";

interface Scenario {
  id: ScenarioKey;
  label: string;
  impactPct: number;
  description: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "base",
    label: "Base Case",
    impactPct: 5.0,
    description: "Steady economic output with baseline corporate earnings trajectory.",
  },
  {
    id: "bull",
    label: "Bull Rally",
    impactPct: 18.0,
    description: "Broad risk-on expansion, rate reductions, and expanding multiples.",
  },
  {
    id: "bear",
    label: "Bear Correction",
    impactPct: -15.0,
    description: "Macro liquidity tightening and compression in corporate margins.",
  },
  {
    id: "inflation",
    label: "Rate Shock",
    impactPct: -8.0,
    description: "Persistent inflation prints prompting elevated terminal policy rates.",
  },
  {
    id: "ai_boom",
    label: "Tech Supercycle",
    impactPct: 25.0,
    description: "Accelerated capital allocation into enterprise compute and automation.",
  },
];

export function MarketScenarios({ currentValue }: MarketScenariosProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioKey>("base");

  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];
  const delta = currentValue * (scenario.impactPct / 100);
  const projectedValue = currentValue + delta;
  const isPositive = delta >= 0;

  return (
    <div className="border border-zinc-800/80 bg-[#0f0f12] rounded-md p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            MACRO STRESS TEST
          </span>
          <span className="text-zinc-600 font-mono text-xs">•</span>
          <span className="text-xs text-zinc-500 font-mono">SCENARIO SIMULATION</span>
        </div>
        <span className="font-mono text-xs text-zinc-500">
          DELTA: {isPositive ? "+" : ""}{scenario.impactPct.toFixed(1)}%
        </span>
      </div>

      {/* Compact Segmented Bar at the top of the panel */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800/80 rounded overflow-x-auto">
        {SCENARIOS.map((s) => {
          const isActive = s.id === activeScenarioId;
          return (
            <button
              key={s.id}
              onClick={() => setActiveScenarioId(s.id)}
              className={`flex-1 min-w-[90px] py-1.5 px-2 rounded text-xs font-mono transition-colors text-center whitespace-nowrap ${
                isActive
                  ? "bg-zinc-800 text-zinc-100 font-semibold shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
        {scenario.description}
      </p>

      {/* Clean 2-Column Comparison Row */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800/80 font-mono text-xs">
        <div className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            CURRENT BOOK VALUE
          </span>
          <div className="text-lg font-semibold text-zinc-200 tabular-nums">
            {formatCurrency(currentValue)}
          </div>
          <span className="text-[10px] text-zinc-600">BASELINE</span>
        </div>

        <div className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            PROJECTED SIMULATION
          </span>
          <div className={`text-lg font-semibold tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCurrency(projectedValue)}
          </div>
          <div className="flex items-center space-x-1 text-[11px] tabular-nums">
            <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
              {isPositive ? "+" : ""}{formatCurrency(delta)}
            </span>
            <span className="text-zinc-500">
              ({isPositive ? "+" : ""}{scenario.impactPct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
