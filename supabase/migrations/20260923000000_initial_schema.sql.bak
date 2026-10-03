-- ==============================================================================
-- KHU ESTATE - COMPLETE SUPABASE SCHEMA & CONFIGURATION
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS
-- ==============================================================================
CREATE TYPE app_role AS ENUM ('ADMIN', 'SENIOR_TL', 'TEAM_LEADER', 'ASSOCIATE');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DEACTIVATED');
CREATE TYPE associate_application_status AS ENUM (
    'PENDING_TL_REVIEW', 'PENDING_STL_REVIEW', 'APPROVED', 
    'DECLINED_BY_TL', 'DECLINED_BY_STL', 'ACCOUNT_CREATION_PENDING', 'ACCOUNT_CREATED'
);
CREATE TYPE session_status AS ENUM ('ACTIVE', 'ENDED', 'EXPIRED', 'FORCED_LOGOUT');
CREATE TYPE site_visit_status AS ENUM ('SCHEDULED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE deal_status AS ENUM ('LEAD', 'NEGOTIATION', 'CONFIRMED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'CANCELLED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE plot_status AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD');
CREATE TYPE commission_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
CREATE TYPE email_status AS ENUM ('QUEUED', 'SENT', 'FAILED', 'DELIVERED', 'BOUNCED');
CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- ==============================================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. TABLES
-- ==============================================================================

-- 4.1. user_profiles
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_code TEXT UNIQUE NOT NULL,
    role app_role NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    mobile TEXT,
    profile_photo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    date_of_birth DATE,
    joining_date DATE,
    status user_status NOT NULL DEFAULT 'PENDING',
    parent_user_id UUID REFERENCES public.user_profiles(id),
    senior_tl_id UUID REFERENCES public.user_profiles(id),
    team_id UUID,
    sponsor_id UUID REFERENCES public.user_profiles(id),
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    last_logout_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trigger_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.2. teams
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    team_code TEXT UNIQUE NOT NULL,
    senior_tl_id UUID REFERENCES public.user_profiles(id),
    team_leader_id UUID REFERENCES public.user_profiles(id),
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.3. sponsor_relationships
CREATE TABLE public.sponsor_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    referred_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    sponsor_code TEXT,
    joined_at TIMESTAMPTZ,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(sponsor_user_id, referred_user_id)
);

-- 4.4. associate_applications
CREATE TABLE public.associate_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT,
    message TEXT,
    source TEXT,
    referral_code TEXT,
    sponsor_id UUID REFERENCES public.user_profiles(id),
    assigned_tl_id UUID REFERENCES public.user_profiles(id),
    assigned_stl_id UUID REFERENCES public.user_profiles(id),
    status associate_application_status NOT NULL DEFAULT 'PENDING_TL_REVIEW',
    decline_reason TEXT,
    escalation_note TEXT,
    reviewed_by UUID REFERENCES public.user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    created_account_user_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_associate_applications_updated_at BEFORE UPDATE ON public.associate_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.5. application_history
