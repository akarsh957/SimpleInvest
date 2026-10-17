"use client";

import React, { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { AuthShell } from "@/src/components/auth/AuthShell";
import { signup } from "@/actions/auth";

export default function SignupPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await signup(formData);

    if (res && res.error) {
      setErrorMessage(res.error);
      setIsLoading(false);
    } else if (res?.message) {
      setSuccessMessage(res.message);
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      mode="signup"
      eyebrow="PAPER TRADING · PORTFOLIO INTELLIGENCE"
      title="Practice investing with a sharper perspective."
      description="Create your account to explore markets, build a simulated portfolio, and learn from AI-assisted analysis—without placing real trades."
      footerPrompt="Already have an account?"
      footerLink="Sign in"
      footerHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="full_name" className="block text-[11px] font-medium text-[#A0A8B8]">
            Full name
          </label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="Jane Doe"
            required
            autoComplete="name"
            className="h-10 rounded-lg border-[#303541] bg-[#14171D] px-3.5 text-sm font-sans placeholder:text-[#5A6070] focus:border-[#00D09C] focus:ring-2 focus:ring-[#00D09C]/10"
          />
        </div>

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
            placeholder="Create a password"
            required
            autoComplete="new-password"
            className="h-10 rounded-lg border-[#303541] bg-[#14171D] px-3.5 text-sm font-sans placeholder:text-[#5A6070] focus:border-[#00D09C] focus:ring-2 focus:ring-[#00D09C]/10"
          />
          <p className="text-[10px] leading-4 text-[#5A6070]">Use a strong password you don’t use elsewhere.</p>
        </div>

        {errorMessage && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-[#EB5B3C]/25 bg-[#EB5B3C]/10 p-3 text-xs leading-5 text-[#F28A72]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div role="status" className="flex items-start gap-2.5 rounded-lg border border-[#00D09C]/25 bg-[#00D09C]/10 p-3 text-xs leading-5 text-[#6FE0BE]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-[#00D09C] text-sm font-semibold text-[#0B0E11] shadow-lg shadow-[#00D09C]/10 hover:bg-[#00B88A] focus-visible:ring-[#00D09C]"
        >
          {isLoading ? (
            <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
          ) : (
            <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
        <p className="text-center text-[10px] leading-4 text-[#5A6070]">
          By continuing, you agree that this account is for simulated investing only.
        </p>
      </form>
    </AuthShell>
  );
}
