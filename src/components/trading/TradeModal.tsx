"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticker: string;
    currentPrice: number;
    userId: string;
    onTradeSuccess: () => void;
}

export function TradeModal({ isOpen, onClose, ticker, currentPrice, userId, onTradeSuccess }: TradeModalProps) {
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [shares, setShares] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalValue = typeof shares === 'number' ? shares * currentPrice : 0;

    const handleTrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shares || shares <= 0) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/trade/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    ticker,
                    side,
                    shares: Number(shares)
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Trade failed');
            }

            onTradeSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-[#07090e] border border-white/[0.08] rounded-2xl p-6 shadow-2xl overflow-hidden"
                    >
                        {/* Glassmorphic Highlights */}
                        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-xl font-semibold text-white/90">Trade {ticker}</h2>
                            <button onClick={onClose} className="text-white/50 hover:text-white/90 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleTrade} className="space-y-6 relative z-10">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2 p-1 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                                <button
                                    type="button"
                                    onClick={() => setSide('BUY')}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                        side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-white/50 hover:text-white/70'
                                    }`}
                                >
                                    Buy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSide('SELL')}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                        side === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'text-white/50 hover:text-white/70'
                                    }`}
                                >
                                    Sell
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Shares</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={shares}
                                        onChange={(e) => setShares(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-white/20"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="flex justify-between items-center py-2 border-t border-white/[0.05]">
                                    <span className="text-white/50 text-sm">Current Price</span>
                                    <span className="text-white font-medium">${currentPrice.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center py-2 border-t border-white/[0.05]">
                                    <span className="text-white/50 text-sm">Estimated Total</span>
                                    <span className="text-emerald-400 font-medium">${totalValue.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !shares || shares <= 0}
                                className={`w-full py-3 rounded-lg font-medium transition-all ${
                                    isSubmitting || !shares || shares <= 0 
                                        ? 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                                        : side === 'BUY'
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                            : 'bg-red-500 text-white hover:bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                }`}
                            >
                                {isSubmitting ? 'Executing...' : `Confirm ${side}`}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
