CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    previous_role public.app_role,
    new_role public.app_role,
    target_amount NUMERIC(14,2),
    achieved_amount NUMERIC(14,2),
    status TEXT DEFAULT 'PROMOTED',
    promotion_date TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Admin full access on promotions" ON public.promotions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
);

CREATE POLICY "Users can read own promotions" ON public.promotions FOR SELECT USING (
    user_id = auth.uid()
);

