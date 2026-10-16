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
