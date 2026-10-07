"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AIInsightDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    ticker: string;
    insight: {
        momentum_score: number;
        trend: string;
        analysis: string;
    } | null;
    isLoading: boolean;
}

export function AIInsightDrawer({ isOpen, onClose, ticker, insight, isLoading }: AIInsightDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#07090e] border-l border-white/[0.08] p-6 shadow-2xl flex flex-col"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Bot className="text-emerald-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white/90">Groq AI Analysis</h2>
                                    <p className="text-xs text-white/50 uppercase tracking-wider">{ticker} Momentum</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-white/50 hover:text-white/90 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 relative z-10">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white/50 text-sm animate-pulse">Running technical analysis...</p>
                                </div>
                            ) : insight ? (
                                <div className="space-y-6">
                                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
                                        <span className="text-white/70">Momentum Score</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-24 bg-white/[0.1] rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                                                    style={{ width: `${insight.momentum_score}%` }}
                                                />
                                            </div>
                                            <span className="font-semibold text-emerald-400">{insight.momentum_score.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
                                        <span className="text-white/70">Trend Indicator</span>
                                        <div className="flex items-center gap-2">
                                            {insight.trend === 'BULLISH' && <TrendingUp className="text-emerald-400" size={20} />}
                                            {insight.trend === 'BEARISH' && <TrendingDown className="text-red-400" size={20} />}
                                            {insight.trend === 'NEUTRAL' && <Minus className="text-white/50" size={20} />}
                                            <span className={`font-semibold ${
                                                insight.trend === 'BULLISH' ? 'text-emerald-400' :
                                                insight.trend === 'BEARISH' ? 'text-red-400' :
                                                'text-white/70'
                                            }`}>
                                                {insight.trend}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/[0.05]">
                                        <h3 className="text-sm font-medium text-white/90 mb-3">Plain-English Insight</h3>
                                        <p className="text-white/70 leading-relaxed text-sm">
                                            {insight.analysis}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-white/50">
                                    Failed to load analysis.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