CREATE TABLE public.application_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.associate_applications(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.user_profiles(id),
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    comment TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.6. login_sessions
CREATE TABLE public.login_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    logout_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status session_status NOT NULL DEFAULT 'ACTIVE',
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.7. login_activity
CREATE TABLE public.login_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    session_id UUID REFERENCES public.login_sessions(id),
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.8. notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.9. email_logs
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID REFERENCES public.user_profiles(id),
    recipient_email TEXT NOT NULL,
    template_name TEXT NOT NULL,
    subject TEXT,
    status email_status NOT NULL DEFAULT 'QUEUED',
    provider_message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.10. audit_logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.user_profiles(id),
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    entity_id UUID,
    previous_value JSONB,
    new_value JSONB,
    metadata JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.11. projects
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    developer_name TEXT,
    location TEXT,
    city TEXT,
    district TEXT,
    state TEXT,
    description TEXT,
    hero_image_url TEXT,
    site_plan_url TEXT,
    status TEXT,
    price_per_sqft NUMERIC(12,2),
    offer_title TEXT,
    offer_description TEXT,
    offer_start_date DATE,
    offer_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.12. plots
CREATE TABLE public.plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    plot_number TEXT NOT NULL,
    category TEXT NOT NULL,
    length_ft NUMERIC(10,2),
    width_ft NUMERIC(10,2),
    area_sqft NUMERIC(12,2),
    price_per_sqft NUMERIC(12,2),
    total_price NUMERIC(14,2),
    facing TEXT,
    road_width_ft NUMERIC(10,2),
    status plot_status NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, plot_number)
);
CREATE TRIGGER trigger_plots_updated_at BEFORE UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.13. plot_status_history
CREATE TABLE public.plot_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES public.plots(id),
    old_status plot_status,
    new_status plot_status NOT NULL,
    changed_by UUID REFERENCES public.user_profiles(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.14. leads
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    source TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    landing_page TEXT,
    project_id UUID REFERENCES public.projects(id),
    plot_id UUID REFERENCES public.plots(id),
    budget NUMERIC(14,2),
    assigned_associate_id UUID REFERENCES public.user_profiles(id),
    assigned_tl_id UUID REFERENCES public.user_profiles(id),
    assigned_stl_id UUID REFERENCES public.user_profiles(id),
    status TEXT NOT NULL,
    priority TEXT,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.15. clients
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    budget NUMERIC(14,2),
    preferred_location TEXT,
    property_interest TEXT,
    assigned_associate_id UUID REFERENCES public.user_profiles(id),
    assigned_tl_id UUID REFERENCES public.user_profiles(id),
    assigned_stl_id UUID REFERENCES public.user_profiles(id),
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.16. site_visits
CREATE TABLE public.site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_number TEXT UNIQUE NOT NULL,
    associate_id UUID NOT NULL REFERENCES public.user_profiles(id),
    tl_id UUID REFERENCES public.user_profiles(id),
    stl_id UUID REFERENCES public.user_profiles(id),
    client_id UUID REFERENCES public.clients(id),
    lead_id UUID REFERENCES public.leads(id),
    project_id UUID REFERENCES public.projects(id),
    plot_id UUID REFERENCES public.plots(id),
    visit_date DATE NOT NULL,
    visit_time TIME,
    location TEXT,
    number_of_visitors INTEGER,
    status site_visit_status,
    client_interest_level TEXT,
    remarks TEXT,
    next_follow_up_date DATE,
    deal_potential TEXT,
    closure_status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_site_visits_updated_at BEFORE UPDATE ON public.site_visits FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.17. businesses
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_number TEXT UNIQUE NOT NULL,
    lead_id UUID REFERENCES public.leads(id),
    client_id UUID REFERENCES public.clients(id),
    project_id UUID REFERENCES public.projects(id),
    plot_id UUID REFERENCES public.plots(id),
    associate_id UUID NOT NULL REFERENCES public.user_profiles(id),
    tl_id UUID REFERENCES public.user_profiles(id),
    stl_id UUID REFERENCES public.user_profiles(id),
    deal_type TEXT,
    deal_amount NUMERIC(14,2) NOT NULL,
    deal_date DATE,
    expected_closing_date DATE,
    status TEXT NOT NULL,
    payment_status TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.18. business_history
CREATE TABLE public.business_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id),
    actor_user_id UUID REFERENCES public.user_profiles(id),
    action TEXT,
    old_status TEXT,
    new_status TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.19. bookings
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number TEXT UNIQUE NOT NULL,
    business_id UUID REFERENCES public.businesses(id),
    client_id UUID REFERENCES public.clients(id),
    project_id UUID REFERENCES public.projects(id),
    plot_id UUID REFERENCES public.plots(id),
    associate_id UUID REFERENCES public.user_profiles(id),
    tl_id UUID REFERENCES public.user_profiles(id),
    stl_id UUID REFERENCES public.user_profiles(id),
    booking_amount NUMERIC(14,2),
    total_property_value NUMERIC(14,2),
    booking_date DATE,
    status booking_status,
    payment_status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.20. payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number TEXT UNIQUE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    business_id UUID REFERENCES public.businesses(id),
    amount NUMERIC(14,2) NOT NULL,
    payment_date DATE,
    payment_method TEXT,
    reference_number TEXT,
    status TEXT,
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.21. commission_rules
CREATE TABLE public.commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role app_role NOT NULL,
    percentage NUMERIC(6,3) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.22. commissions
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commission_number TEXT UNIQUE NOT NULL,
    business_id UUID NOT NULL REFERENCES public.businesses(id),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    role app_role NOT NULL,
    commission_percentage NUMERIC(6,3) NOT NULL,
    base_amount NUMERIC(14,2) NOT NULL,
    commission_amount NUMERIC(14,2) NOT NULL,
    status commission_status NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    notes TEXT,
    UNIQUE(business_id, user_id, role)
);

