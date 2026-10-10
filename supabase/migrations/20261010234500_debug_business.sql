CREATE OR REPLACE FUNCTION public.debug_get_business()
RETURNS JSON AS $$
BEGIN
  RETURN (SELECT row_to_json(b) FROM public.businesses b LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
