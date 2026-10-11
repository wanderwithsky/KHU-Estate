-- ====================================================================
-- Migration: Activate Global Notifications, Hierarchy Rules & Realtime
-- ====================================================================

-- 1. Ensure RLS is enabled and define clean policies for public.notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read/update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admin full access notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications select own" ON public.notifications;
DROP POLICY IF EXISTS "Notifications update own" ON public.notifications;
DROP POLICY IF EXISTS "Notifications insert authenticated" ON public.notifications;
DROP POLICY IF EXISTS "Notifications delete own" ON public.notifications;

-- SELECT policy: user reads only their own notifications
CREATE POLICY "Notifications select own"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    recipient_user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
);

-- UPDATE policy: user updates only their own notifications (e.g. is_read)
CREATE POLICY "Notifications update own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
    recipient_user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
)
WITH CHECK (
    recipient_user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
);

-- INSERT policy: authenticated users / functions can insert
CREATE POLICY "Notifications insert authenticated"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- DELETE policy: user can delete their own notifications
CREATE POLICY "Notifications delete own"
ON public.notifications
FOR DELETE
TO authenticated
USING (
    recipient_user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
);

-- 2. Configure Realtime publication and replica identity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 3. Core safe notification helper
CREATE OR REPLACE FUNCTION public.create_notification(
    p_recipient_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    IF p_recipient_id IS NULL OR p_message IS NULL THEN
        RETURN;
    END IF;

    -- Avoid identical notifications within 5 minutes
    IF EXISTS (
        SELECT 1 FROM public.notifications
        WHERE recipient_user_id = p_recipient_id
          AND type = p_type
          AND entity_type IS NOT DISTINCT FROM p_entity_type
          AND entity_id IS NOT DISTINCT FROM p_entity_id
          AND created_at > now() - INTERVAL '5 minutes'
    ) THEN
        RETURN;
    END IF;

    INSERT INTO public.notifications (
        recipient_user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        is_read
    ) VALUES (
        p_recipient_id,
        p_type,
        p_title,
        p_message,
        p_entity_type,
        p_entity_id,
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Notify all active Admins helper
CREATE OR REPLACE FUNCTION public.notify_admins(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    IF p_message IS NULL THEN
        RETURN;
    END IF;

    FOR r IN SELECT id FROM public.user_profiles WHERE role = 'ADMIN' AND status = 'ACTIVE' LOOP
        PERFORM public.create_notification(r.id, p_type, p_title, p_message, p_entity_type, p_entity_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Promotions trigger (Mandatory STL Promotion Notification)
CREATE OR REPLACE FUNCTION public.trg_promotions_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_code TEXT;
BEGIN
    SELECT full_name, user_code INTO v_user_name, v_user_code FROM public.user_profiles WHERE id = NEW.user_id;

    IF TG_OP = 'INSERT' THEN
        -- Notify promoted user with required message
        PERFORM public.create_notification(
            NEW.user_id,
            'PROMOTION_CONGRATULATIONS',
            'Congratulations! You''ve Been Promoted to Senior Team Leader (STL)!',
            'Congratulations! You''ve Been Promoted to Senior Team Leader (STL)!',
            'PROMOTION',
            NEW.id
        );

        -- Notify Admins
        PERFORM public.notify_admins(
            'TL_PROMOTED',
            'Team Leader Promoted',
            coalesce(v_user_code, '') || ' — ' || coalesce(v_user_name, '') || ' was promoted to Senior Team Leader (STL).',
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

-- Update existing promotion notification for Rohan Singh to exact requested text
UPDATE public.notifications
SET title = 'Congratulations! You''ve Been Promoted to Senior Team Leader (STL)!',
    message = 'Congratulations! You''ve Been Promoted to Senior Team Leader (STL)!',
    is_read = false
WHERE type = 'PROMOTION_CONGRATULATIONS'
  AND recipient_user_id = '8a602eaa-4766-4573-8238-491960ace60e';

-- 6. Businesses trigger (Admin-assigned business with hierarchy notifications)
CREATE OR REPLACE FUNCTION public.trg_businesses_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_assigned RECORD;
    v_creator_role TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.assigned_user_id IS NOT NULL THEN
            SELECT id, role, parent_user_id, senior_tl_id, full_name, user_code
            INTO v_assigned
            FROM public.user_profiles WHERE id = NEW.assigned_user_id;

            -- 1. Notify assigned user
            PERFORM public.create_notification(
                NEW.assigned_user_id,
                'BUSINESS_ASSIGNED',
                'New Business Assigned',
                'Business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.deal_amount, 0) || ') has been assigned to you.',
                'BUSINESS',
                NEW.id
            );

            -- 2. If Associate, notify reporting TL & STL
            IF v_assigned.role = 'ASSOCIATE' THEN
                IF v_assigned.parent_user_id IS NOT NULL AND v_assigned.parent_user_id <> NEW.assigned_user_id THEN
                    PERFORM public.create_notification(
                        v_assigned.parent_user_id,
                        'DOWNLINE_BUSINESS',
                        'Downline Business Assigned',
                        'Business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.deal_amount, 0) || ') was assigned to Associate ' || coalesce(v_assigned.full_name, '') || '.',
                        'BUSINESS',
                        NEW.id
                    );
                END IF;

                IF v_assigned.senior_tl_id IS NOT NULL AND v_assigned.senior_tl_id <> NEW.assigned_user_id THEN
                    PERFORM public.create_notification(
                        v_assigned.senior_tl_id,
                        'TEAM_BUSINESS',
                        'Team Business Assigned',
                        'Business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.deal_amount, 0) || ') was assigned to downline Associate ' || coalesce(v_assigned.full_name, '') || '.',
                        'BUSINESS',
                        NEW.id
                    );
                END IF;
            -- 3. If TL, notify reporting STL
            ELSIF v_assigned.role = 'TEAM_LEADER' THEN
                IF coalesce(v_assigned.senior_tl_id, v_assigned.parent_user_id) IS NOT NULL THEN
                    PERFORM public.create_notification(
                        coalesce(v_assigned.senior_tl_id, v_assigned.parent_user_id),
                        'TEAM_BUSINESS',
                        'Team Business Assigned',
                        'Business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.deal_amount, 0) || ') was assigned to Team Leader ' || coalesce(v_assigned.full_name, '') || '.',
                        'BUSINESS',
                        NEW.id
                    );
                END IF;
            END IF;

            -- 4. Notify Admins
            PERFORM public.notify_admins(
                'BUSINESS_CREATED',
                'New Business Record',
                'Business for ' || coalesce(NEW.customer_name, 'Client') || ' was assigned to ' || coalesce(v_assigned.user_code, '') || ' — ' || coalesce(v_assigned.full_name, '') || '.',
                'BUSINESS',
                NEW.id
            );

            -- 5. Check target achievement
            PERFORM public.check_tl_target_achieved(NEW.assigned_user_id);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.assigned_user_id <> OLD.assigned_user_id THEN
            -- Notify newly assigned user
            PERFORM public.create_notification(
                NEW.assigned_user_id,
                'BUSINESS_REASSIGNED',
                'Business Assigned to You',
                'Business for ' || coalesce(NEW.customer_name, 'Client') || ' has been reassigned to you.',
                'BUSINESS',
                NEW.id
            );

            -- Notify previously assigned user
            PERFORM public.create_notification(
                OLD.assigned_user_id,
                'BUSINESS_REASSIGNED',
                'Business Reassigned',
                'Business for ' || coalesce(OLD.customer_name, 'Client') || ' has been reassigned.',
                'BUSINESS',
                NEW.id
            );

            PERFORM public.notify_admins(
                'BUSINESS_REASSIGNED',
                'Business Reassigned',
                'Business for ' || coalesce(NEW.customer_name, 'Client') || ' was reassigned.',
                'BUSINESS',
                NEW.id
            );
        END IF;

        IF NEW.deal_amount <> OLD.deal_amount OR NEW.assigned_user_id <> OLD.assigned_user_id THEN
             PERFORM public.check_tl_target_achieved(NEW.assigned_user_id);
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

-- 7. Personal Business trigger on stl_self_performance (Associate / TL / STL submissions)
CREATE OR REPLACE FUNCTION public.trg_stl_self_performance_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_user RECORD;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT id, role, parent_user_id, senior_tl_id, full_name, user_code
        INTO v_user
        FROM public.user_profiles WHERE id = NEW.stl_id;

        -- 1. Notify submitter
        PERFORM public.create_notification(
            NEW.stl_id,
            'PERSONAL_BUSINESS_SUBMITTED',
            'Business Submission Recorded',
            'Your business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.total_amount, 0) || ') has been saved.',
            'BUSINESS',
            NEW.id
        );

        -- 2. If Associate, notify reporting TL & STL
        IF v_user.role = 'ASSOCIATE' THEN
            IF v_user.parent_user_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_user.parent_user_id,
                    'ASSOCIATE_BUSINESS_SUBMITTED',
                    'Associate Business Submitted',
                    'Associate ' || coalesce(v_user.full_name, '') || ' submitted personal business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.total_amount, 0) || ').',
                    'BUSINESS',
                    NEW.id
                );
            END IF;

            IF v_user.senior_tl_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_user.senior_tl_id,
                    'TEAM_BUSINESS_SUBMITTED',
                    'Team Business Submitted',
                    'Associate ' || coalesce(v_user.full_name, '') || ' in your team submitted business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.total_amount, 0) || ').',
                    'BUSINESS',
                    NEW.id
                );
            END IF;

        -- 3. If TL, notify reporting STL
        ELSIF v_user.role = 'TEAM_LEADER' THEN
            IF coalesce(v_user.senior_tl_id, v_user.parent_user_id) IS NOT NULL THEN
                PERFORM public.create_notification(
                    coalesce(v_user.senior_tl_id, v_user.parent_user_id),
                    'TL_BUSINESS_SUBMITTED',
                    'Team Leader Business Submitted',
                    'Team Leader ' || coalesce(v_user.full_name, '') || ' submitted business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.total_amount, 0) || ').',
                    'BUSINESS',
                    NEW.id
                );
            END IF;
        END IF;

        -- 4. Notify Admins
        PERFORM public.notify_admins(
            'SELF_BUSINESS_SUBMITTED',
            'Personal Business Submitted',
            coalesce(v_user.full_name, 'User') || ' (' || coalesce(v_user.user_code, '') || ') submitted business for ' || coalesce(NEW.customer_name, 'Client') || ' (₹' || coalesce(NEW.total_amount, 0) || ').',
            'BUSINESS',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_stl_self_performance_notify ON public.stl_self_performance;
CREATE TRIGGER on_stl_self_performance_notify
    AFTER INSERT ON public.stl_self_performance
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_stl_self_performance_notify();

-- 8. Site visits trigger (Admin-scheduled visits & submitted reports with hierarchy)
CREATE OR REPLACE FUNCTION public.trg_site_visits_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_assigned RECORD;
    v_actor_id UUID;
    v_actor RECORD;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- When visit is scheduled for a user
        IF NEW.assigned_user_id IS NOT NULL THEN
            SELECT id, role, parent_user_id, senior_tl_id, full_name, user_code
            INTO v_assigned
            FROM public.user_profiles WHERE id = NEW.assigned_user_id;

            -- 1. Notify assigned user
            PERFORM public.create_notification(
                NEW.assigned_user_id,
                'VISIT_SCHEDULED',
                'New Site Visit Scheduled',
                'A site visit for ' || coalesce(NEW.customer_name, 'Customer') || ' has been scheduled on ' || NEW.visit_date || '.',
                'VISIT',
                NEW.id
            );

            -- 2. If Associate, notify their TL
            IF v_assigned.role = 'ASSOCIATE' AND v_assigned.parent_user_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_assigned.parent_user_id,
                    'DOWNLINE_VISIT_SCHEDULED',
                    'Downline Visit Scheduled',
                    'A site visit for ' || coalesce(NEW.customer_name, 'Customer') || ' was scheduled for Associate ' || coalesce(v_assigned.full_name, '') || '.',
                    'VISIT',
                    NEW.id
                );
            END IF;
        END IF;

        -- If visit was created directly as COMPLETED (e.g. TL or Associate Create Visit report)
        IF NEW.status = 'COMPLETED' THEN
            v_actor_id := coalesce(NEW.created_by, NEW.assigned_user_id);
            IF v_actor_id IS NOT NULL THEN
                SELECT id, role, parent_user_id, senior_tl_id, full_name, user_code
                INTO v_actor
                FROM public.user_profiles WHERE id = v_actor_id;

                IF v_actor.role = 'ASSOCIATE' THEN
                    IF v_actor.parent_user_id IS NOT NULL THEN
                        PERFORM public.create_notification(
                            v_actor.parent_user_id,
                            'ASSOCIATE_VISIT_COMPLETED',
                            'Associate Visit Completed',
                            'Associate ' || coalesce(v_actor.full_name, '') || ' completed a visit for ' || coalesce(NEW.customer_name, 'Customer') || '.',
                            'VISIT',
                            NEW.id
                        );
                    END IF;
                    IF v_actor.senior_tl_id IS NOT NULL THEN
                        PERFORM public.create_notification(
                            v_actor.senior_tl_id,
                            'TEAM_VISIT_COMPLETED',
                            'Team Visit Completed',
                            'Associate ' || coalesce(v_actor.full_name, '') || ' completed a visit for ' || coalesce(NEW.customer_name, 'Customer') || '.',
                            'VISIT',
                            NEW.id
                        );
                    END IF;
                ELSIF v_actor.role = 'TEAM_LEADER' THEN
                    IF coalesce(v_actor.senior_tl_id, v_actor.parent_user_id) IS NOT NULL THEN
                        PERFORM public.create_notification(
                            coalesce(v_actor.senior_tl_id, v_actor.parent_user_id),
                            'TL_VISIT_COMPLETED',
                            'TL Visit Completed',
                            'Team Leader ' || coalesce(v_actor.full_name, '') || ' completed a visit for ' || coalesce(NEW.customer_name, 'Customer') || '.',
                            'VISIT',
                            NEW.id
                        );
                    END IF;
                END IF;

                -- Notify Admins
                PERFORM public.notify_admins(
                    'VISIT_COMPLETED',
                    'Visit Report Submitted',
                    coalesce(v_actor.full_name, 'User') || ' submitted a completed visit report for ' || coalesce(NEW.customer_name, 'Customer') || '.',
                    'VISIT',
                    NEW.id
                );
            END IF;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status <> OLD.status AND NEW.status = 'COMPLETED' THEN
            v_actor_id := coalesce(NEW.created_by, NEW.assigned_user_id);
            IF v_actor_id IS NOT NULL THEN
                SELECT id, role, parent_user_id, senior_tl_id, full_name, user_code
                INTO v_actor
                FROM public.user_profiles WHERE id = v_actor_id;

                IF v_actor.role = 'ASSOCIATE' THEN
                    IF v_actor.parent_user_id IS NOT NULL THEN
                        PERFORM public.create_notification(
                            v_actor.parent_user_id,
                            'ASSOCIATE_VISIT_COMPLETED',
                            'Associate Visit Completed',
                            'Associate ' || coalesce(v_actor.full_name, '') || ' completed a visit for ' || coalesce(NEW.customer_name, 'Customer') || '.',
                            'VISIT',
                            NEW.id
                        );
                    END IF;
                    IF v_actor.senior_tl_id IS NOT NULL THEN
                        PERFORM public.create_notification(
                            v_actor.senior_tl_id,
                            'TEAM_VISIT_COMPLETED',
                            'Team Visit Completed',
                            'Associate ' || coalesce(v_actor.full_name, '') || ' completed a visit for ' || coalesce(NEW.customer_name, 'Customer') || '.',
                            'VISIT',
                            NEW.id
                        );
                    END IF;
                ELSIF v_actor.role = 'TEAM_LEADER' THEN
                    IF coalesce(v_actor.senior_tl_id, v_actor.parent_user_id) IS NOT NULL THEN
                        PERFORM public.create_notification(
                            coalesce(v_actor.senior_tl_id, v_actor.parent_user_id),
                            'TL_VISIT_COMPLETED',
                            'TL Visit Completed',
                            'Team Leader ' || coalesce(v_actor.full_name, '') || ' completed a visit for ' || coalesce(NEW.customer_name, 'Customer') || '.',
                            'VISIT',
                            NEW.id
                        );
                    END IF;
                END IF;

                -- Notify Admins
                PERFORM public.notify_admins(
                    'VISIT_COMPLETED',
                    'Visit Report Completed',
                    coalesce(v_actor.full_name, 'User') || ' submitted a completed visit report for ' || coalesce(NEW.customer_name, 'Customer') || '.',
                    'VISIT',
                    NEW.id
                );
            END IF;
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

