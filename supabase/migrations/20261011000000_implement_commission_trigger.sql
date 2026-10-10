-- 1. Commission RLS Policies Update
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Remove old policy that allowed reading team commissions
DROP POLICY IF EXISTS "Users read team commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users read own commissions" ON public.commissions;

-- Users can only read THEIR OWN commissions
CREATE POLICY "Users read own commissions" ON public.commissions
FOR SELECT TO authenticated
USING ( user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );

-- Admin full access to commissions
DROP POLICY IF EXISTS "Admin full access commissions" ON public.commissions;
CREATE POLICY "Admin full access commissions" ON public.commissions
FOR ALL TO authenticated
USING ( (SELECT role FROM public.user_profiles WHERE auth_user_id = auth.uid()) = 'ADMIN' )
WITH CHECK ( (SELECT role FROM public.user_profiles WHERE auth_user_id = auth.uid()) = 'ADMIN' );

-- Update Admin policy for update/insert if missing
DROP POLICY IF EXISTS "Admin manage commissions" ON public.commissions;
CREATE POLICY "Admin manage commissions" ON public.commissions
FOR ALL TO authenticated
USING ( (SELECT role FROM public.user_profiles WHERE auth_user_id = auth.uid()) = 'ADMIN' )
WITH CHECK ( (SELECT role FROM public.user_profiles WHERE auth_user_id = auth.uid()) = 'ADMIN' );


-- 2. Trigger Function to Generate Commission
CREATE OR REPLACE FUNCTION public.generate_commission_for_business()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_commission_number TEXT;
BEGIN
  -- Only process if there's a booking_amount > 0 and assigned_user_id is not null
  IF NEW.assigned_user_id IS NULL OR COALESCE(NEW.booking_amount, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  -- Get the assigned user's role
  SELECT role INTO v_role FROM public.user_profiles WHERE id = NEW.assigned_user_id;

  -- Determine rate based on role
  IF v_role = 'ASSOCIATE' THEN
    v_rate := 5.0;
  ELSIF v_role = 'TEAM_LEADER' THEN
    v_rate := 3.0;
  ELSIF v_role = 'SENIOR_TL' THEN
    v_rate := 2.0;
  ELSE
    -- Other roles don't get commissions via this automatic rule
    RETURN NEW;
  END IF;

  -- Calculate commission based on booking_amount
  v_commission_amount := (NEW.booking_amount * v_rate) / 100.0;

  -- Generate unique commission number
  v_commission_number := 'COM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));

  -- Insert securely. The UNIQUE(business_id, user_id, role) constraint prevents duplicates
  -- We use an exception block to gracefully ignore if it somehow already exists
  BEGIN
    INSERT INTO public.commissions (
      commission_number,
      business_id,
      user_id,
      role,
      commission_percentage,
      base_amount,
      commission_amount,
      status,
      generated_at
    ) VALUES (
      v_commission_number,
      NEW.id,
      NEW.assigned_user_id,
      v_role::app_role,
      v_rate,
      NEW.booking_amount,
      v_commission_amount,
      'PENDING',
      now()
    );
  EXCEPTION WHEN unique_violation THEN
    -- Do nothing, commission already exists for this business/user/role combo
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger
DROP TRIGGER IF EXISTS trg_generate_commission ON public.businesses;
CREATE TRIGGER trg_generate_commission
AFTER INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.generate_commission_for_business();

-- 4. Enable Realtime for commissions table if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'commissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.commissions;
  END IF;
END $$;

-- 5. Backfill existing eligible businesses
DO $$
DECLARE
  b RECORD;
  v_role TEXT;
  v_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_commission_number TEXT;
  v_count INTEGER := 0;
BEGIN
  FOR b IN 
    SELECT id, assigned_user_id, booking_amount 
    FROM public.businesses 
    WHERE assigned_user_id IS NOT NULL 
      AND COALESCE(booking_amount, 0) > 0
  LOOP
    -- Check if commission already exists
    IF NOT EXISTS (SELECT 1 FROM public.commissions WHERE business_id = b.id) THEN
      
      SELECT role INTO v_role FROM public.user_profiles WHERE id = b.assigned_user_id;
      
      IF v_role IN ('ASSOCIATE', 'TEAM_LEADER', 'SENIOR_TL') THEN
        IF v_role = 'ASSOCIATE' THEN v_rate := 5.0;
        ELSIF v_role = 'TEAM_LEADER' THEN v_rate := 3.0;
        ELSIF v_role = 'SENIOR_TL' THEN v_rate := 2.0;
        END IF;
        
        v_commission_amount := (b.booking_amount * v_rate) / 100.0;
        v_commission_number := 'COM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
        
        INSERT INTO public.commissions (
          commission_number,
          business_id,
          user_id,
          role,
          commission_percentage,
          base_amount,
          commission_amount,
          status,
          generated_at
        ) VALUES (
          v_commission_number,
          b.id,
          b.assigned_user_id,
          v_role::app_role,
          v_rate,
          b.booking_amount,
          v_commission_amount,
          'PENDING',
          now()
        );
        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;
  RAISE NOTICE 'Backfilled % historical commission records.', v_count;
END $$;
