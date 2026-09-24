import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalAssociates: 0,
    activeTeamLeaders: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const { count: appsCount } = await supabase
        .from('associate_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING_TL_REVIEW');
        
      const { count: associatesCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ASSOCIATE');

      const { count: tlsCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'TEAM_LEADER');

      setStats({
        pendingApplications: appsCount || 0,
        totalAssociates: associatesCount || 0,
        activeTeamLeaders: tlsCount || 0,
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
          <h3 className="text-sm uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">Pending Applications</h3>
          <p className="text-3xl font-serif text-brand-deep-navy">{stats.pendingApplications}</p>
        </div>
        <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
          <h3 className="text-sm uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">Total Associates</h3>
          <p className="text-3xl font-serif text-brand-deep-navy">{stats.totalAssociates}</p>
        </div>
        <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
          <h3 className="text-sm uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">Active Team Leaders</h3>
          <p className="text-3xl font-serif text-brand-deep-navy">{stats.activeTeamLeaders}</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-brand-soft-grey rounded-lg p-6">
        <h2 className="text-lg font-serif text-brand-deep-navy mb-4">Recent Activity</h2>
        <div className="text-sm text-brand-charcoal/60 italic">
          Fetching live activity...
        </div>
      </div>
    </div>
  );
}
