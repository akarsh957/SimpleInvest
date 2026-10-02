-- ============================================================================
-- SimpleInvest - Phase 2 Database Schema & Security Migration
-- Supabase (PostgreSQL) Schema, Row-Level Security (RLS) & Auth Triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CLEANUP (Idempotent execution support)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.holdings CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ----------------------------------------------------------------------------
-- 2. TABLE DEFINITIONS
-- ----------------------------------------------------------------------------

-- PROFILES TABLE
-- Extends Supabase auth.users with application-specific profile data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    risk_tolerance TEXT DEFAULT 'balanced' NOT NULL 
        CHECK (risk_tolerance IN ('conservative', 'balanced', 'aggressive')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- PORTFOLIOS TABLE
-- Multi-tenant container for user investments
CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- HOLDINGS TABLE
-- Individual positions held inside a portfolio
CREATE TABLE public.holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    shares NUMERIC NOT NULL CHECK (shares > 0),
    average_buy_price NUMERIC NOT NULL CHECK (average_buy_price >= 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. B-TREE INDEXES FOR HIGH-PERFORMANCE JOINS & RLS CHECKS
-- ----------------------------------------------------------------------------
CREATE INDEX idx_portfolios_user_id ON public.portfolios USING btree (user_id);
CREATE INDEX idx_holdings_portfolio_id ON public.holdings USING btree (portfolio_id);
CREATE INDEX idx_holdings_ticker ON public.holdings USING btree (ticker);
CREATE INDEX idx_portfolios_user_id_id ON public.portfolios USING btree (user_id, id);

-- ----------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- Note: Wrapping auth.uid() inside (select auth.uid()) enables PostgreSQL 
-- subquery caching, reducing auth evaluation overhead from per-row to per-query.
-- ----------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- -------------------------------------
-- RLS Policies for PROFILES
-- -------------------------------------
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (id = (select auth.uid()))
    WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can delete own profile" 
    ON public.profiles FOR DELETE 
    USING (id = (select auth.uid()));

-- -------------------------------------
-- RLS Policies for PORTFOLIOS
-- -------------------------------------
CREATE POLICY "Users can view own portfolios" 
    ON public.portfolios FOR SELECT 
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own portfolios" 
    ON public.portfolios FOR INSERT 
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own portfolios" 
    ON public.portfolios FOR UPDATE 
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own portfolios" 
    ON public.portfolios FOR DELETE 
    USING (user_id = (select auth.uid()));

-- -------------------------------------
-- RLS Policies for HOLDINGS
-- -------------------------------------
-- Multi-tenant security verified by subquery checking portfolio ownership
CREATE POLICY "Users can view own holdings" 
    ON public.holdings FOR SELECT 
    USING (
        portfolio_id IN (
            SELECT id FROM public.portfolios WHERE user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can insert own holdings" 
    ON public.holdings FOR INSERT 
    WITH CHECK (
        portfolio_id IN (
            SELECT id FROM public.portfolios WHERE user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can update own holdings" 
    ON public.holdings FOR UPDATE 
    USING (
        portfolio_id IN (
            SELECT id FROM public.portfolios WHERE user_id = (select auth.uid())
        )
    )
    WITH CHECK (
        portfolio_id IN (
            SELECT id FROM public.portfolios WHERE user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can delete own holdings" 
    ON public.holdings FOR DELETE 
    USING (
        portfolio_id IN (
            SELECT id FROM public.portfolios WHERE user_id = (select auth.uid())
        )
    );

-- ----------------------------------------------------------------------------
-- 5. AUTOMATED USER SYNCHRONIZATION TRIGGER
-- ----------------------------------------------------------------------------
-- Auto-creates a public.profiles record whenever a user signs up via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', '')
    );
    RETURN new;
END;
$$;

-- Revoke default public execution permission for safety
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
