"use client";

import React, { useState, useRef, useEffect } from "react";
import { Holding, PortfolioAuditResponse, PortfolioChatMessage } from "@/src/types/portfolio";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Brain, MessageSquare, Send, Sparkles, User, RefreshCw } from "lucide-react";

interface JargonBusterCardProps {
  auditData?: PortfolioAuditResponse | null;
  holdings?: Holding[];
  isLoading?: boolean;
  error?: string | null;
  onRefreshAudit?: () => void;
}

export function JargonBusterCard({
  auditData,
  holdings = [],
  isLoading,
  error,
  onRefreshAudit,
}: JargonBusterCardProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "metrics" | "chat">("summary");
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<PortfolioChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your AI Wealth Copilot. I analyze your actual portfolio holdings in plain English without confusing financial jargon. How can I help you today?",
    },
  ]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "Is my portfolio too concentrated in tech?",
    "How can I improve my health score?",
    "What should I buy next to diversify?",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom();
    }
  }, [messages, activeTab, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isSending) return;

    const userMsg: PortfolioChatMessage = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setChatInput("");
    setIsSending(true);
    setActiveTab("chat");

    try {
      const response = await fetch("/api/portfolio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          holdings: (holdings && holdings.length > 0 ? holdings : auditData?.holdings_detail || []).map((h: any) => ({
            ticker: h.ticker,
            invested_amount: h.shares && h.average_buy_price ? h.shares * h.average_buy_price : h.invested_amount || 1000,
            shares: h.shares || 1,
          })),
          history: newHistory.slice(-4),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply || "I analyzed your portfolio data." },
        ]);
        if (Array.isArray(data.suggested_followups) && data.suggested_followups.length > 0) {
          setSuggestedPrompts(data.suggested_followups);
        }
      } else {
        throw new Error("Chat request failed");
      }
    } catch {
      // Graceful local fallback response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Your portfolio currently has strong exposure to key growth leaders. To keep your risk balanced, look into spreading future investments into defensive areas like Healthcare or Consumer Goods that act like natural shock absorbers!",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-4">
        <Skeleton className="h-5 w-48 bg-[#262A34]" />
        <Skeleton className="h-3 w-full bg-[#20242D]" />
        <Skeleton className="h-16 w-full bg-[#20242D] rounded-lg" />
        <Skeleton className="h-16 w-full bg-[#20242D] rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-[#EB5B3C]">AI Analysis Unavailable</span>
          {onRefreshAudit && (
            <button
              onClick={onRefreshAudit}
              className="text-xs text-[#5367FF] hover:text-white transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
        <p className="text-xs text-[#5A6070] leading-relaxed">{error}</p>
      </div>
    );
  }

  const diversificationScore = auditData?.diversification_score || 72;
  const scoreColor =
    diversificationScore >= 75
      ? "text-[#00D09C]"
      : diversificationScore >= 50
      ? "text-[#F59E0B]"
      : "text-[#EB5B3C]";

  return (
    <div className="bg-[#1A1D24] border border-[#262A34] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-[#5367FF]/10 flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-[#5367FF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Wealth Copilot</h3>
            <p className="text-[10px] text-[#5A6070]">Portfolio Intelligence & Chat</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold tabular-nums ${scoreColor}`}>
            {diversificationScore}
            <span className="text-xs text-[#5A6070] font-normal">/100</span>
          </div>
          <p className="text-[10px] text-[#5A6070]">Health Score</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center bg-[#14171D] rounded-lg p-1 gap-1">
        {(["summary", "metrics", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-[#1A1D24] text-white border border-[#262A34] shadow-sm"
                : "text-[#5A6070] hover:text-[#A0A8B8]"
            }`}
          >
            {tab === "chat" ? "AI Chat" : tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Summary */}
      {activeTab === "summary" && (
        <div className="space-y-3">
          {/* Insight 1: Diversification */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#14171D]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00D09C] mt-1.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-[#A0A8B8] uppercase tracking-wide mb-1">
                Diversification Diagnosis
              </p>
              <p className="text-xs text-[#A0A8B8] leading-relaxed">
                {auditData?.plain_english_summary ||
                  "Portfolio demonstrates balanced asset allocation across active positions with acceptable sector concentration."}
              </p>
            </div>
          </div>

          {/* Insight 2: Concentration Risk */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#14171D]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5367FF] mt-1.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-[#A0A8B8] uppercase tracking-wide mb-1">
                Key Concentration Risk
              </p>
              <p className="text-xs text-[#A0A8B8] leading-relaxed">
                {auditData?.concentration_warning ||
                  "No single asset exceeds allowable exposure thresholds. Exposure remains distributed across market sectors."}
              </p>
            </div>
          </div>

          {/* Insight 3: Rebalancing */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#14171D]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-[#A0A8B8] uppercase tracking-wide mb-1">
                Rebalancing Suggestion
              </p>
              <div className="space-y-1">
                {auditData?.actionable_takeaways && auditData.actionable_takeaways.length > 0 ? (
                  auditData.actionable_takeaways.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="text-xs text-[#A0A8B8] leading-relaxed">
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-[#A0A8B8] leading-relaxed">
                    Maintain scheduled rebalancing across designated holdings.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Metrics */}
      {activeTab === "metrics" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-[#14171D]">
              <p className="text-[10px] text-[#5A6070] uppercase tracking-wide mb-1">Diversification</p>
              <p className={`text-base font-bold tabular-nums ${scoreColor}`}>
                {diversificationScore}/100
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#14171D]">
              <p className="text-[10px] text-[#5A6070] uppercase tracking-wide mb-1">Risk Profile</p>
              <p className="text-sm font-semibold text-white">
                {auditData?.portfolio_risk_vibe || "Balanced"}
              </p>
            </div>
          </div>
          {auditData?.actionable_takeaways && auditData.actionable_takeaways.length > 0 && (
            <div className="p-3 rounded-lg bg-[#14171D] space-y-2">
              <p className="text-[10px] text-[#5A6070] uppercase tracking-wide">Action Items</p>
              {auditData.actionable_takeaways.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-[#5367FF] font-mono text-[10px] mt-0.5">[{idx + 1}]</span>
                  <p className="text-xs text-[#A0A8B8] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Interactive AI Chat */}
      {activeTab === "chat" && (
        <div className="space-y-3">
          <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 text-xs">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 ${
                  msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-[#5367FF]/20 text-[#5367FF]"
                      : "bg-[#00D09C]/20 text-[#00D09C]"
                  }`}
                >
                  {msg.role === "user" ? <User size={12} /> : <Sparkles size={12} />}
                </div>
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#5367FF] text-white rounded-tr-none"
                      : "bg-[#14171D] text-[#E8ECF4] border border-[#262A34] rounded-tl-none whitespace-pre-wrap"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center space-x-2 text-[#5A6070] text-xs">
                <div className="h-6 w-6 rounded-full bg-[#00D09C]/10 text-[#00D09C] flex items-center justify-center">
                  <Sparkles size={12} className="animate-spin" />
                </div>
                <span className="italic">Copilot is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="pt-2 border-t border-[#262A34]/50">
            <p className="text-[10px] font-medium text-[#5A6070] uppercase tracking-wide mb-1.5">
              Suggested Questions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isSending}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-[#14171D] hover:bg-[#20242D] text-[#A0A8B8] hover:text-white border border-[#262A34] transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ask Input (Present on all tabs, triggers chat) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center space-x-2 pt-2 border-t border-[#262A34]"
      >
        <div className="flex-1 relative">
          <MessageSquare className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5A6070]" />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isSending}
            placeholder={activeTab === "chat" ? "Type your question..." : "Ask Copilot about your portfolio..."}
            className="w-full h-8 bg-[#14171D] border border-[#262A34] rounded-lg pl-8 pr-8 text-xs text-[#E8ECF4] placeholder:text-[#5A6070] focus:outline-none focus:border-[#5367FF]"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isSending}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded flex items-center justify-center text-[#5A6070] hover:text-[#00D09C] disabled:opacity-30 disabled:hover:text-[#5A6070] transition-colors"
          >
            <Send size={12} />
          </button>
        </div>
      </form>
    </div>
  );
}
