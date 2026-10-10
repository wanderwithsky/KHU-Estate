CREATE OR REPLACE FUNCTION public.debug_get_users()
RETURNS JSON AS $$
BEGIN
  RETURN (SELECT json_agg(row_to_json(u)) FROM (SELECT id, user_code, full_name, role, parent_user_id, senior_tl_id FROM public.user_profiles) u);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
