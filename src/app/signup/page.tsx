"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { signup } from "@/actions/auth";

export default function SignupPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await signup(formData);

    if (res && res.error) {
      setErrorMessage(res.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-zinc-100 font-sans">
      {/* Left Column: Brand Identity */}
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
            WORKSPACE INITIALIZATION
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 leading-tight">
            Provision your dedicated financial analytics workspace.
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Instantly access live NYSE & NSE multi-asset portfolios, quantitative factor screening, and AI plain-English risk diagnostics.
          </p>

          <div className="border border-zinc-800/80 rounded divide-y divide-zinc-800/80 font-mono text-xs bg-zinc-950/60 mt-6">
            <div className="px-3 py-2 text-zinc-400 flex justify-between">
              <span>INITIAL PAPER CAPITAL</span>
              <span className="text-zinc-200">$100,000.00 USD</span>
            </div>
            <div className="px-3 py-2 text-zinc-400 flex justify-between">
              <span>REAL-TIME PIPELINE</span>
              <span className="text-zinc-200">ACTIVE TELEMETRY</span>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          SYSTEM ACTIVE • ENCRYPTED REGISTRATION
        </div>
      </div>

      {/* Right Column: Sign Up Form */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-zinc-100">
              Initialize Account
            </h1>
            <p className="text-xs text-zinc-500 font-mono">
              CREATE CREDENTIALS FOR YOUR TERMINAL DESK
            </p>
          </div>

          <Card className="border border-zinc-800/80 bg-[#0f0f12]">
            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    Full Name
                  </label>
                  <Input
                    name="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    required
                    className="font-mono text-xs h-8"
                  />
                </div>

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
                    autoComplete="new-password"
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
                  {isLoading ? "Provisioning..." : "Create Terminal Account"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center font-mono text-xs text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-zinc-200 hover:text-white font-medium underline-offset-4 hover:underline"
            >
              Access Terminal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
