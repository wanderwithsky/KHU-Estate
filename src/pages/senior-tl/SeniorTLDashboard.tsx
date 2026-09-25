import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatUser } from '../../utils/formatUser';
import { Users, FileText, Briefcase, MapPin, Award, Target } from 'lucide-react';

export default function SeniorTLDashboard() {
  const { profile } = useCurrentUser();
  const [stats, setStats] = useState({ 
    tls: 0, 
    associates: 0,
    totalBusiness: 0,
    totalVisits: 0,
    pendingApps: 0,
    rewards: 0
  });
  
  const [applications, setApplications] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!profile?.id) return;
    
    async function fetchData() {
      try {
        const { data: teamData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('senior_tl_id', profile!.id);
          
        let tlsCount = 0;
        let associatesCount = 0;
        const tlsList: any[] = [];
        
        if (teamData) {
          teamData.forEach(member => {
            if (member.role === 'TEAM_LEADER') {
              tlsCount++;
              tlsList.push(member);
            }
            if (member.role === 'ASSOCIATE') associatesCount++;
          });
        }
        
        setMyTeam(tlsList.slice(0, 5));

        // Fetch Applications assigned to this STL
        const { data: apps } = await supabase
          .from('associate_applications')
          .select('*')
          .eq('assigned_stl_id', profile!.id)
          .eq('status', 'PENDING_STL_REVIEW')
          .order('created_at', { ascending: false });
          
        if (apps) setApplications(apps);

        setStats({
          tls: tlsCount,
          associates: associatesCount,
          totalBusiness: 0,
          totalVisits: 0,
          pendingApps: apps?.length || 0,
          rewards: 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile]);

  const handleApprove = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-tl', {
        body: { applicationId: selectedApp.id }
      });

      if (invokeError) {
        let errMessage = invokeError.message;
        if (invokeError.context && typeof invokeError.context.json === 'function') {
          try {
            const errData = await invokeError.context.json();
            errMessage = errData.error || errData.message || errMessage;
          } catch(e) {}
        }
        throw new Error(errMessage || 'Failed to create Team Leader');
      }

      setSuccess(`Account Created! Code: ${data.userCode}, Temp Password: ${data.tempPassword}`);
      setTimeout(() => {
        setShowApproveModal(false);
        setSuccess('');
        setApplications(apps => apps.filter(a => a.id !== selectedApp.id));
      }, 5000);
    } catch (err: any) {
      alert(err.message || 'Error creating account');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('associate_applications')
        .update({ 
          status: 'DECLINED_BY_STL',
          decline_reason: declineReason,
          declined_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

      if (error) throw error;
      
      setShowDeclineModal(false);
      setDeclineReason('');
      setApplications(apps => apps.filter(a => a.id !== selectedApp.id));
    } catch (err: any) {
      alert(err.message || 'Error declining application');
    } finally {
      setProcessing(false);
    }
  };

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
        <h2 className="text-2xl font-serif text-brand-deep-navy mb-1">Senior TL Dashboard</h2>
        <p className="text-sm text-brand-charcoal/70">Overview of your hierarchy and team performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Team Leaders" value={stats.tls} icon={Users} colorClass="text-brand-architectural-blue" />
        <KpiCard title="Associates" value={stats.associates} icon={Users} colorClass="text-brand-charcoal" />
        <KpiCard title="Pending Apps" value={stats.pendingApps} icon={FileText} colorClass="text-yellow-600" />
        <KpiCard title="Total Business" value={`₹${stats.totalBusiness}`} icon={Briefcase} colorClass="text-indigo-600" />
        <KpiCard title="Total Visits" value={stats.totalVisits} icon={MapPin} colorClass="text-purple-600" />
        <KpiCard title="Rewards" value={`₹${stats.rewards}`} icon={Award} colorClass="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* My Team (Team Leaders) */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
            <h2 className="text-lg font-serif text-brand-deep-navy">My Team Leaders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-brand-charcoal text-[10px] uppercase tracking-wider bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Team Leader</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {myTeam.map((tl) => (
                  <tr key={tl.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-medium">
                          {tl.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-brand-deep-navy">{formatUser(tl.user_code, tl.full_name)}</div>
                          <div className="text-xs text-brand-charcoal/60">{tl.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full ${
                        tl.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tl.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-brand-charcoal">
                      {tl.user_code}
                    </td>
                  </tr>
                ))}
                {myTeam.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-brand-charcoal/60">
                      No team leaders under your hierarchy yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Leader Applications */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
            <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
              Pending Applications
              {applications.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  {applications.length}
                </span>
              )}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-brand-charcoal text-[10px] uppercase tracking-wider bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Applicant</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-deep-navy">{app.user_code ? formatUser(app.user_code, app.full_name) : app.full_name}</div>
                      <div className="text-xs text-brand-charcoal/60">{new Date(app.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-brand-charcoal">
                      {app.role_applied_for}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => { setSelectedApp(app); setShowApproveModal(true); }}
                          className="text-xs font-medium text-brand-architectural-blue hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                        >
                          Review
                        </button>
                        <button 
                          onClick={() => { setSelectedApp(app); setShowDeclineModal(true); }}
                          className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-brand-charcoal/60">
                      No pending applications requiring your review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Team Performance Empty State */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden p-8 flex flex-col items-center justify-center text-center">
          <Target className="text-brand-architectural-blue/30 mb-4" size={48} />
          <h2 className="text-xl font-serif text-brand-deep-navy mb-2">Team Performance Tracking</h2>
          <p className="text-brand-charcoal/70 max-w-md">
            Performance metrics and leaderboards will appear here once the business transaction modules are fully integrated into KHU Developers.
          </p>
        </div>

      </div>

      {/* Modals */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-brand-soft-grey">
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4">Create Account for {selectedApp.full_name}</h2>
            
            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded mb-6 text-sm font-medium">
                {success}
              </div>
            ) : (
              <div className="space-y-4 mb-6 bg-brand-off-white p-4 rounded border border-gray-100">
                <div>
                  <p className="text-[10px] text-brand-charcoal/60 uppercase tracking-widest">Email</p>
                  <p className="font-medium text-brand-deep-navy">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-charcoal/60 uppercase tracking-widest">Mobile</p>
                  <p className="font-medium text-brand-deep-navy">{selectedApp.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-charcoal/60 uppercase tracking-widest">Assigning STL</p>
                  <p className="font-medium text-brand-deep-navy">{profile?.full_name} ({profile?.user_code})</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => { setShowApproveModal(false); setSuccess(''); }}
                className="px-4 py-2 text-sm font-medium text-brand-charcoal hover:bg-gray-100 rounded transition-colors"
              >
                {success ? 'CLOSE' : 'CANCEL'}
              </button>
              {!success && (
                <button 
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-6 py-2 text-sm font-medium bg-brand-architectural-blue text-white rounded hover:bg-brand-deep-navy disabled:opacity-50 transition-colors shadow-sm"
                >
                  {processing ? 'CREATING...' : 'APPROVE & CREATE'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeclineModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-brand-soft-grey">
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4 text-red-600">Decline Application</h2>
            <p className="text-sm text-brand-charcoal/70 mb-4">
              Are you sure you want to decline the application for <strong>{selectedApp.full_name}</strong>?
            </p>
            <div className="mb-6">
              <label className="block text-xs font-medium uppercase tracking-widest text-brand-charcoal/60 mb-2">Reason for decline (Optional)</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full border border-gray-200 rounded p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-architectural-blue bg-brand-off-white"
                rows={3}
                placeholder="Provide a reason..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 text-sm font-medium text-brand-charcoal hover:bg-gray-100 rounded transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={handleDecline}
                disabled={processing}
                className="px-6 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {processing ? 'DECLINING...' : 'DECLINE APPLICATION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
