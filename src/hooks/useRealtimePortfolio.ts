"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface AccountBalance {
    balance: number;
}

export interface Holding {
    ticker: string;
    shares: number;
    average_buy_price: number;
}

export function useRealtimePortfolio(userId: string | undefined) {
    const [balance, setBalance] = useState<number | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const supabase = createClientComponentClient();

    useEffect(() => {
        if (!userId) return;

        // Fetch initial data
        const fetchInitialData = async () => {
            const { data: accountData } = await supabase
                .from('accounts')
                .select('balance')
                .eq('user_id', userId)
                .single();
            
            if (accountData) setBalance(accountData.balance);

            const { data: holdingsData } = await supabase
                .from('holdings')
                .select('ticker, shares, average_buy_price')
                .eq('user_id', userId);
            
            if (holdingsData) setHoldings(holdingsData);
        };

        fetchInitialData();

        // Subscribe to changes
        const accountsSubscription = supabase
            .channel('accounts_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` }, (payload) => {
                const newData = payload.new as { balance: number };
                if (newData && newData.balance !== undefined) {
                    setBalance(newData.balance);
                }
            })
            .subscribe();

        const holdingsSubscription = supabase
            .channel('holdings_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'holdings', filter: `user_id=eq.${userId}` }, (payload) => {
                fetchInitialData(); // Re-fetch on any holdings change to simplify state management
            })
            .subscribe();

        return () => {
            supabase.removeChannel(accountsSubscription);
            supabase.removeChannel(holdingsSubscription);
        };
    }, [userId, supabase]);

    return { balance, holdings };
}