-- 9. Commissions trigger
CREATE OR REPLACE FUNCTION public.trg_commissions_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
BEGIN
    SELECT full_name INTO v_user_name FROM public.user_profiles WHERE id = NEW.user_id;

    IF TG_OP = 'INSERT' THEN
        -- Notify commission earner
        PERFORM public.create_notification(
            NEW.user_id,
            'COMMISSION_GENERATED',
            'Commission Update',
            'A commission of ₹' || coalesce(NEW.commission_amount, 0) || ' has been recorded (' || coalesce(NEW.status::text, 'PENDING') || ').',
            'COMMISSION',
            NEW.id
        );

        -- Notify Admins
        PERFORM public.notify_admins(
            'COMMISSION_CREATED',
            'Commission Recorded',
            'Commission of ₹' || coalesce(NEW.commission_amount, 0) || ' recorded for ' || coalesce(v_user_name, 'User') || '.',
            'COMMISSION',
            NEW.id
        );

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status <> OLD.status THEN
            PERFORM public.create_notification(
                NEW.user_id,
                'COMMISSION_STATUS_UPDATED',
                'Commission ' || replace(NEW.status::text, '_', ' '),
                'Your commission of ₹' || coalesce(NEW.commission_amount, 0) || ' is now ' || replace(NEW.status::text, '_', ' ') || '.',
                'COMMISSION',
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_commissions_notify ON public.commissions;
CREATE TRIGGER on_commissions_notify
    AFTER INSERT OR UPDATE ON public.commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_commissions_notify();

-- 10. Associate applications trigger
CREATE OR REPLACE FUNCTION public.trg_associate_applications_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Notify assigned/referred TL
        IF NEW.assigned_tl_id IS NOT NULL THEN
            PERFORM public.create_notification(
                NEW.assigned_tl_id,
                'NEW_ASSOCIATE_APPLICATION',
                'New Associate Application',
                coalesce(NEW.full_name, 'Applicant') || ' submitted an application to join your team.',
                'APPLICATION',
                NEW.id
            );
        END IF;

        -- Notify assigned/referred STL
        IF NEW.assigned_stl_id IS NOT NULL THEN
            PERFORM public.create_notification(
                NEW.assigned_stl_id,
                'NEW_TEAM_APPLICATION',
                'New Team Application',
                coalesce(NEW.full_name, 'Applicant') || ' submitted an application under your STL hierarchy.',
                'APPLICATION',
                NEW.id
            );
        END IF;

        -- Notify Admins
        PERFORM public.notify_admins(
            'NEW_APPLICATION',
            'New Associate Application',
            coalesce(NEW.full_name, 'Applicant') || ' has submitted an Associate application.',
            'APPLICATION',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_associate_application_notify ON public.associate_applications;
CREATE TRIGGER on_associate_application_notify
    AFTER INSERT OR UPDATE ON public.associate_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_associate_applications_notify();
