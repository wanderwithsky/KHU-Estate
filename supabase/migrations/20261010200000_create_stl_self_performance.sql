-- 1. Ensure STL cannot insert into businesses (Revert any prior policy)
DROP POLICY IF EXISTS "Users insert own business" ON public.businesses;

-- 2. Create the dedicated STL Self Performance table
CREATE TABLE IF NOT EXISTS public.stl_self_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stl_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_name TEXT NOT NULL,
    phone TEXT,
    project_name TEXT,
    location TEXT,
    area_sqft NUMERIC(14,2),
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    booking_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    balance_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.stl_self_performance ENABLE ROW LEVEL SECURITY;

-- 4. Policies for stl_self_performance
-- STLs can only see their own records
DROP POLICY IF EXISTS "STL read own self performance" ON public.stl_self_performance;
CREATE POLICY "STL read own self performance" ON public.stl_self_performance
FOR SELECT TO authenticated
USING ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );

-- STLs can insert their own records
DROP POLICY IF EXISTS "STL insert own self performance" ON public.stl_self_performance;
CREATE POLICY "STL insert own self performance" ON public.stl_self_performance
FOR INSERT TO authenticated
WITH CHECK ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );

-- STLs can update their own records
DROP POLICY IF EXISTS "STL update own self performance" ON public.stl_self_performance;
CREATE POLICY "STL update own self performance" ON public.stl_self_performance
FOR UPDATE TO authenticated
USING ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) )
WITH CHECK ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );

-- STLs can delete their own records
DROP POLICY IF EXISTS "STL delete own self performance" ON public.stl_self_performance;
CREATE POLICY "STL delete own self performance" ON public.stl_self_performance
FOR DELETE TO authenticated
USING ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );

-- Admin can see all (optional, but good practice for CRM)
DROP POLICY IF EXISTS "Admin full access self performance" ON public.stl_self_performance;
CREATE POLICY "Admin full access self performance" ON public.stl_self_performance
FOR ALL TO authenticated
USING ( (SELECT role FROM public.user_profiles WHERE auth_user_id = auth.uid()) = 'ADMIN' );
