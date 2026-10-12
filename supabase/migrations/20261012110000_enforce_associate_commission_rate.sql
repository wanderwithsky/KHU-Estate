-- Migration: 20261012110000_enforce_associate_commission_rate.sql
-- Enforce 5% commission rate and recalculate income for Associate Self Business in stl_self_performance

CREATE OR REPLACE FUNCTION public.enforce_associate_self_business_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_user_role TEXT;
    v_total NUMERIC;
    v_booking NUMERIC;
BEGIN
    -- Determine role of the user creating/updating this self-performance record
    SELECT role INTO v_user_role
    FROM public.user_profiles
    WHERE id = NEW.stl_id;

    -- If the user is an ASSOCIATE, enforce the strict 5% commission rate rule
    IF v_user_role = 'ASSOCIATE' THEN
        NEW.commission_percent := 5.00;
        
        -- Recalculate balance amount: max(0, total_amount - booking_amount)
        v_total := COALESCE(NEW.total_amount, 0);
        v_booking := COALESCE(NEW.booking_amount, 0);
        NEW.balance_amount := GREATEST(0, v_total - v_booking);
        
        -- Calculate income based on 5% of total_amount
        NEW.total_income := ROUND((v_total * 5.00) / 100.0, 2);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists and recreate
DROP TRIGGER IF EXISTS trg_enforce_associate_commission ON public.stl_self_performance;
CREATE TRIGGER trg_enforce_associate_commission
BEFORE INSERT OR UPDATE ON public.stl_self_performance
FOR EACH ROW
EXECUTE FUNCTION public.enforce_associate_self_business_commission();
