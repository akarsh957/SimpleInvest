"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { login } from "@/actions/auth";

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await login(formData);

    if (res && res.error) {
      setErrorMessage(res.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-zinc-100 font-sans">
      {/* Left Column: Minimal Terminal Identity */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-12 bg-[#0f0f12] border-r border-zinc-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-100">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-100">
            SimpleInvest
          </span>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            FINANCIAL INTELLIGENCE TERMINAL
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 leading-tight">
            Institutional portfolio analytics and forward trajectory forecasting.
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            High-density financial terminal engineered for real-time portfolio diagnostics, factor modeling, and multi-asset position management.
          </p>

          <div className="border border-zinc-800/80 rounded divide-y divide-zinc-800/80 font-mono text-xs bg-zinc-950/60 mt-6">
            <div className="px-3 py-2 text-zinc-400 flex justify-between">
              <span>REAL-TIME MARKETS</span>
              <span className="text-zinc-200">NYSE • NASDAQ • NSE</span>
            </div>
            <div className="px-3 py-2 text-zinc-400 flex justify-between">
              <span>EXECUTION ENGINE</span>
              <span className="text-zinc-200">PAPER TRADING SIMULATOR</span>
            </div>
            <div className="px-3 py-2 text-zinc-400 flex justify-between">
              <span>SECURITY ARCHITECTURE</span>
              <span className="text-zinc-200">ISOLATED RLS DATA POLICIES</span>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          SYSTEM ACTIVE • SESSION PROTOCOL SECURE
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-zinc-100">
              Terminal Authentication
            </h1>
            <p className="text-xs text-zinc-500 font-mono">
              ENTER CREDENTIALS TO ACCESS PORTFOLIO BOOK
            </p>
          </div>

          <Card className="border border-zinc-800/80 bg-[#0f0f12]">
            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    Email Address
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="trader@simpleinvest.ai"
                    required
                    autoComplete="email"
                    className="font-mono text-xs h-8"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    Password
                  </label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="font-mono text-xs h-8"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-center space-x-2 rounded bg-rose-500/10 p-2.5 text-xs text-rose-400 border border-rose-500/20 font-mono">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-8 text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-white"
                >
                  {isLoading ? "Authenticating..." : "Sign In to Terminal"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center font-mono text-xs text-zinc-500">
            No terminal account?{" "}
            <Link
              href="/signup"
              className="text-zinc-200 hover:text-white font-medium underline-offset-4 hover:underline"
            >
              Initialize Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
