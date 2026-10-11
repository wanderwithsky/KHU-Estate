-- Migration: Associate Self Performance support on existing stl_self_performance table
-- Ensure columns for address, commission_percent, and total_income exist
ALTER TABLE public.stl_self_performance 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.stl_self_performance 
ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2) DEFAULT 5.00;

ALTER TABLE public.stl_self_performance 
ADD COLUMN IF NOT EXISTS total_income NUMERIC(14,2) DEFAULT 0;

-- Ensure RLS allows all authenticated roles (Associates, TLs, STLs) to manage only their own records
-- stl_id references user_profiles(id)
DROP POLICY IF EXISTS "Users read own self performance" ON public.stl_self_performance;
CREATE POLICY "Users read own self performance" ON public.stl_self_performance
FOR SELECT TO authenticated
USING ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );

DROP POLICY IF EXISTS "Users insert own self performance" ON public.stl_self_performance;
CREATE POLICY "Users insert own self performance" ON public.stl_self_performance
FOR INSERT TO authenticated
WITH CHECK ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );

DROP POLICY IF EXISTS "Users update own self performance" ON public.stl_self_performance;
CREATE POLICY "Users update own self performance" ON public.stl_self_performance
FOR UPDATE TO authenticated
USING ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) )
WITH CHECK ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );

DROP POLICY IF EXISTS "Users delete own self performance" ON public.stl_self_performance;
CREATE POLICY "Users delete own self performance" ON public.stl_self_performance
FOR DELETE TO authenticated
USING ( stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) );
