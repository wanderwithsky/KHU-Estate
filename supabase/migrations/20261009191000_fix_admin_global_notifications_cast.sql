-- Fix replace() function signature for enum type
CREATE OR REPLACE FUNCTION public.trg_user_profiles_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.notify_admins(
            'USER_CREATED',
            'New ' || replace(NEW.role::text, '_', ' ') || ' Account Created',
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
                'User ' || coalesce(NEW.user_code, '') || ' — ' || NEW.full_name || ' role changed to ' || replace(NEW.role::text, '_', ' '),
                'USER',
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
            coalesce(v_user_code, '') || ' — ' || coalesce(v_user_name, '') || ' was promoted to ' || replace(NEW.new_role::text, '_', ' '),
            'USER',
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
