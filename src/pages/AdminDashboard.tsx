import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatUser } from '../utils/formatUser';
import { Users, FileText, Briefcase, MapPin, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingApplications: 0,
    approvedApplications: 0,
    declinedApplications: 0,
    totalAssociates: 0,
    activeTeamLeaders: 0,
    activeSeniorTls: 0,
    totalBusiness: 0,
    totalVisits: 0,
    totalRevenue: 0,
    activeUsers: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Applications Stats & Recent Apps
        const { data: apps } = await supabase
          .from('associate_applications')
          .select('id, full_name, role_applied_for, referral_code, status, created_at, assigned_tl:assigned_tl_id(full_name), assigned_stl:assigned_stl_id(full_name)')
          .order('created_at', { ascending: false });
        
        let pending = 0, approved = 0, declined = 0;
        if (apps) {
          setRecentApps(apps.slice(0, 5));
          apps.forEach(app => {
            if (app.status.includes('PENDING')) pending++;
            else if (app.status.includes('APPROVED') || app.status.includes('ACCOUNT_CREATED')) approved++;
            else if (app.status.includes('DECLINED')) declined++;
          });
        }

        // Fetch User Stats
        const { data: users } = await supabase
          .from('user_profiles')
          .select('role, status');
        
        let associates = 0, tls = 0, stls = 0, active = 0;
        if (users) {
          users.forEach(u => {
            if (u.status === 'ACTIVE') active++;
            if (u.role === 'ASSOCIATE') associates++;
            else if (u.role === 'TEAM_LEADER') tls++;
            else if (u.role === 'SENIOR_TL') stls++;
          });
        }

        setStats({
          pendingApplications: pending,
          approvedApplications: approved,
          declinedApplications: declined,
          totalAssociates: associates,
          activeTeamLeaders: tls,
          activeSeniorTls: stls,
          totalBusiness: 0, // Mock for now until table exists
          totalVisits: 0, // Mock for now
          totalRevenue: 0, // Mock for now
          activeUsers: active
        });

        // Fetch Recent Activity (Audit logs + application history combined conceptually, using audit logs for now)
        const { data: activity } = await supabase
          .from('audit_logs')
          .select('*, user_profiles(full_name, role)')
          .order('created_at', { ascending: false })
          .limit(6);
          
        if (activity) setRecentActivity(activity);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
      <div className="h-64 bg-gray-200 rounded-lg w-full"></div>
    </div>;
  }

  const KpiCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg flex items-center justify-between group hover:shadow-md transition-shadow duration-300">
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">{title}</h3>
        <p className="text-2xl font-serif text-brand-deep-navy">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={colorClass} size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-brand-deep-navy mb-1">Global Dashboard</h2>
        <p className="text-sm text-brand-charcoal/70">Overview of the entire KHU Developers platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Senior TLs" value={stats.activeSeniorTls} icon={Users} colorClass="text-brand-architectural-blue" />
        <KpiCard title="Team Leaders" value={stats.activeTeamLeaders} icon={Users} colorClass="text-brand-primary" />
        <KpiCard title="Associates" value={stats.totalAssociates} icon={Users} colorClass="text-brand-charcoal" />
        <KpiCard title="Active Users" value={stats.activeUsers} icon={Activity} colorClass="text-green-600" />
        
        <KpiCard title="Pending Apps" value={stats.pendingApplications} icon={FileText} colorClass="text-yellow-600" />
        <KpiCard title="Total Business" value={`₹${stats.totalBusiness}`} icon={Briefcase} colorClass="text-indigo-600" />
        <KpiCard title="Total Visits" value={stats.totalVisits} icon={MapPin} colorClass="text-purple-600" />
        <KpiCard title="Total Revenue" value={`₹${stats.totalRevenue}`} icon={DollarSign} colorClass="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hierarchy Overview */}
          <div className="bg-white shadow-sm border border-brand-soft-grey rounded-lg p-6">
            <h2 className="text-lg font-serif text-brand-deep-navy mb-6">Hierarchy Overview</h2>
            <div className="flex flex-col md:flex-row items-center justify-between text-center gap-4 bg-brand-off-white p-8 rounded border border-gray-100">
              <div className="flex-1">
                <div className="w-16 h-16 mx-auto bg-brand-deep-navy text-white rounded-full flex items-center justify-center mb-3 shadow-md">
                  <span className="font-serif font-medium">ADMIN</span>
                </div>
                <p className="text-sm font-medium text-brand-charcoal">Global Control</p>
              </div>
              <div className="hidden md:block w-8 border-t-2 border-dashed border-gray-300"></div>
              <div className="flex-1">
                <div className="w-16 h-16 mx-auto bg-brand-architectural-blue text-white rounded-full flex items-center justify-center mb-3 shadow-md">
                  <span className="font-serif font-medium">{stats.activeSeniorTls}</span>
                </div>
                <p className="text-sm font-medium text-brand-charcoal">Senior TLs</p>
              </div>
              <div className="hidden md:block w-8 border-t-2 border-dashed border-gray-300"></div>
              <div className="flex-1">
                <div className="w-16 h-16 mx-auto bg-brand-primary text-white rounded-full flex items-center justify-center mb-3 shadow-md">
                  <span className="font-serif font-medium">{stats.activeTeamLeaders}</span>
                </div>
                <p className="text-sm font-medium text-brand-charcoal">Team Leaders</p>
              </div>
              <div className="hidden md:block w-8 border-t-2 border-dashed border-gray-300"></div>
              <div className="flex-1">
                <div className="w-16 h-16 mx-auto bg-brand-charcoal text-white rounded-full flex items-center justify-center mb-3 shadow-md">
                  <span className="font-serif font-medium">{stats.totalAssociates}</span>
                </div>
                <p className="text-sm font-medium text-brand-charcoal">Associates</p>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white shadow-sm border border-brand-soft-grey rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
              <h2 className="text-lg font-serif text-brand-deep-navy">Recent Applications</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-brand-charcoal text-[10px] uppercase tracking-wider bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Applicant</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Assigned To</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {recentApps.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-deep-navy">{app.full_name}</div>
                        <div className="text-xs text-brand-charcoal/60 mt-1">{new Date(app.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-brand-charcoal">{app.role_applied_for}</td>
                      <td className="px-6 py-4 text-brand-charcoal">
                        {app.assigned_tl ? app.assigned_tl.full_name : app.assigned_stl ? app.assigned_stl.full_name : 'Admin'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full ${
                          app.status.includes('PENDING') ? 'bg-yellow-100 text-yellow-800' :
                          app.status.includes('DECLINED') ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentApps.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-brand-charcoal/60">No recent applications found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-sm border border-brand-soft-grey rounded-lg p-6 flex flex-col h-full">
          <h2 className="text-lg font-serif text-brand-deep-navy mb-6 flex items-center gap-2">
            <Activity size={18} className="text-brand-architectural-blue" />
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-brand-charcoal/60 italic border border-dashed rounded border-gray-200 bg-gray-50/50">
              No recent activity recorded.
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {recentActivity.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-brand-off-white text-brand-charcoal shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-brand-deep-navy">
                        {log.user_profiles ? formatUser(log.user_profiles.user_code, log.user_profiles.full_name) : 'System'}
                      </span>
                      <span className="text-[10px] text-brand-charcoal/50 font-mono">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs text-brand-charcoal/80">
                      performed <span className="font-medium text-brand-architectural-blue">{log.action.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
