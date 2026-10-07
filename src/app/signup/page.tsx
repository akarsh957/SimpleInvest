"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingUp, Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-[#080d1a] text-slate-100">
      {/* Left Column: Brand Hero Banner */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-3 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 shadow-lg text-white">
            <TrendingUp className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Simple<span className="text-emerald-400">Invest</span>
          </span>
          <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
            Platinum
          </span>
        </div>

        <div className="space-y-6 max-w-lg z-10">
          <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Institutional Wealth Platform</span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Start Your Plain-English Portfolio Workspace.
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Gain immediate access to risk diagnostics, market beta scores, sector entropy ratings, and AI wealth intelligence.
          </p>

          <div className="space-y-3 pt-2">
            {[
              "Instant portfolio risk vibe rating & volatility gauge",
              "Automated plain-English Groq LLM diagnostic reports",
              "Zero-cost enterprise equity & ETF position tracking",
            ].map((feature) => (
              <div key={feature} className="flex items-center space-x-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6 z-10">
          <span>© 2026 SimpleInvest Platform</span>
          <span>SOC2 Type II Certified</span>
        </div>
      </div>

      {/* Right Column: Sign Up Form */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Create Account
            </h1>
            <p className="text-xs text-slate-400">
              Set up your secure institutional wealth terminal in 30 seconds.
            </p>
          </div>

          <Card className="border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      name="full_name"
                      type="text"
                      placeholder="Jane Doe"
                      className="pl-10 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 font-medium"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      name="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-10 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 font-medium"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center space-x-2 rounded-xl bg-rose-950/60 p-3 text-xs text-rose-300 border border-rose-500/30">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full font-bold shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Workspace..." : "Create Account & Launch"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center p-4 border-t border-slate-800/80 bg-slate-950/40">
              <p className="text-xs text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-emerald-400 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </Card>

          <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Encrypted with Supabase Row-Level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}

