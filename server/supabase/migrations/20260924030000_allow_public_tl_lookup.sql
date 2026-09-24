-- Allow public (anon/public) to read ACTIVE team leaders and senior team leaders 
-- This is necessary for the public Join Team form to validate referral codes and populate the STL dropdown.
CREATE POLICY "Public read active team leaders" ON public.user_profiles
FOR SELECT
TO public
USING (status = 'ACTIVE' AND role IN ('SENIOR_TL', 'TEAM_LEADER'));
