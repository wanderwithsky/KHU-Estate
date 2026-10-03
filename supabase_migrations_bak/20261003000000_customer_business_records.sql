CREATE TABLE public.customer_business_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    project_name TEXT NOT NULL,
    area_sqft NUMERIC NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL,
    booking_amount NUMERIC(14,2) NOT NULL,
    commission_percent NUMERIC(6,3) NOT NULL,
    total_income NUMERIC(14,2) NOT NULL,
    balance_amount NUMERIC(14,2) NOT NULL,
    remarks TEXT,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trigger_customer_business_records_updated_at 
BEFORE UPDATE ON public.customer_business_records 
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.customer_business_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access customer_business_records" 
ON public.customer_business_records FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
);

CREATE POLICY "Users can read own customer_business_records" 
ON public.customer_business_records FOR SELECT 
USING (
    assigned_user_id = auth.uid()
);
