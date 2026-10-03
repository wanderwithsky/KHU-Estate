-- Alter businesses table to support flat admin business records
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT,
ADD COLUMN IF NOT EXISTS area_sqft NUMERIC,
ADD COLUMN IF NOT EXISTS booking_amount NUMERIC(14,2),
ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(6,3),
ADD COLUMN IF NOT EXISTS total_income NUMERIC(14,2),
ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(14,2),
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES public.user_profiles(id);

-- Relax existing NOT NULL constraints that break flat insertions
ALTER TABLE public.businesses ALTER COLUMN business_number DROP NOT NULL;
ALTER TABLE public.businesses ALTER COLUMN associate_id DROP NOT NULL;
ALTER TABLE public.businesses ALTER COLUMN deal_amount DROP NOT NULL;
ALTER TABLE public.businesses ALTER COLUMN status DROP NOT NULL;

-- Update RLS for businesses table
DROP POLICY IF EXISTS "Admin full access businesses" ON public.businesses;
CREATE POLICY "Admin full access businesses" 
ON public.businesses FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
);

DROP POLICY IF EXISTS "Users can read own businesses" ON public.businesses;
CREATE POLICY "Users can read own businesses" 
ON public.businesses FOR SELECT 
USING (
    assigned_user_id = auth.uid() OR
    associate_id = auth.uid() OR
    tl_id = auth.uid() OR
    stl_id = auth.uid()
);
