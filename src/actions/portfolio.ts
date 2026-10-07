'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Holding, Portfolio, PortfolioAuditResponse } from '@/src/types/portfolio';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get or initialize the user's default portfolio.
 */
export async function getOrCreateDefaultPortfolio(): Promise<Portfolio | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Check existing portfolios
  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching user portfolios:', error);
    return null;
  }

  if (portfolios && portfolios.length > 0) {
    return portfolios[0] as Portfolio;
  }

  // Create default portfolio if none exists
  const { data: newPortfolio, error: createError } = await supabase
    .from('portfolios')
    .insert([{ user_id: user.id, name: 'Main Portfolio' }])
    .select()
    .single();

  if (createError) {
    console.error('Error creating default portfolio:', createError);
    return null;
  }

  return newPortfolio as Portfolio;
}

/**
 * Fetch all portfolios for current user.
 */
export async function getUserPortfolios(): Promise<Portfolio[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }

  return data as Portfolio[];
}

/**
 * Create a new portfolio container.
 */
export async function createPortfolioAction(name: string): Promise<{ success: boolean; portfolio?: Portfolio; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'User not authenticated' };
  if (!name.trim()) return { success: false, error: 'Portfolio name is required' };

  const { data, error } = await supabase
    .from('portfolios')
    .insert([{ user_id: user.id, name: name.trim() }])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, portfolio: data as Portfolio };
}

/**
 * Fetch holdings for a given portfolio ID.
 */
export async function getPortfolioHoldings(portfolioId: string): Promise<Holding[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching holdings:', error);
    return [];
  }

  return (data || []).map((h) => ({
    id: h.id,
    portfolio_id: h.portfolio_id,
    ticker: h.ticker,
    shares: Number(h.shares),
    average_buy_price: Number(h.average_buy_price),
    created_at: h.created_at,
    updated_at: h.updated_at,
  }));
}

/**
 * Add a holding to Supabase portfolio.
 */
export async function addHoldingAction(
  portfolioId: string,
  ticker: string,
  shares: number,
  averageBuyPrice: number
): Promise<{ success: boolean; holding?: Holding; error?: string }> {
  const supabase = await createClient();

  const formattedTicker = ticker.trim().toUpperCase();

  if (!formattedTicker) {
    return { success: false, error: 'Ticker symbol is required' };
  }
  if (shares <= 0) {
    return { success: false, error: 'Shares must be greater than 0' };
  }
  if (averageBuyPrice < 0) {
    return { success: false, error: 'Buy price cannot be negative' };
  }

  // Check if ticker already exists in portfolio
  const { data: existing } = await supabase
    .from('holdings')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('ticker', formattedTicker)
    .maybeSingle();

  if (existing) {
    // Combine positions: recalculate weighted average buy price & total shares
    const existingShares = Number(existing.shares);
    const existingPrice = Number(existing.average_buy_price);
    const totalShares = existingShares + shares;
    const weightedAvgPrice = (existingShares * existingPrice + shares * averageBuyPrice) / totalShares;

    const { data: updated, error: updateError } = await supabase
      .from('holdings')
      .update({
        shares: totalShares,
        average_buy_price: Math.round(weightedAvgPrice * 100) / 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard');
    return {
      success: true,
      holding: {
        id: updated.id,
        portfolio_id: updated.portfolio_id,
        ticker: updated.ticker,
        shares: Number(updated.shares),
        average_buy_price: Number(updated.average_buy_price),
      },
    };
  }

  // Insert new holding
  const { data: inserted, error: insertError } = await supabase
    .from('holdings')
    .insert([
      {
        portfolio_id: portfolioId,
        ticker: formattedTicker,
        shares: shares,
        average_buy_price: averageBuyPrice,
      },
    ])
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath('/dashboard');
  return {
    success: true,
    holding: {
      id: inserted.id,
      portfolio_id: inserted.portfolio_id,
      ticker: inserted.ticker,
      shares: Number(inserted.shares),
      average_buy_price: Number(inserted.average_buy_price),
    },
  };
}

/**
 * Delete a holding by ID.
 */
export async function deleteHoldingAction(holdingId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', holdingId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Call FastAPI `/api/portfolio/audit` endpoint.
 */
export async function auditPortfolioAction(
  holdings: Array<{ ticker: string; shares: number; average_buy_price: number }>
): Promise<{ success: boolean; data?: PortfolioAuditResponse; error?: string }> {
  if (!holdings || holdings.length === 0) {
    return { success: false, error: 'No holdings provided for audit' };
  }

  try {
    const payload = {
      holdings: holdings.map((h) => ({
        ticker: h.ticker,
        invested_amount: Math.round(h.shares * h.average_buy_price * 100) / 100,
      })),
    };

    const response = await fetch(`${API_BASE_URL}/api/portfolio/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Audit API Error (${response.status}): ${errText}` };
    }

    const data: PortfolioAuditResponse = await response.json();
    return { success: true, data };
  } catch (err: any) {
    console.error('Error fetching portfolio audit:', err);
    return {
      success: false,
      error: err?.message || 'Failed to communicate with portfolio audit service',
    };
  }
}
