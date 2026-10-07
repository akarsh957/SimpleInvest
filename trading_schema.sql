-- ============================================================================
-- SimpleInvest - Paper Trading Database Migration
-- ============================================================================

-- Enable Realtime for the tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- 1. ACCOUNTS TABLE (Paper Trading Balance)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance NUMERIC NOT NULL DEFAULT 100000.00 CHECK (balance >= 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ORDERS TABLE (Trade History)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    shares NUMERIC NOT NULL CHECK (shares > 0),
    price NUMERIC NOT NULL CHECK (price >= 0),
    total_value NUMERIC GENERATED ALWAYS AS (shares * price) STORED,
    status TEXT NOT NULL DEFAULT 'EXECUTED' CHECK (status IN ('PENDING', 'EXECUTED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Update existing holdings table to add user_id directly if missing, or use a unique constraint
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.holdings DROP CONSTRAINT IF EXISTS unique_portfolio_ticker;
ALTER TABLE public.holdings ADD CONSTRAINT unique_portfolio_ticker UNIQUE (portfolio_id, ticker);
ALTER TABLE public.holdings ADD CONSTRAINT unique_user_ticker UNIQUE (user_id, ticker);

-- Add Tables to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.holdings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger function to automatically create an account for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_profile_account()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.accounts (user_id, balance)
    VALUES (NEW.id, 100000.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_profile_account();

-- Trigger function to update account balance and holdings on new executed order
CREATE OR REPLACE FUNCTION public.process_executed_order()
RETURNS TRIGGER AS $$
DECLARE
    current_shares NUMERIC;
    current_avg_price NUMERIC;
    total_cost NUMERIC;
    new_shares NUMERIC;
    default_portfolio_id UUID;
BEGIN
    IF NEW.status != 'EXECUTED' THEN
        RETURN NEW;
    END IF;

    -- Get or create default portfolio
    SELECT id INTO default_portfolio_id FROM public.portfolios WHERE user_id = NEW.user_id ORDER BY created_at ASC LIMIT 1;
    IF default_portfolio_id IS NULL THEN
        INSERT INTO public.portfolios (user_id, name) VALUES (NEW.user_id, 'Default Portfolio') RETURNING id INTO default_portfolio_id;
    END IF;

    IF NEW.side = 'BUY' THEN
        -- Deduct from balance
        UPDATE public.accounts SET balance = balance - NEW.total_value, updated_at = now() WHERE user_id = NEW.user_id;
        
        -- Update holdings
        INSERT INTO public.holdings (user_id, portfolio_id, ticker, shares, average_buy_price)
        VALUES (NEW.user_id, default_portfolio_id, NEW.ticker, NEW.shares, NEW.price)
        ON CONFLICT (user_id, ticker) DO UPDATE 
        SET 
            average_buy_price = ((public.holdings.average_buy_price * public.holdings.shares) + (EXCLUDED.shares * EXCLUDED.average_buy_price)) / (public.holdings.shares + EXCLUDED.shares),
            shares = public.holdings.shares + EXCLUDED.shares,
            updated_at = now();

    ELSIF NEW.side = 'SELL' THEN
        -- Add to balance
        UPDATE public.accounts SET balance = balance + NEW.total_value, updated_at = now() WHERE user_id = NEW.user_id;
        
        -- Update holdings
        UPDATE public.holdings 
        SET shares = shares - NEW.shares, updated_at = now()
        WHERE user_id = NEW.user_id AND ticker = NEW.ticker;
        
        -- Remove if 0
        DELETE FROM public.holdings WHERE user_id = NEW.user_id AND ticker = NEW.ticker AND shares <= 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_executed ON public.orders;
CREATE TRIGGER on_order_executed
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.process_executed_order();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own account" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own account" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Make sure holdings has a user_id check
DROP POLICY IF EXISTS "Users can view their own holdings" ON public.holdings;
CREATE POLICY "Users can view their own holdings" ON public.holdings
    FOR SELECT USING (
        auth.uid() = user_id OR
        portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid())
    );
