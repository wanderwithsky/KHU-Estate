import { useAuth } from '../context/AuthContext';

export function useCurrentUser() {
  const { user, profile, isInitialized } = useAuth();

  return {
    authUser: user,
    profile,
    role: profile?.role,
    userCode: profile?.user_code,
    parentUserId: profile?.parent_user_id,
    seniorTlId: profile?.senior_tl_id,
    teamId: profile?.team_id,
    status: profile?.status,
    mustChangePassword: profile?.must_change_password,
    loading: !isInitialized,
    isAuthenticated: !!user && !!profile,
  };
}
