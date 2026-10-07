CREATE OR REPLACE FUNCTION public.notify_admins(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (
        recipient_user_id, type, title, message, entity_type, entity_id
    )
    SELECT id, p_type, p_title, p_message, p_entity_type, p_entity_id
    FROM public.user_profiles
    WHERE role = 'ADMIN' AND status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. associate_applications trigger
CREATE OR REPLACE FUNCTION public.trg_associate_applications_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.notify_admins(
            'NEW_APPLICATION',
            'New Associate Application',
            NEW.full_name || ' has submitted a new Associate application.',
            'APPLICATION',
            NEW.id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status <> OLD.status THEN
            PERFORM public.notify_admins(
                'APPLICATION_' || NEW.status,
                'Application ' || NEW.status,
                'Application for ' || NEW.full_name || ' was marked as ' || NEW.status,
                'APPLICATION',
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_associate_application_notify ON public.associate_applications;
CREATE TRIGGER on_associate_application_notify
    AFTER INSERT OR UPDATE ON public.associate_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_associate_applications_notify();

-- 2. user_profiles trigger (for TL/STL creation, status change)
CREATE OR REPLACE FUNCTION public.trg_user_profiles_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.notify_admins(
            'USER_CREATED',
            'New ' || replace(NEW.role, '_', ' ') || ' Account Created',
            'Account ' || coalesce(NEW.user_code, '') || ' was created for ' || NEW.full_name,
            'USER',
            NEW.id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status <> OLD.status THEN
            PERFORM public.notify_admins(
                'USER_' || NEW.status,
                'User ' || NEW.status,
                'User ' || coalesce(NEW.user_code, '') || ' — ' || NEW.full_name || ' is now ' || NEW.status,
                'USER',
                NEW.id
            );
        END IF;
        IF NEW.role <> OLD.role THEN
            PERFORM public.notify_admins(
                'ROLE_CHANGED',
                'User Role Changed',
                'User ' || coalesce(NEW.user_code, '') || ' — ' || NEW.full_name || ' role changed to ' || replace(NEW.role, '_', ' '),
                'USER',
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_profiles_notify ON public.user_profiles;
CREATE TRIGGER on_user_profiles_notify
    AFTER INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_user_profiles_notify();

-- 3. businesses trigger
CREATE OR REPLACE FUNCTION public.trg_businesses_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_assigned_name TEXT;
    v_assigned_code TEXT;
    v_old_assigned_name TEXT;
    v_old_assigned_code TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT full_name, user_code INTO v_assigned_name, v_assigned_code FROM public.user_profiles WHERE id = NEW.assigned_user_id;
        
        PERFORM public.notify_admins(
            'BUSINESS_CREATED',
            'New Business Record',
            'A new business record for ' || NEW.customer_name || ' was assigned to ' || coalesce(v_assigned_code, '') || ' — ' || coalesce(v_assigned_name, ''),
            'BUSINESS',
            NEW.id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.assigned_user_id <> OLD.assigned_user_id THEN
            SELECT full_name, user_code INTO v_assigned_name, v_assigned_code FROM public.user_profiles WHERE id = NEW.assigned_user_id;
            SELECT full_name, user_code INTO v_old_assigned_name, v_old_assigned_code FROM public.user_profiles WHERE id = OLD.assigned_user_id;
            
            PERFORM public.notify_admins(
                'BUSINESS_REASSIGNED',
                'Business Reassigned',
                'Business record for ' || NEW.customer_name || ' was reassigned from ' || coalesce(v_old_assigned_code, '') || ' — ' || coalesce(v_old_assigned_name, '') || ' to ' || coalesce(v_assigned_code, '') || ' — ' || coalesce(v_assigned_name, ''),
                'BUSINESS',
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_businesses_notify ON public.businesses;
CREATE TRIGGER on_businesses_notify
    AFTER INSERT OR UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_businesses_notify();

-- 4. site_visits trigger
CREATE OR REPLACE FUNCTION public.trg_site_visits_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_code TEXT;
BEGIN
    SELECT full_name, user_code INTO v_user_name, v_user_code FROM public.user_profiles WHERE id = NEW.user_id;
    
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

DROP TRIGGER IF EXISTS on_site_visits_notify ON public.site_visits;
CREATE TRIGGER on_site_visits_notify
    AFTER INSERT OR UPDATE ON public.site_visits
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_site_visits_notify();

-- 5. promotions trigger
CREATE OR REPLACE FUNCTION public.trg_promotions_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_code TEXT;
BEGIN
    SELECT full_name, user_code INTO v_user_name, v_user_code FROM public.user_profiles WHERE id = NEW.user_id;
    
    IF TG_OP = 'INSERT' THEN
        PERFORM public.notify_admins(
            'TL_PROMOTED',
            'Team Leader Promoted',
            coalesce(v_user_code, '') || ' — ' || coalesce(v_user_name, '') || ' was promoted to ' || replace(NEW.new_role, '_', ' '),
            'USER',
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_promotions_notify ON public.promotions;
CREATE TRIGGER on_promotions_notify
    AFTER INSERT ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_promotions_notify();
