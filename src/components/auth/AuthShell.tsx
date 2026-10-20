import Link from "next/link";
import { Activity, ArrowUpRight, ShieldCheck, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  mode: "login" | "signup";
  eyebrow: string;
  title: string;
  description: string;
  footerPrompt: string;
  footerLink: string;
  footerHref: string;
  children: ReactNode;
}

const marketRows = [
  { ticker: "S&P 500", value: "5,842.20", change: "+0.64%" },
  { ticker: "NASDAQ", value: "18,485.10", change: "+1.12%" },
  { ticker: "NIFTY 50", value: "25,127.90", change: "+0.42%" },
];

export function AuthShell({
  mode,
  eyebrow,
  title,
  description,
  footerPrompt,
  footerLink,
  footerHref,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f4ef] text-[#20312d]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex h-[76px] items-center justify-between border-b border-[#e2e5de]">
          <Link href="/" className="group inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#173B3B] text-white">
              <TrendingUp className="h-4 w-4 stroke-[2.5]" />
            </span>
            <span className="text-base font-semibold tracking-tight text-[#20312d]">SimpleInvest</span>
          </Link>
          <div className="hidden items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#7c8981] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#246b55]" />
            Paper trading · practice only
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:py-16">
          <section className="mx-auto w-full max-w-2xl lg:mx-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[#e2e5de] bg-white px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#596a63]">
              <Activity className="h-3.5 w-3.5 text-[#246b55]" />
              {mode === "login" ? "Your portfolio, in focus" : "Build your investing practice"}
            </div>

            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#246b55]">
              {eyebrow}
            </p>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#20312d] sm:text-4xl lg:text-[48px]">
              {title}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#596a63] sm:text-[15px]">
              {description}
            </p>

            <div className="mt-10 max-w-lg overflow-hidden rounded-lg border border-[#e2e5de] bg-white">
              <div className="flex items-center justify-between border-b border-[#e2e5de] px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7c8981]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#246b55]" />
                  Market snapshot
                </div>
                <span className="text-[10px] font-medium text-[#7c8981]">Illustrative</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-[#e2e5de]">
                {marketRows.map((row) => (
                  <div className="min-w-0 px-3 py-3.5 sm:px-4" key={row.ticker}>
                    <p className="truncate text-[10px] text-[#7c8981]">{row.ticker}</p>
                    <p className="mt-1 truncate text-xs font-medium tabular-nums text-[#20312d] sm:text-sm">
                      {row.value}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-[#246b55]">{row.change}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 text-xs leading-5 text-[#7c8981]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#246b55]" />
              <p>Your account is private. Trades on SimpleInvest are simulated and do not place real orders.</p>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[440px] lg:mx-0">
            <div className="rounded-lg border border-[#e2e5de] bg-white p-5 shadow-[0_8px_28px_rgba(28,48,39,0.06)] sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7c8981]">
                    {mode === "login" ? "Returning investor" : "New investor"}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#20312d]">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                  <p className="mt-1.5 text-xs leading-5 text-[#596a63]">
                    {mode === "login" ? "Sign in to continue to your portfolio." : "Start exploring markets with a paper portfolio."}
                  </p>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#7c8981]" />
              </div>

              {children}

              <div className="mt-6 border-t border-[#e2e5de] pt-5 text-center text-xs text-[#7c8981]">
                {footerPrompt}{" "}
                <Link href={footerHref} className="font-medium text-[#20312d] underline decoration-[#cbd3ca] underline-offset-4 transition-colors hover:text-[#246b55] hover:decoration-[#246b55]">
                  {footerLink}
                </Link>
              </div>
            </div>
            <p className="mt-4 text-center text-[10px] text-[#a0aaa2]">
              SECURE SESSION · SUPABASE AUTH
            </p>
          </section>
        </div>

        <footer className="flex min-h-12 items-center justify-between border-t border-[#e2e5de] text-[10px] text-[#a0aaa2]">
          <span>© {new Date().getFullYear()} SIMPLEINVEST</span>
          <span className="hidden sm:inline">MARKET DATA MAY BE DELAYED</span>
        </footer>
      </div>
    </main>
  );
}
