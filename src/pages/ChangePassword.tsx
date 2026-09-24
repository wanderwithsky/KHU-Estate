import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!session) {
      navigate('/login');
    } else if (profile && !profile.must_change_password) {
      // If user doesn't need to change password, redirect to their dashboard
      if (profile.role === 'ADMIN') navigate('/admin');
      else if (profile.role === 'SENIOR_TL') navigate('/senior-team-leader');
      else if (profile.role === 'TEAM_LEADER') navigate('/team-leader');
      else if (profile.role === 'ASSOCIATE') navigate('/associate');
      else navigate('/');
    }
  }, [session, profile, navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Update the user_profiles to clear the flag
      if (profile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ must_change_password: false })
          .eq('id', profile.id);
          
        if (profileError) {
          throw new Error('Failed to update profile status');
        }
        
        // Reload page to re-fetch profile and trigger redirect
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-brand-warm-white flex items-center justify-center p-6 pt-24">
      <div className="bg-white p-8 md:p-12 shadow-sm border-t-4 border-brand-primary w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-brand-deep-navy mb-2">Change Password</h1>
          <p className="text-sm text-brand-charcoal/60 font-light">Please update your temporary password to continue.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 text-sm rounded mb-6 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">New Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" 
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" 
              required
              minLength={6}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-8 py-4 bg-brand-primary text-white text-sm tracking-widest uppercase font-medium hover:bg-brand-deep-navy transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
