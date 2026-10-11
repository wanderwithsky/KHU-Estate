-- Migration: Fix promoted STL downline hierarchy and allow TL/STL to read downline self performance
-- 1. Ensure downline members of promoted STLs have senior_tl_id pointing to their promoted STL
UPDATE public.user_profiles
SET senior_tl_id = parent_user_id, updated_at = now()
WHERE parent_user_id IN (SELECT id FROM public.user_profiles WHERE role = 'SENIOR_TL')
  AND (senior_tl_id IS DISTINCT FROM parent_user_id);

-- 2. Update promote_team_leader RPC to automatically maintain downline senior_tl_id
CREATE OR REPLACE FUNCTION public.promote_team_leader(
    p_user_id UUID,
    p_achieved_amount NUMERIC DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_admin RECORD;
    v_existing_prom RECORD;
    v_self_amount NUMERIC := 0;
    v_team_amount NUMERIC := 0;
    v_total_amount NUMERIC := 0;
    v_prom_id UUID;
BEGIN
    -- 1. Verify caller is ADMIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can promote team leaders';
    END IF;

    SELECT * INTO v_admin FROM public.user_profiles WHERE auth_user_id = auth.uid();

    -- 2. Fetch target user
    SELECT * INTO v_user FROM public.user_profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Check if already promoted or not a Team Leader
    IF v_user.role = 'SENIOR_TL' THEN
        SELECT * INTO v_existing_prom FROM public.promotions WHERE user_id = p_user_id ORDER BY promotion_date DESC LIMIT 1;
        IF FOUND THEN
            RETURN jsonb_build_object('success', false, 'message', 'This Team Leader has already been promoted to Senior Team Leader.');
        END IF;
    ELSIF v_user.role != 'TEAM_LEADER' THEN
        RAISE EXCEPTION 'Only Team Leaders can be promoted to Senior Team Leader';
    END IF;

    -- Check if a promotion record already exists
    SELECT * INTO v_existing_prom FROM public.promotions WHERE user_id = p_user_id;
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'A promotion record already exists for this user.');
    END IF;

    -- 3. Determine achieved amount
    IF p_achieved_amount IS NOT NULL AND p_achieved_amount >= 5000000 THEN
        v_total_amount := p_achieved_amount;
    ELSE
        -- Calculate Self Business:
        SELECT COALESCE(SUM(deal_amount), 0) INTO v_self_amount
        FROM public.businesses
        WHERE (assigned_user_id = p_user_id OR associate_id = p_user_id);

        v_self_amount := v_self_amount + (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM public.stl_self_performance
            WHERE stl_id = p_user_id
        );

        -- Calculate Team Business (downline associates):
        SELECT COALESCE(SUM(deal_amount), 0) INTO v_team_amount
        FROM public.businesses
        WHERE (
            assigned_user_id IN (SELECT id FROM public.user_profiles WHERE parent_user_id = p_user_id AND role = 'ASSOCIATE')
            OR associate_id IN (SELECT id FROM public.user_profiles WHERE parent_user_id = p_user_id AND role = 'ASSOCIATE')
            OR (tl_id = p_user_id AND (assigned_user_id IS NULL OR assigned_user_id != p_user_id) AND associate_id != p_user_id)
        );

        -- Include associate self performance in target calculation
        v_team_amount := v_team_amount + (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM public.stl_self_performance
            WHERE stl_id IN (SELECT id FROM public.user_profiles WHERE parent_user_id = p_user_id AND role = 'ASSOCIATE')
        );

        v_total_amount := v_self_amount + v_team_amount;
    END IF;

    -- 4. Verify target eligibility
    IF v_total_amount < 5000000 THEN
        RAISE EXCEPTION 'Target not reached. Current eligible achieved amount is ₹%, required is ₹50,00,000.', v_total_amount;
    END IF;

    -- 5. Update user_profiles role to SENIOR_TL
    UPDATE public.user_profiles
    SET role = 'SENIOR_TL', updated_at = now()
    WHERE id = p_user_id;

    -- Maintain downline hierarchy: Set senior_tl_id = newly promoted STL for all reporting members
    UPDATE public.user_profiles
    SET senior_tl_id = p_user_id, updated_at = now()
    WHERE parent_user_id = p_user_id;

    -- 6. Insert into promotions
    INSERT INTO public.promotions (
        user_id,
        previous_role,
        new_role,
        target_amount,
        achieved_amount,
        status,
        promotion_date,
        created_by
    ) VALUES (
        p_user_id,
        'TEAM_LEADER',
        'SENIOR_TL',
        5000000,
        v_total_amount,
        'PROMOTED',
        now(),
        v_admin.id
    ) RETURNING id INTO v_prom_id;

    -- 7. Audit log
    BEGIN
        INSERT INTO public.audit_logs (
            actor_id,
            action,
            target_type,
            target_id,
            details
        ) VALUES (
            v_admin.id,
            'PROMOTE_TL_TO_STL',
            'USER',
            p_user_id,
            jsonb_build_object(
                'promotion_id', v_prom_id,
                'user_code', v_user.user_code,
                'full_name', v_user.full_name,
                'previous_role', 'TEAM_LEADER',
                'new_role', 'SENIOR_TL',
                'achieved_amount', v_total_amount,
                'target_amount', 5000000
            )
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Team Leader successfully promoted to Senior Team Leader.',
        'promotion_id', v_prom_id,
        'user_id', p_user_id,
        'new_role', 'SENIOR_TL',
        'achieved_amount', v_total_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS policies on public.stl_self_performance to allow downline team performance access
DROP POLICY IF EXISTS "Users read own self performance" ON public.stl_self_performance;
DROP POLICY IF EXISTS "Users read own and downline self performance" ON public.stl_self_performance;
DROP POLICY IF EXISTS "STL read own self performance" ON public.stl_self_performance;

CREATE POLICY "Users read own and downline self performance" ON public.stl_self_performance
FOR SELECT TO authenticated
USING (
    -- Admin full access
    public.is_admin()
    OR
    -- Self access
    stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
    OR
    -- Direct downline (for TL or STL)
    stl_id IN (
        SELECT id FROM public.user_profiles 
        WHERE parent_user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
           OR senior_tl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
    )
    OR
    -- Indirect downline (for STL: Associates reporting to downline TLs)
    stl_id IN (
        SELECT id FROM public.user_profiles
        WHERE parent_user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE senior_tl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
               OR parent_user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        )
    )
);
