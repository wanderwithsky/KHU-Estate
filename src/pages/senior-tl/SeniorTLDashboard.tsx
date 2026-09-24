import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function SeniorTLDashboard() {
  const { profile } = useCurrentUser();
  const [stats, setStats] = useState({ tls: 0, associates: 0 });

  useEffect(() => {
    if (!profile) return;
    
    async function fetchStats() {
      const { count: tlsCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('senior_tl_id', profile.id)
        .eq('role', 'TEAM_LEADER');
        
      const { count: associatesCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('senior_tl_id', profile.id)
        .eq('role', 'ASSOCIATE');

      setStats({
        tls: tlsCount || 0,
        associates: associatesCount || 0
      });
    }

    fetchStats();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
          <h3 className="text-sm uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">My Team Leaders</h3>
          <p className="text-3xl font-serif text-brand-deep-navy">{stats.tls}</p>
        </div>
        <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
          <h3 className="text-sm uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">Total Associates in Downline</h3>
          <p className="text-3xl font-serif text-brand-deep-navy">{stats.associates}</p>
        </div>
      </div>
    </div>
  );
}
