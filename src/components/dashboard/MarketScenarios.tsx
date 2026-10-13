"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/src/lib/utils";

interface MarketScenariosProps {
  currentValue: number;
}

type ScenarioKey = "correction" | "bull" | "tech" | "rate_cut" | "custom";

interface Scenario {
  id: ScenarioKey;
  label: string;
  impactPct: number;
  description: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "correction",
    label: "Market Correction −10%",
    impactPct: -10.0,
    description: "Broad equity selloff driven by valuation compression and risk-off positioning across global markets.",
  },
  {
    id: "tech",
    label: "Tech Pullback −15%",
    impactPct: -15.0,
    description: "Sector rotation out of high-multiple technology and growth stocks amid earnings deceleration concerns.",
  },
  {
    id: "rate_cut",
    label: "Rate Cut Rally +12%",
    impactPct: 12.0,
    description: "Central bank pivot towards accommodative policy drives multiple expansion and broad market re-rating.",
  },
  {
    id: "bull",
    label: "Bull Supercycle +25%",
    impactPct: 25.0,
    description: "Accelerated capital allocation into equities on strong macro tailwinds and robust earnings delivery.",
  },
];

export function MarketScenarios({ currentValue }: MarketScenariosProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioKey>("correction");
  const [customSlider, setCustomSlider] = useState(0);

  const isCustom = activeScenarioId === "custom";
  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];
  const impactPct = isCustom ? customSlider : scenario.impactPct;
  const delta = currentValue * (impactPct / 100);
  const projectedValue = currentValue + delta;
  const isPositive = delta >= 0;

  return (
    <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Macro Stress Test</h3>
          <p className="text-[11px] text-[#5A6070] mt-0.5">Scenario Simulation</p>
        </div>
        <span className={`text-sm font-bold tabular-nums font-mono ${isPositive ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
          {isPositive ? "+" : ""}{impactPct.toFixed(1)}%
        </span>
      </div>

      {/* Scenario Pills */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveScenarioId(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeScenarioId === s.id
                ? s.impactPct >= 0
                  ? "bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/20"
                  : "bg-[#EB5B3C]/10 text-[#EB5B3C] border border-[#EB5B3C]/20"
                : "bg-[#14171D] text-[#5A6070] border border-[#262A34] hover:text-[#A0A8B8] hover:border-[#383E4C]"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setActiveScenarioId("custom")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isCustom
              ? "bg-[#5367FF]/10 text-[#5367FF] border border-[#5367FF]/20"
              : "bg-[#14171D] text-[#5A6070] border border-[#262A34] hover:text-[#A0A8B8] hover:border-[#383E4C]"
          }`}
        >
          Custom Slider
        </button>
      </div>

      {/* Custom Slider */}
      {isCustom && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-[#5A6070]">
            <span>−50%</span>
            <span className={`font-semibold ${customSlider >= 0 ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
              {customSlider >= 0 ? "+" : ""}{customSlider}%
            </span>
            <span>+50%</span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            value={customSlider}
            onChange={(e) => setCustomSlider(Number(e.target.value))}
            className="w-full h-1.5 bg-[#262A34] rounded-full appearance-none cursor-pointer accent-[#5367FF]"
          />
        </div>
      )}

      {/* Scenario Description */}
      {!isCustom && (
        <p className="text-xs text-[#5A6070] leading-relaxed">
          {scenario.description}
        </p>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#262A34]">
        <div className="p-3 bg-[#14171D] rounded-lg">
          <p className="text-[10px] uppercase tracking-wider text-[#5A6070] mb-1">Current Value</p>
          <p className="text-base font-bold text-white tabular-nums font-mono">
            {formatCurrency(currentValue)}
          </p>
          <p className="text-[10px] text-[#373D4A] mt-0.5">Baseline</p>
        </div>

        <div className="p-3 bg-[#14171D] rounded-lg">
          <p className="text-[10px] uppercase tracking-wider text-[#5A6070] mb-1">Projected Value</p>
          <p className={`text-base font-bold tabular-nums font-mono ${isPositive ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
            {formatCurrency(projectedValue)}
          </p>
          <p className={`text-[11px] tabular-nums font-mono mt-0.5 ${isPositive ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
            {isPositive ? "+" : ""}{formatCurrency(delta)}
          </p>
        </div>
      </div>
    </div>
  );
}
