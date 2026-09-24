CREATE OR REPLACE FUNCTION transfer_tl_application(p_application_id UUID, p_senior_tl_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role TEXT;
  v_application RECORD;
  v_senior_tl RECORD;
BEGIN
  -- 1. Caller is authenticated & 2. Caller role = ADMIN
  SELECT role INTO v_caller_role
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Unauthorized: Only Admin can transfer applications';
  END IF;

  -- 3. Application exists
  SELECT * INTO v_application
  FROM public.associate_applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- 4. Application role = TEAM_LEADER
  IF v_application.role_applied_for != 'Team Leader' THEN
    RAISE EXCEPTION 'Invalid application role: Only Team Leader applications can be transferred via this operation';
  END IF;

  -- 5. Selected Senior TL exists
  SELECT * INTO v_senior_tl
  FROM public.user_profiles
  WHERE id = p_senior_tl_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected Senior Team Leader not found';
  END IF;

  -- 6. Selected Senior TL has role = SENIOR_TL
  IF v_senior_tl.role != 'SENIOR_TL' THEN
    RAISE EXCEPTION 'Invalid selection: The assigned user must be a Senior Team Leader';
  END IF;

  -- 7. Selected Senior TL status = ACTIVE
  IF v_senior_tl.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Unable to transfer application. The selected Senior Team Leader is no longer active.';
  END IF;

  -- Perform Transfer
  UPDATE public.associate_applications
  SET 
    assigned_stl_id = p_senior_tl_id,
    status = 'PENDING_STL_REVIEW',
    updated_at = NOW()
  WHERE id = p_application_id;

  -- Log action
  INSERT INTO public.application_history (
    application_id, actor_user_id, action, old_status, new_status, comment
  ) VALUES (
    p_application_id, 
    (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()), 
    'TRANSFER', 
    v_application.status, 
    'PENDING_STL_REVIEW', 
    'Admin transferred Team Leader application to Senior TL: ' || v_senior_tl.user_code
  );

  RETURN jsonb_build_object('success', true);
END;
$$;
