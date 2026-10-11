-- Migration: 20261011010000_fix_business_schema_and_hierarchy.sql
-- Ensure business records retain customer details, synchronizes assigned_user_id and associate_id,
-- and automatically sets hierarchy (tl_id, stl_id) for accurate reporting across all dashboards.

-- 1. Synchronize Priya's senior_tl_id in user_profiles if missing
UPDATE public.user_profiles
SET senior_tl_id = (SELECT p.senior_tl_id FROM public.user_profiles p WHERE p.id = user_profiles.parent_user_id)
WHERE role = 'ASSOCIATE' AND senior_tl_id IS NULL AND parent_user_id IS NOT NULL;

-- 2. Safely synchronize existing businesses records
UPDATE public.businesses
SET associate_id = assigned_user_id
WHERE associate_id IS NULL AND assigned_user_id IS NOT NULL;

UPDATE public.businesses
SET assigned_user_id = associate_id
WHERE assigned_user_id IS NULL AND associate_id IS NOT NULL;

-- Backfill stl_id and tl_id for existing businesses based on assigned user's profile
UPDATE public.businesses b
SET 
  stl_id = COALESCE(b.stl_id, CASE 
    WHEN u.role = 'SENIOR_TL' THEN u.id
    WHEN u.role = 'TEAM_LEADER' THEN COALESCE(u.senior_tl_id, u.parent_user_id)
    WHEN u.role = 'ASSOCIATE' THEN COALESCE(u.senior_tl_id, (SELECT p.senior_tl_id FROM public.user_profiles p WHERE p.id = u.parent_user_id))
    ELSE NULL
  END),
  tl_id = COALESCE(b.tl_id, CASE 
    WHEN u.role = 'TEAM_LEADER' THEN u.id
    WHEN u.role = 'ASSOCIATE' THEN u.parent_user_id
    ELSE NULL
  END)
FROM public.user_profiles u
WHERE (b.assigned_user_id = u.id OR b.associate_id = u.id);

-- 3. Create or replace trigger function to maintain consistency for all future inserts/updates
CREATE OR REPLACE FUNCTION public.sync_business_hierarchy_and_details()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Sync user assignment keys
  IF NEW.assigned_user_id IS NULL AND NEW.associate_id IS NOT NULL THEN
    NEW.assigned_user_id := NEW.associate_id;
  ELSIF NEW.associate_id IS NULL AND NEW.assigned_user_id IS NOT NULL THEN
    NEW.associate_id := NEW.assigned_user_id;
  END IF;

  -- Trim string fields
  IF NEW.customer_name IS NOT NULL THEN
    NEW.customer_name := TRIM(NEW.customer_name);
  END IF;
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := TRIM(NEW.phone);
  END IF;
  IF NEW.project_name IS NOT NULL THEN
    NEW.project_name := TRIM(NEW.project_name);
  END IF;

  -- Look up assigned user profile to populate hierarchy if missing
  IF NEW.assigned_user_id IS NOT NULL THEN
    SELECT id, role, parent_user_id, senior_tl_id INTO v_user
    FROM public.user_profiles
    WHERE id = NEW.assigned_user_id;

    IF FOUND THEN
      IF v_user.role = 'SENIOR_TL' THEN
        NEW.stl_id := COALESCE(NEW.stl_id, v_user.id);
      ELSIF v_user.role = 'TEAM_LEADER' THEN
        NEW.tl_id := COALESCE(NEW.tl_id, v_user.id);
        NEW.stl_id := COALESCE(NEW.stl_id, v_user.senior_tl_id, v_user.parent_user_id);
      ELSIF v_user.role = 'ASSOCIATE' THEN
        NEW.tl_id := COALESCE(NEW.tl_id, v_user.parent_user_id);
        NEW.stl_id := COALESCE(NEW.stl_id, v_user.senior_tl_id, (SELECT p.senior_tl_id FROM public.user_profiles p WHERE p.id = v_user.parent_user_id));
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_business_hierarchy ON public.businesses;
CREATE TRIGGER trg_sync_business_hierarchy
BEFORE INSERT OR UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.sync_business_hierarchy_and_details();

-- 4. Update RLS policies to include assigned_user_id
DROP POLICY IF EXISTS "Users read team businesses" ON public.businesses;
CREATE POLICY "Users read team businesses" ON public.businesses 
FOR SELECT TO authenticated USING (
    associate_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
    assigned_user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
    tl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
    stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
);
