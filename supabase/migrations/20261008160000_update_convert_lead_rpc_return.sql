-- 1. Modify RPC for atomic lead conversion to return structured JSON
DROP FUNCTION IF EXISTS public.convert_lead_to_client(UUID, UUID);
DROP FUNCTION IF EXISTS public.convert_lead_to_client(UUID);

CREATE OR REPLACE FUNCTION public.convert_lead_to_client(p_lead_id UUID, p_actor_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_lead RECORD;
    v_client_id UUID;
BEGIN
    -- Check if a client already exists for this lead
    SELECT id INTO v_client_id FROM public.clients WHERE lead_id = p_lead_id LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        -- If already converted, ensure lead status is CONVERTED
        UPDATE public.leads SET status = 'CONVERTED' WHERE id = p_lead_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'lead_id', p_lead_id,
            'client_id', v_client_id,
            'already_exists', true
        );
    END IF;

    -- Fetch the lead
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
    
    IF v_lead IS NULL THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;

    -- Create corresponding record in clients
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
        p_lead_id
    ) RETURNING id INTO v_client_id;

    -- Update lead status
    UPDATE public.leads SET status = 'CONVERTED' WHERE id = p_lead_id;

    -- Audit Log
    IF p_actor_user_id IS NOT NULL THEN
        INSERT INTO public.audit_logs (actor_user_id, action, module, entity_id, previous_value, new_value)
        VALUES (
            p_actor_user_id,
            'ADMIN_CONVERTED_LEAD_TO_CLIENT',
            'LEADS',
            p_lead_id,
            jsonb_build_object('status', v_lead.status),
            jsonb_build_object('status', 'CONVERTED', 'client_id', v_client_id)
        );
        
        -- Notification
        PERFORM public.notify_admins(
            'LEAD_CONVERTED',
            'Lead Converted',
            v_lead.name || ' has been converted from Lead to Client.',
            'CLIENT',
            v_client_id
        );
    END IF;

    -- Refresh schema cache manually if needed (safe operation)
    NOTIFY pgrst, 'reload schema';

    RETURN jsonb_build_object(
        'success', true,
        'lead_id', p_lead_id,
        'client_id', v_client_id,
        'already_exists', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
