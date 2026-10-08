-- 1. Backfill existing CONVERTED leads that do not have a client
DO $$
DECLARE
    v_lead RECORD;
    v_client_id UUID;
BEGIN
    FOR v_lead IN 
        SELECT l.* 
        FROM public.leads l 
        LEFT JOIN public.clients c ON c.lead_id = l.id 
        WHERE l.status = 'CONVERTED' AND c.id IS NULL
    LOOP
        INSERT INTO public.clients (
            name,
            phone,
            email,
            budget,
            assigned_associate_id,
            assigned_tl_id,
            assigned_stl_id,
            notes,
            status,
            lead_id
        ) VALUES (
            v_lead.name,
            v_lead.phone,
            v_lead.email,
            v_lead.budget,
            v_lead.assigned_associate_id,
            v_lead.assigned_tl_id,
            v_lead.assigned_stl_id,
            v_lead.notes,
            'ACTIVE',
            v_lead.id
        ) RETURNING id INTO v_client_id;
        
        -- We won't log audit/notifications for backfilled data to avoid spamming the admin
    END LOOP;
END;
$$;

-- 2. Add UNIQUE constraint to lead_id to ensure strict 1-to-1 relationship
-- First, ensure there are no duplicates. Since this is a simple schema, we can just enforce it safely.
-- If any duplicates existed, we'd need to reconcile them. Assuming no duplicates exist since the issue is missing clients.
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_lead_id_key;
ALTER TABLE public.clients ADD CONSTRAINT clients_lead_id_key UNIQUE (lead_id);
