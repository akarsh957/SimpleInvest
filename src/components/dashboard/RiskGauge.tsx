"use client";

import React from "react";
import { ShieldCheck, Zap, AlertTriangle, Flame, Info, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { RiskVibeConfig } from "@/src/types/portfolio";

interface RiskGaugeProps {
  riskVibe?: string;
  diversificationScore?: number;
  isLoading?: boolean;
}

const RISK_CONFIGS: Record<string, RiskVibeConfig> = {
  "Smooth Ride": {
    label: "Smooth Ride",
    range: "Defensive Low Volatility (Beta < 0.8)",
    score: 22,
    color: "bg-emerald-500",
    badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30",
    borderColor: "border-emerald-500",
    description: "Low-volatility defensive holdings. Stock prices move gently and insulate your portfolio during market corrections.",
    metaphor: "🚗 Cruising smoothly in a luxury sedan on a calm highway.",
  },
  "Moderate Bumps": {
    label: "Moderate Bumps",
    range: "Balanced Market Index (Beta 0.8 - 1.25)",
    score: 52,
    color: "bg-blue-500",
    badgeBg: "bg-blue-950/80 text-blue-300 border-blue-500/30",
    borderColor: "border-blue-500",
    description: "Tracks standard stock market movements closely. Offers healthy long-term growth with expected daily swings.",
    metaphor: "🚘 Steady driving on an open highway with minor traffic.",
  },
  "Rollercoaster": {
    label: "Rollercoaster",
    range: "High Growth / High Beta (Beta > 1.25)",
    score: 78,
    color: "bg-amber-500",
    badgeBg: "bg-amber-950/80 text-amber-300 border-amber-500/30",
    borderColor: "border-amber-500",
    description: "Heavy concentration in high-beta tech or growth equities. Surges in bull runs, experiences steep drawdowns in pullbacks.",
    metaphor: "🎢 Thrilling rollercoaster with steep loops and fast turns.",
  },
  "Wild Ride": {
    label: "Wild Ride",
    range: "Speculative / High Risk (Beta > 1.8)",
    score: 95,
    color: "bg-rose-500",
    badgeBg: "bg-rose-950/80 text-rose-300 border-rose-500/30",
    borderColor: "border-rose-500",
    description: "Highly speculative positions. Rapid double-digit swings are frequent. High upside with substantial drawdowns.",
    metaphor: "🚀 High-velocity rocket with intense acceleration.",
  },
};

export function RiskGauge({ riskVibe = "Moderate Bumps", diversificationScore = 70, isLoading }: RiskGaugeProps) {
  const matchedConfig = Object.keys(RISK_CONFIGS).find((key) =>
    riskVibe.toLowerCase().includes(key.toLowerCase())
  );

  const config = matchedConfig ? RISK_CONFIGS[matchedConfig] : RISK_CONFIGS["Moderate Bumps"];

  const getRiskIcon = () => {
    switch (config.label) {
      case "Smooth Ride":
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case "Moderate Bumps":
        return <Zap className="h-4 w-4 text-blue-400" />;
      case "Rollercoaster":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "Wild Ride":
        return <Flame className="h-4 w-4 text-rose-400" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-slate-800 bg-slate-900/80 shadow-xl animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 w-40 rounded bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full rounded-lg bg-slate-800" />
          <div className="h-16 w-full rounded-xl bg-slate-800/60" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-extrabold text-white">
              Volatility Diagnostics
            </CardTitle>
            <p className="text-[11px] text-slate-400">Market Beta & Volatility Rating</p>
          </div>
        </div>

        <Badge className={`border px-3 py-1 text-xs font-bold rounded-xl shadow-sm ${config.badgeBg}`}>
          {getRiskIcon()}
          <span className="ml-1.5">{riskVibe || config.label}</span>
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Custom Visual Meter / Gauge */}
        <div className="relative pt-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest font-mono">
            <span className="text-emerald-400">Smooth (Low)</span>
            <span className="text-blue-400">Moderate (Balanced)</span>
            <span className="text-amber-400">Bumpy (High)</span>
            <span className="text-rose-400">Wild (Extreme)</span>
          </div>

          {/* Bar track */}
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-950 flex border border-slate-800 p-0.5">
            <div className="w-1/4 rounded-l-full bg-gradient-to-r from-emerald-500/80 to-emerald-400/80" />
            <div className="w-1/4 bg-gradient-to-r from-blue-500/80 to-blue-400/80" />
            <div className="w-1/4 bg-gradient-to-r from-amber-500/80 to-amber-400/80" />
            <div className="w-1/4 rounded-r-full bg-gradient-to-r from-rose-500/80 to-rose-400/80" />
          </div>

          {/* Dynamic Pin Indicator */}
          <div
            className="absolute top-6 -ml-3.5 flex flex-col items-center transition-all duration-700 ease-out"
            style={{ left: `${config.score}%` }}
          >
            <div className={`h-5 w-5 rounded-full border-2 border-white shadow-xl shadow-emerald-950/50 ring-4 ring-slate-950 ${config.color}`} />
          </div>
        </div>

        {/* Metaphor & Range Explanation Box */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              {config.range}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              Rating Score: {config.score}/100
            </span>
          </div>
          <p className="text-xs font-medium text-slate-300">
            <span className="font-bold text-white">Vibe Metaphor: </span>
            {config.metaphor}
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {config.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

