CREATE OR REPLACE FUNCTION public.debug_get_commissions()
RETURNS JSON AS $$
BEGIN
  RETURN (SELECT json_agg(row_to_json(c)) FROM public.commissions c);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
