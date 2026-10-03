DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.leads;

CREATE POLICY "Allow public contact form submissions"
ON public.leads
FOR INSERT
TO public
WITH CHECK (
  source = 'WEBSITE_CONTACT_FORM'
);
