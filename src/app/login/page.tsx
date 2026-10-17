"use client";

import React, { useState } from "react";
import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { AuthShell } from "@/src/components/auth/AuthShell";
import { login } from "@/actions/auth";

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <AuthShell
      mode="login"
      eyebrow="FINANCIAL INTELLIGENCE TERMINAL"
      title="A clearer view of your investments."
      description="Track your paper portfolio, explore market signals, and turn complex financial data into a more understandable picture."
      footerPrompt="New to SimpleInvest?"
      footerLink="Create an account"
      footerHref="/signup"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[11px] font-medium text-[#A0A8B8]">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="h-10 rounded-lg border-[#303541] bg-[#14171D] px-3.5 text-sm font-sans placeholder:text-[#5A6070] focus:border-[#00D09C] focus:ring-2 focus:ring-[#00D09C]/10"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-[11px] font-medium text-[#A0A8B8]">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            className="h-10 rounded-lg border-[#303541] bg-[#14171D] px-3.5 text-sm font-sans placeholder:text-[#5A6070] focus:border-[#00D09C] focus:ring-2 focus:ring-[#00D09C]/10"
          />
        </div>

        {errorMessage && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-[#EB5B3C]/25 bg-[#EB5B3C]/10 p-3 text-xs leading-5 text-[#F28A72]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-[#00D09C] text-sm font-semibold text-[#0B0E11] shadow-lg shadow-[#00D09C]/10 hover:bg-[#00B88A] focus-visible:ring-[#00D09C]"
        >
          {isLoading ? (
            <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
          ) : (
            <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
