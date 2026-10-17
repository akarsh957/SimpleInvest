-- ============================================================================
-- SimpleInvest - Paper Trading Database Migration
-- ============================================================================

-- Enable Realtime without dropping the existing publication or its tables.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END;
$$;

-- 1. ACCOUNTS TABLE (Paper Trading Balance)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC NOT NULL DEFAULT 100000.00 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ORDERS TABLE (Trade History)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL CHECK (btrim(ticker) <> ''),
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    shares NUMERIC NOT NULL CHECK (shares > 0),
    price NUMERIC NOT NULL CHECK (price > 0),
    total_value NUMERIC GENERATED ALWAYS AS (shares * price) STORED,
    status TEXT NOT NULL DEFAULT 'EXECUTED'
        CHECK (status IN ('PENDING', 'EXECUTED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- holdings belong to portfolios; normalize and merge duplicate positions before
-- enforcing one position per ticker in each portfolio.
WITH grouped_holdings AS (
    SELECT
        portfolio_id,
        upper(btrim(ticker)) AS ticker,
        (array_agg(id ORDER BY created_at, id))[1] AS keep_id,
        sum(shares) AS shares,
        sum(shares * average_buy_price) / sum(shares) AS average_buy_price
    FROM public.holdings
    GROUP BY portfolio_id, upper(btrim(ticker))
)
UPDATE public.holdings AS holding
SET
    ticker = grouped.ticker,
    shares = grouped.shares,
    average_buy_price = grouped.average_buy_price,
    updated_at = now()
FROM grouped_holdings AS grouped
WHERE holding.id = grouped.keep_id;

WITH ranked_holdings AS (
    SELECT
        id,
        row_number() OVER (
            PARTITION BY portfolio_id, upper(btrim(ticker))
            ORDER BY created_at, id
        ) AS position_number
    FROM public.holdings
)
DELETE FROM public.holdings AS holding
USING ranked_holdings AS ranked
WHERE holding.id = ranked.id
  AND ranked.position_number > 1;

ALTER TABLE public.holdings
    DROP CONSTRAINT IF EXISTS unique_user_ticker;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.holdings'::regclass
          AND conname = 'unique_portfolio_ticker'
    ) THEN
        ALTER TABLE public.holdings
            ADD CONSTRAINT unique_portfolio_ticker UNIQUE (portfolio_id, ticker);
    END IF;
END;
$$;

-- Add each table only if it is not already covered by the publication.
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY['accounts', 'holdings', 'orders']
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = table_name
        ) AND NOT EXISTS (
            SELECT 1
            FROM pg_publication
            WHERE pubname = 'supabase_realtime'
              AND puballtables
        ) THEN
            EXECUTE format(
                'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
                table_name
            );
        END IF;
    END LOOP;
END;
$$;

-- Create accounts for profiles that existed before this migration.
INSERT INTO public.accounts (user_id, balance)
SELECT id, 100000.00
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger function to automatically create an account for new profiles.
CREATE OR REPLACE FUNCTION public.handle_new_profile_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.accounts (user_id, balance)
    VALUES (NEW.id, 100000.00)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_account();

-- Executed orders are immutable so their account effects cannot be invalidated.
CREATE OR REPLACE FUNCTION public.prevent_executed_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'EXECUTED' AND NEW IS DISTINCT FROM OLD THEN
        RAISE EXCEPTION 'Executed orders cannot be changed';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_executed_order_status_change ON public.orders;
DROP TRIGGER IF EXISTS prevent_executed_order_update ON public.orders;
CREATE TRIGGER prevent_executed_order_update
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.prevent_executed_order_update();

-- Trigger function to update the account balance and holdings on execution.
CREATE OR REPLACE FUNCTION public.process_executed_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_balance NUMERIC;
    current_shares NUMERIC;
    default_portfolio_id UUID;
BEGIN
    IF NEW.status <> 'EXECUTED' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status = 'EXECUTED' THEN
        RETURN NEW;
    END IF;

    -- Serialize this user's executions while resolving or creating a portfolio.
    PERFORM 1
    FROM public.profiles
    WHERE id = NEW.user_id
    FOR UPDATE;

    SELECT balance
    INTO current_balance
    FROM public.accounts
    WHERE user_id = NEW.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trading account does not exist for user %', NEW.user_id;
    END IF;

    SELECT id
    INTO default_portfolio_id
    FROM public.portfolios
    WHERE user_id = NEW.user_id
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    IF default_portfolio_id IS NULL THEN
        INSERT INTO public.portfolios (user_id, name)
        VALUES (NEW.user_id, 'Default Portfolio')
        RETURNING id INTO default_portfolio_id;
    END IF;

    IF NEW.side = 'BUY' THEN
        IF current_balance < NEW.total_value THEN
            RAISE EXCEPTION 'Insufficient account balance to execute order';
        END IF;

        UPDATE public.accounts
        SET balance = balance - NEW.total_value, updated_at = now()
        WHERE user_id = NEW.user_id;

        INSERT INTO public.holdings (
            portfolio_id,
            ticker,
            shares,
            average_buy_price
        )
        VALUES (
            default_portfolio_id,
            upper(btrim(NEW.ticker)),
            NEW.shares,
            NEW.price
        )
        ON CONFLICT (portfolio_id, ticker) DO UPDATE
        SET
            average_buy_price =
                (
                    (public.holdings.average_buy_price * public.holdings.shares)
                    + (EXCLUDED.shares * EXCLUDED.average_buy_price)
                ) / (public.holdings.shares + EXCLUDED.shares),
            shares = public.holdings.shares + EXCLUDED.shares,
            updated_at = now();

    ELSIF NEW.side = 'SELL' THEN
        SELECT shares
        INTO current_shares
        FROM public.holdings
        WHERE portfolio_id = default_portfolio_id
          AND ticker = upper(btrim(NEW.ticker))
        FOR UPDATE;

        IF NOT FOUND OR current_shares < NEW.shares THEN
            RAISE EXCEPTION 'Insufficient shares to execute sell order';
        ELSIF current_shares = NEW.shares THEN
            DELETE FROM public.holdings
            WHERE portfolio_id = default_portfolio_id
              AND ticker = upper(btrim(NEW.ticker));
        ELSE
            UPDATE public.holdings
            SET shares = current_shares - NEW.shares, updated_at = now()
            WHERE portfolio_id = default_portfolio_id
              AND ticker = upper(btrim(NEW.ticker));
        END IF;

        UPDATE public.accounts
        SET balance = balance + NEW.total_value, updated_at = now()
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_executed ON public.orders;
CREATE TRIGGER on_order_executed
    AFTER INSERT OR UPDATE OF status ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.process_executed_order();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON public.accounts;
CREATE POLICY "Users can view their own account" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own holdings" ON public.holdings;
CREATE POLICY "Users can view their own holdings" ON public.holdings
    FOR SELECT USING (
        portfolio_id IN (
            SELECT id
            FROM public.portfolios
            WHERE user_id = auth.uid()
        )
    );
