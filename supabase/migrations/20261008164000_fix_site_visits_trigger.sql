-- Fix the trigger function that was erroneously looking for NEW.user_id
CREATE OR REPLACE FUNCTION public.trg_site_visits_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_code TEXT;
BEGIN
    SELECT full_name, user_code INTO v_user_name, v_user_code FROM public.user_profiles WHERE id = COALESCE(NEW.created_by, NEW.assigned_user_id, NEW.associate_id);
    
    IF TG_OP = 'INSERT' THEN
        PERFORM public.notify_admins(
            'VISIT_CREATED',
            'New Visit Report',
            coalesce(v_user_code, '') || ' — ' || coalesce(v_user_name, '') || ' submitted a new visit report for ' || NEW.customer_name,
            'VISIT',
            NEW.id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status <> OLD.status THEN
            PERFORM public.notify_admins(
                'VISIT_' || NEW.status,
                'Visit Status Updated',
                'Visit report for ' || NEW.customer_name || ' is now ' || NEW.status,
                'VISIT',
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
