"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface AccountBalance {
    balance: number;
}

export interface Holding {
    ticker: string;
    shares: number;
    average_buy_price: number;
}

export function useRealtimePortfolio(userId: string | undefined, portfolioId?: string) {
    const [balance, setBalance] = useState<number | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const supabase = createClient();

    useEffect(() => {
        if (!userId) return;

        const fetchInitialData = async () => {
            const { data: accountData } = await supabase
                .from('accounts')
                .select('balance')
                .eq('user_id', userId)
                .maybeSingle();

            if (accountData) setBalance(Number(accountData.balance));

            if (!portfolioId) {
                setHoldings([]);
                return;
            }

            const { data: holdingsData } = await supabase
                .from('holdings')
                .select('ticker, shares, average_buy_price')
                .eq('portfolio_id', portfolioId);

            if (holdingsData) {
                setHoldings(
                    holdingsData.map((item) => ({
                        ticker: item.ticker,
                        shares: Number(item.shares),
                        average_buy_price: Number(item.average_buy_price),
                    }))
                );
            }
        };

        fetchInitialData();

        const accountsSubscription = supabase
            .channel('accounts_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` }, (payload: any) => {
                const newData = payload.new as { balance: number };
                if (newData && newData.balance !== undefined) {
                    setBalance(Number(newData.balance));
                }
            })
            .subscribe();

        const holdingsSubscription = portfolioId
            ? supabase
                .channel('holdings_channel')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'holdings', filter: `portfolio_id=eq.${portfolioId}` }, () => {
                    fetchInitialData();
                })
                .subscribe()
            : null;

        return () => {
            supabase.removeChannel(accountsSubscription);
            if (holdingsSubscription) {
                supabase.removeChannel(holdingsSubscription);
            }
        };
    }, [userId, portfolioId, supabase]);

    return { balance, holdings };
}
