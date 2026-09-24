import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatUser } from '../../utils/formatUser';
import { Users, FileText, Briefcase, MapPin, Award, Target } from 'lucide-react';

export default function TeamLeaderDashboard() {
  const { profile } = useCurrentUser();
  const [stats, setStats] = useState({
    associates: 0,
    totalBusiness: 0,
    totalVisits: 0,
    pendingApps: 0,
    rewards: 0,
    targetProgress: 0
  });

  const [applications, setApplications] = useState<any[]>([]);
  const [myAssociates, setMyAssociates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  
  // Action State
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      // Fetch Associates
      const { data: associatesData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('parent_user_id', profile.id)
        .eq('role', 'ASSOCIATE');

      if (associatesData) {
        setMyAssociates(associatesData.slice(0, 5));
      }

      // Fetch Applications
      const { data: appsData } = await supabase
        .from('associate_applications')
        .select('*')
        .eq('assigned_tl_id', profile.id)
        .in('status', ['PENDING_TL_REVIEW'])
        .order('created_at', { ascending: false });
      
      if (appsData) {
        setApplications(appsData);
      }

      setStats({
        associates: associatesData?.length || 0,
        totalBusiness: 0,
        totalVisits: 0,
        pendingApps: appsData?.length || 0,
        rewards: 0,
        targetProgress: 25 // Mock percentage
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-associate', {
        body: {
          applicationId: selectedApp.id,
          fullName: selectedApp.full_name,
          email: selectedApp.email
        }
      });

      if (invokeError) {
        let errMessage = invokeError.message;
        if (invokeError.context && typeof invokeError.context.json === 'function') {
          try {
            const errData = await invokeError.context.json();
            errMessage = errData.error || errData.message || errMessage;
          } catch(e) {}
        }
        throw new Error(errMessage || 'Failed to create Associate account');
      }

      setSuccess(`Account Created! Code: ${data.userCode}, Temp Password: ${data.tempPassword}`);
      setTimeout(() => {
        setShowApproveModal(false);
        setSuccess('');
        setSelectedApp(null);
        fetchDashboardData();
      }, 5000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await supabase.from('associate_applications').update({
        status: 'DECLINED_BY_TL',
        decline_reason: declineReason,
        declined_at: new Date().toISOString()
      }).eq('id', selectedApp.id);
      
      await supabase.from('application_history').insert({
        application_id: selectedApp.id,
        actor_user_id: profile?.id,
        action: 'DECLINED',
        old_status: 'PENDING_TL_REVIEW',
        new_status: 'DECLINED_BY_TL',
        comment: declineReason
      });

      setShowDeclineModal(false);
      setSelectedApp(null);
      setDeclineReason('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleSendToStl = async (app: any) => {
    try {
        await supabase.from('associate_applications').update({
            status: 'PENDING_STL_REVIEW'
        }).eq('id', app.id);
        
        await supabase.from('application_history').insert({
            application_id: app.id,
            actor_user_id: profile?.id,
            action: 'ESCALATED',
            old_status: 'PENDING_TL_REVIEW',
            new_status: 'PENDING_STL_REVIEW',
            comment: 'Escalated to Senior TL'
        });
        
        fetchDashboardData();
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
      <div className="h-64 bg-gray-200 rounded-lg w-full"></div>
    </div>;
  }

  const KpiCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
    <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg flex items-center justify-between group hover:shadow-md transition-shadow duration-300">
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">{title}</h3>
        <p className="text-2xl font-serif text-brand-deep-navy">
          {value}
          {subtitle && <span className="text-sm font-sans text-brand-charcoal/60 ml-2">{subtitle}</span>}
        </p>
      </div>
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={colorClass} size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-brand-deep-navy mb-1">Team Leader Dashboard</h2>
        <p className="text-sm text-brand-charcoal/70">Manage your associates and track your team's business progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="My Associates" value={stats.associates} icon={Users} colorClass="text-brand-architectural-blue" />
        <KpiCard title="Pending Apps" value={stats.pendingApps} icon={FileText} colorClass="text-yellow-600" />
        <KpiCard title="Total Business" value={`₹${stats.totalBusiness}`} icon={Briefcase} colorClass="text-indigo-600" />
        <KpiCard title="Plot Visits" value={stats.totalVisits} icon={MapPin} colorClass="text-purple-600" />
        <KpiCard title="Rewards" value={`₹${stats.rewards}`} icon={Award} colorClass="text-amber-600" />
        <KpiCard title="Target Progress" value={`${stats.targetProgress}%`} icon={Target} colorClass="text-green-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* My Associates */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
            <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
              <Users size={18} className="text-brand-architectural-blue" />
              My Associates
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-brand-charcoal text-[10px] uppercase tracking-wider bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Associate</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {myAssociates.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-charcoal/10 text-brand-charcoal flex items-center justify-center font-medium">
                          {assoc.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-brand-deep-navy">{formatUser(assoc.user_code, assoc.full_name)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full ${
                        assoc.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assoc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-charcoal text-right">
                      {new Date(assoc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {myAssociates.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-brand-charcoal/60">
                      No associates in your team yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Associate Applications */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
            <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
              <FileText size={18} className="text-brand-architectural-blue" />
              New Associate Applications
              {applications.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium ml-2">
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
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-deep-navy">{app.user_code ? formatUser(app.user_code, app.full_name) : app.full_name}</div>
                      <div className="text-xs text-brand-charcoal/60 mt-1">Ref: {app.referral_code || 'None'}</div>
                    </td>
                    <td className="px-6 py-4 text-brand-charcoal">
                      <div className="text-xs">{app.email}</div>
                      <div className="text-xs">{app.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => { setSelectedApp(app); setShowApproveModal(true); }}
                          className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors border border-green-200"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleSendToStl(app)}
                          className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-blue-200"
                        >
                          Escalate
                        </button>
                        <button 
                          onClick={() => { setSelectedApp(app); setShowDeclineModal(true); }}
                          className="text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors border border-red-200"
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
        
        {/* Business Overview Shell */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden p-8 flex flex-col items-center justify-center text-center">
          <Briefcase className="text-brand-architectural-blue/30 mb-4" size={48} />
          <h2 className="text-xl font-serif text-brand-deep-navy mb-2">Business Overview</h2>
          <p className="text-brand-charcoal/70 max-w-sm text-sm">
            Total business, active clients, and deals will be displayed here once business transactions are registered in the system.
          </p>
        </div>

        {/* Plot Visits Shell */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden p-8 flex flex-col items-center justify-center text-center">
          <MapPin className="text-brand-architectural-blue/30 mb-4" size={48} />
          <h2 className="text-xl font-serif text-brand-deep-navy mb-2">Plot Visits</h2>
          <p className="text-brand-charcoal/70 max-w-sm text-sm">
            Site visit tracking and scheduled tours for your team will appear here once the Visits module is fully launched.
          </p>
        </div>

      </div>

      {/* APPROVE MODAL */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-brand-soft-grey">
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4">Create Associate Account</h2>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-200 rounded">{error}</div>}
            
            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded mb-6 text-sm font-medium">
                <p className="text-base text-green-900 mb-2">Account successfully created!</p>
                <div className="bg-white p-3 rounded border border-green-100 font-mono select-all mb-2 shadow-inner">
                  {success}
                </div>
                <p className="text-xs opacity-80">Please securely provide these credentials to the user.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6 bg-brand-off-white p-4 rounded border border-gray-100">
                <p className="text-sm text-brand-charcoal mb-2">
                  Approving application for <strong>{selectedApp.full_name}</strong>.
                </p>
                <div>
                  <p className="text-[10px] text-brand-charcoal/60 uppercase tracking-widest">Email</p>
                  <p className="font-medium text-brand-deep-navy">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-charcoal/60 uppercase tracking-widest">Mobile</p>
                  <p className="font-medium text-brand-deep-navy">{selectedApp.phone}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => { setShowApproveModal(false); setSuccess(''); setSelectedApp(null); fetchDashboardData(); }}
                className="px-4 py-2 text-sm font-medium text-brand-charcoal hover:bg-gray-100 rounded transition-colors"
              >
                {success ? 'CLOSE' : 'CANCEL'}
              </button>
              {!success && (
                <button 
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-6 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {processing ? 'PROVISIONING...' : 'CREATE ACCOUNT'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {showDeclineModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-brand-soft-grey">
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4 text-red-600">Decline Application</h2>
            <p className="text-sm text-brand-charcoal/70 mb-4">
              Are you sure you want to decline the application for <strong>{selectedApp.full_name}</strong>?
            </p>
            <div className="mb-6">
              <label className="block text-xs font-medium uppercase tracking-widest text-brand-charcoal/60 mb-2">Reason for decline</label>
              <textarea
                required
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
                disabled={processing || !declineReason}
                className="px-6 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {processing ? 'DECLINING...' : 'CONFIRM DECLINE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