-- 4.23. income_transactions
CREATE TABLE public.income_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    income_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    business_id UUID REFERENCES public.businesses(id),
    source TEXT,
    amount NUMERIC(14,2),
    commission NUMERIC(14,2),
    status TEXT,
    payment_date DATE,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.24. expenses
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    added_by UUID REFERENCES public.user_profiles(id),
    receipt_url TEXT,
    approval_status TEXT,
    approved_by UUID REFERENCES public.user_profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.25. targets
CREATE TABLE public.targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id),
    role app_role,
    period_type TEXT,
    period_start DATE,
    period_end DATE,
    target_amount NUMERIC(14,2),
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.26. documents
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID REFERENCES public.user_profiles(id),
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    status document_status,
    version INTEGER DEFAULT 1,
    uploaded_by UUID REFERENCES public.user_profiles(id),
    approved_by UUID REFERENCES public.user_profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.27. kyc_records
CREATE TABLE public.kyc_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.user_profiles(id),
    pan TEXT,
    aadhaar_reference TEXT,
    kyc_status TEXT,
    identity_document_id UUID,
    address_document_id UUID,
    bank_document_id UUID,
    verified_by UUID REFERENCES public.user_profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.28. website_settings
CREATE TABLE public.website_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.user_profiles(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_website_settings_updated_at BEFORE UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.29. testimonials
CREATE TABLE public.testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    content TEXT NOT NULL,
    photo_url TEXT,
    status BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.30. system_settings
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.user_profiles(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trigger_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ==============================================================================
-- 5. INDEXES
-- ==============================================================================
CREATE INDEX idx_user_profiles_auth_id ON public.user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_user_code ON public.user_profiles(user_code);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_parent ON public.user_profiles(parent_user_id);
CREATE INDEX idx_user_profiles_stl ON public.user_profiles(senior_tl_id);
CREATE INDEX idx_user_profiles_status ON public.user_profiles(status);

CREATE INDEX idx_assoc_apps_status ON public.associate_applications(status);
CREATE INDEX idx_assoc_apps_assigned_tl ON public.associate_applications(assigned_tl_id);
CREATE INDEX idx_assoc_apps_assigned_stl ON public.associate_applications(assigned_stl_id);
CREATE INDEX idx_assoc_apps_created_at ON public.associate_applications(created_at);

CREATE INDEX idx_login_sessions_user_id ON public.login_sessions(user_id);
CREATE INDEX idx_login_sessions_status ON public.login_sessions(status);
CREATE INDEX idx_login_activity_user_id ON public.login_activity(user_id);

CREATE INDEX idx_leads_assigned ON public.leads(assigned_associate_id, assigned_tl_id, assigned_stl_id);
CREATE INDEX idx_plots_project_status ON public.plots(project_id, status);
CREATE INDEX idx_site_visits_assigned ON public.site_visits(associate_id, tl_id, stl_id);
CREATE INDEX idx_businesses_assigned ON public.businesses(associate_id, tl_id, stl_id);
CREATE INDEX idx_commissions_business_user ON public.commissions(business_id, user_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_user_id, is_read);


-- ==============================================================================
-- 6. FUNCTIONS (User Code & Sequence Generators)
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_user_code(role_type app_role) RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    seq_val INT;
    new_code TEXT;
BEGIN
    IF role_type = 'ADMIN' THEN prefix := 'ADMIN';
    ELSIF role_type = 'SENIOR_TL' THEN prefix := 'STL';
    ELSIF role_type = 'TEAM_LEADER' THEN prefix := 'TL';
    ELSE prefix := 'ASSOC';
    END IF;
    
    -- Safe concurrent generation logic would typically use a sequence
    -- For Supabase simple compatibility, a lock or sequence table is used.
    -- Assuming a sequence exists (we create them below):
    EXECUTE 'SELECT nextval(''' || prefix || '_seq'')' INTO seq_val;
    new_code := prefix || LPAD(seq_val::TEXT, 3, '0');
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE ADMIN_seq START 1;
CREATE SEQUENCE STL_seq START 1;
CREATE SEQUENCE TL_seq START 1;
CREATE SEQUENCE ASSOC_seq START 1;


-- ==============================================================================
-- 7. SUPABASE RLS (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;

-- Helper Functions for RLS
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_role() RETURNS app_role AS $$
  SELECT role FROM public.user_profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_profile_id() RETURNS UUID AS $$
  SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- RLS: user_profiles
-- ------------------------------------------------------------------------------
-- Admins see all
CREATE POLICY "Admin full access user_profiles" ON public.user_profiles FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Users see themselves
CREATE POLICY "Users see own profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- Senior TL sees their TLs and Associates
CREATE POLICY "STL sees team" ON public.user_profiles FOR SELECT TO authenticated USING (
  senior_tl_id = get_my_profile_id() AND get_my_role() = 'SENIOR_TL'
);

-- Team Leader sees their Associates
CREATE POLICY "TL sees team" ON public.user_profiles FOR SELECT TO authenticated USING (
  parent_user_id = get_my_profile_id() AND get_my_role() = 'TEAM_LEADER'
);

-- ------------------------------------------------------------------------------
-- RLS: associate_applications
-- ------------------------------------------------------------------------------
-- Public can INSERT applications
CREATE POLICY "Public insert applications" ON public.associate_applications FOR INSERT TO public WITH CHECK (true);

-- Admin sees all
CREATE POLICY "Admin read applications" ON public.associate_applications FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin update applications" ON public.associate_applications FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- TL sees assigned applications
CREATE POLICY "TL read assigned applications" ON public.associate_applications FOR SELECT TO authenticated USING (
  assigned_tl_id = get_my_profile_id() AND get_my_role() = 'TEAM_LEADER'
);
CREATE POLICY "TL update assigned applications" ON public.associate_applications FOR UPDATE TO authenticated USING (
  assigned_tl_id = get_my_profile_id() AND get_my_role() = 'TEAM_LEADER'
) WITH CHECK (
  assigned_tl_id = get_my_profile_id() AND get_my_role() = 'TEAM_LEADER'
);

-- STL sees assigned applications
CREATE POLICY "STL read assigned applications" ON public.associate_applications FOR SELECT TO authenticated USING (
  assigned_stl_id = get_my_profile_id() AND get_my_role() = 'SENIOR_TL'
);
CREATE POLICY "STL update assigned applications" ON public.associate_applications FOR UPDATE TO authenticated USING (
  assigned_stl_id = get_my_profile_id() AND get_my_role() = 'SENIOR_TL'
) WITH CHECK (
  assigned_stl_id = get_my_profile_id() AND get_my_role() = 'SENIOR_TL'
);

-- ------------------------------------------------------------------------------
-- RLS: audit_logs (Append Only)
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Service insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RLS: projects & plots (Public Read)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read projects" ON public.projects FOR SELECT TO public USING (true);
CREATE POLICY "Admin manage projects" ON public.projects FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read plots" ON public.plots FOR SELECT TO public USING (true);
CREATE POLICY "Admin manage plots" ON public.plots FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());


-- ==============================================================================
-- 8. INITIAL SEED DATA
-- ==============================================================================

-- Seed Project
INSERT INTO public.projects (id, name, slug, developer_name, location, city, district, state, description, price_per_sqft, status)
VALUES (
    uuid_generate_v4(),
    'Maa Kundwasini Nagar',
    'maa-kundwasini-nagar',
    'K.H.U. DEVELOPERS PRIVATE LIMITED',
    'Robertsganj',
    'Robertsganj',
    'Sonbhadra',
    'Uttar Pradesh',
    'Premium residential plots in the heart of Sonbhadra with 30ft and 40ft wide roads.',
    899.00,
    'ACTIVE'
) ON CONFLICT (slug) DO NOTHING;

-- Seed Commission Rules
INSERT INTO public.commission_rules (role, percentage, active) VALUES 
('ASSOCIATE', 5.0, true),
('TEAM_LEADER', 3.0, true),
('SENIOR_TL', 2.0, true);

-- Note: The initial Admin auth account MUST be created via Supabase Auth (Sign Up).
-- Then insert into user_profiles manually or via auth trigger:
-- INSERT INTO public.user_profiles (auth_user_id, user_code, role, full_name, email, status, must_change_password)
-- VALUES ('<supabase_auth_uuid>', 'ADMIN001', 'ADMIN', 'System Admin', 'admin@khuestate.com', 'ACTIVE', false);


-- ==============================================================================
-- 9. VERIFICATION QUERIES
-- ==============================================================================
/*
-- Run these to verify your setup:

-- 1. Check Tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Check Enums
SELECT typname, enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid;

-- 3. Check RLS enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r';

-- 4. Test RLS as anonymous (Should succeed for insert, fail for select)
-- set role anon;
-- INSERT INTO associate_applications (application_number, full_name, email, phone) VALUES ('APP-TEST', 'Test', 'test@test.com', '123');
-- SELECT * FROM associate_applications; -- Should return 0 rows

*/
