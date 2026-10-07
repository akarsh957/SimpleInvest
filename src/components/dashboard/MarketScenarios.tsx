"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { TrendingDown, TrendingUp, AlertTriangle, Zap, Activity, Shield } from "lucide-react";
import { formatCurrency } from "@/src/lib/utils";

interface MarketScenariosProps {
  currentValue: number;
}

type ScenarioType = "base" | "bull" | "bear" | "inflation" | "ai_boom";

const SCENARIOS = {
  base: {
    id: "base",
    title: "Base Case",
    icon: Activity,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    impact: 1.05,
    description: "Steady economic growth with average historical returns (+5% expected).",
  },
  bull: {
    id: "bull",
    title: "Bull Market Rally",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    impact: 1.18,
    description: "Strong corporate earnings and low interest rates drive broad market rally (+18% expected).",
  },
  bear: {
    id: "bear",
    title: "Bear Market Correction",
    icon: TrendingDown,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    impact: 0.85,
    description: "Economic recession leading to broader market sell-offs (-15% expected).",
  },
  inflation: {
    id: "inflation",
    title: "High Inflation Shock",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    impact: 0.92,
    description: "Persistent inflation causing central banks to hike rates aggressively (-8% expected).",
  },
  ai_boom: {
    id: "ai_boom",
    title: "Tech & AI Supercycle",
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    impact: 1.25,
    description: "Generative AI deployment accelerates, creating massive tech sector upside (+25% expected).",
  }
};

export function MarketScenarios({ currentValue }: MarketScenariosProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>("base");

  const scenario = SCENARIOS[activeScenario];
  const projectedValue = currentValue * scenario.impact;
  const difference = projectedValue - currentValue;
  const isPositive = difference >= 0;

  return (
    <Card className="border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-xl hover:border-slate-700 transition overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardHeader className="border-b border-white/[0.05] p-5 pb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-indigo-400" />
          <CardTitle className="text-base font-extrabold text-white">AI Stress Test & Scenarios</CardTitle>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Interactive simulation of macroeconomic events on your current portfolio value.
        </p>
      </CardHeader>

      <CardContent className="p-5 space-y-6 relative z-10">
        
        {/* Scenario Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {(Object.keys(SCENARIOS) as ScenarioType[]).map((key) => {
            const s = SCENARIOS[key];
            const isActive = activeScenario === key;
            const Icon = s.icon;
            
            return (
              <button
                key={key}
                onClick={() => setActiveScenario(key)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                  isActive 
                    ? `bg-slate-800 border-${s.color.split('-')[1]}-500/50 shadow-md transform scale-105` 
                    : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${isActive ? s.color : "text-slate-500"}`} />
                <span className={isActive ? "text-white" : ""}>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Projection Visualization Area */}
        <div className={`rounded-2xl p-5 border transition-all duration-500 ${scenario.bg}`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            
            <div className="space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <scenario.icon className={`h-4 w-4 ${scenario.color}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${scenario.color}`}>
                  {scenario.title} Projection
                </span>
              </div>
              <p className="text-sm text-slate-300">
                {scenario.description}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Projected Value
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScenario}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-end"
                >
                  <p className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${scenario.color}`}>
                    {formatCurrency(projectedValue)}
                  </p>
                  <div className={`flex items-center text-xs font-bold mt-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                    {isPositive ? "+" : ""}
                    {formatCurrency(difference)} 
                    <span className="ml-1 opacity-70">
                      ({isPositive ? "+" : ""}{((scenario.impact - 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
          </div>

          {/* Progress / Impact Bar */}
          <div className="mt-5 h-2 w-full rounded-full bg-slate-900/50 overflow-hidden border border-white/[0.05]">
            <motion.div
              initial={{ width: "50%", backgroundColor: "#3b82f6" }}
              animate={{ 
                width: `${Math.min(Math.max((scenario.impact - 0.7) / 0.6 * 100, 5), 100)}%`,
                backgroundColor: isPositive ? "#10b981" : "#f43f5e" 
              }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              className="h-full rounded-full"
            />
          </div>

        </div>
        
      </CardContent>
    </Card>
  );
}
