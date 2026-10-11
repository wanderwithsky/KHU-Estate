import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatUser } from '../../utils/formatUser';
import { 
  Search, RefreshCw, Eye, CheckCircle, XCircle, 
  ArrowUpRight, Clock, Phone, Mail, MapPin, 
  FileText, Copy, AlertCircle, ShieldCheck, X 
} from 'lucide-react';

export default function TeamLeaderApplications() {
  const { profile } = useCurrentUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  // Action form state
  const [declineReason, setDeclineReason] = useState('');
  const [escalateNote, setEscalateNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Account creation state (optional direct provisioning)
  const [createAccountDirectly, setCreateAccountDirectly] = useState(false);
  const [manualLoginId, setManualLoginId] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);

  const fetchApplications = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      setActionError('');

      // Strictly fetch applications assigned to the authenticated Team Leader
      const { data, error } = await supabase
        .from('associate_applications')
        .select(`
          *,
          assigned_tl:assigned_tl_id (id, user_code, full_name),
          assigned_stl:assigned_stl_id (id, user_code, full_name)
        `)
        .eq('assigned_tl_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err: any) {
      console.error('Error fetching applications:', err.message);
      setActionError('Failed to load applications. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    // Realtime subscription for instant updates when applicant joins or status changes
    const channel = supabase
      .channel('tl_applications_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'associate_applications',
          filter: `assigned_tl_id=eq.${profile.id}`
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Open Actions
  const handleOpenReview = (app: any) => {
    setSelectedApp(app);
    setShowReviewModal(true);
  };

  const handleOpenApprove = (app: any) => {
    setSelectedApp(app);
    setActionError('');
    setActionSuccess('');
    setCreateAccountDirectly(false);
    setManualLoginId(app.phone ? `KHU${app.phone.slice(-4)}` : `KHU${Math.floor(1000 + Math.random() * 9000)}`);
    setManualPassword(`Khu@${Math.floor(1000 + Math.random() * 9000)}`);
    setCreatedCredentials(null);
    setShowApproveModal(true);
  };

  const handleOpenDecline = (app: any) => {
    setSelectedApp(app);
    setDeclineReason('');
    setActionError('');
    setShowDeclineModal(true);
  };

  const handleOpenEscalate = (app: any) => {
    setSelectedApp(app);
    setEscalateNote('');
    setActionError('');
    setShowEscalateModal(true);
  };

  // 1. Approve Handler
  const handleApprove = async () => {
    if (!selectedApp || !profile?.id) return;
    setProcessing(true);
    setActionError('');

    try {
      if (createAccountDirectly) {
        // Direct account provisioning via Edge Function
        if (!manualLoginId.trim() || !manualPassword.trim()) {
          throw new Error('Login ID and Password are required for account creation.');
        }

        const { data, error: invokeError } = await supabase.functions.invoke('create-associate', {
          body: {
            applicationId: selectedApp.id,
            loginId: manualLoginId.trim(),
            password: manualPassword
          }
        });

        if (invokeError) {
          let msg = invokeError.message;
          if (invokeError.context && typeof invokeError.context.json === 'function') {
            try {
              const errJson = await invokeError.context.json();
              msg = errJson.error || errJson.message || msg;
            } catch (e) {}
          }
          throw new Error(msg || 'Failed to provision associate account.');
        }

        setCreatedCredentials({
          name: selectedApp.full_name,
          userCode: data.userCode || manualLoginId.trim(),
          email: selectedApp.email || 'None',
          temporaryPassword: data.temporaryPassword || manualPassword,
          role: 'ASSOCIATE'
        });
        setActionSuccess('Associate account created successfully!');
      } else {
        // Standard Approval Workflow: Update application status to APPROVED
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('associate_applications')
          .update({
            status: 'APPROVED',
            reviewed_by: profile.id,
            reviewed_at: now,
            approved_at: now
          })
          .eq('id', selectedApp.id);

        if (updateError) throw updateError;

        // Record in application history
        await supabase.from('application_history').insert({
          application_id: selectedApp.id,
          actor_user_id: profile.id,
          action: 'APPROVED',
          old_status: selectedApp.status,
          new_status: 'APPROVED',
          comment: 'Approved by Team Leader'
        });

        setShowApproveModal(false);
        setSelectedApp(null);
        setActionSuccess('Application marked as Approved successfully!');
        setTimeout(() => setActionSuccess(''), 4000);
      }

      await fetchApplications();
    } catch (err: any) {
      console.error('Approve error:', err);
      setActionError(err.message || 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  // 2. Decline Handler
  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !profile?.id) return;
    setProcessing(true);
    setActionError('');

    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('associate_applications')
        .update({
          status: 'DECLINED_BY_TL',
          decline_reason: declineReason.trim() || 'Declined by Team Leader',
          declined_at: now,
          reviewed_by: profile.id,
          reviewed_at: now
        })
        .eq('id', selectedApp.id);

      if (updateError) throw updateError;

      // History audit
      await supabase.from('application_history').insert({
        application_id: selectedApp.id,
        actor_user_id: profile.id,
        action: 'DECLINED',
        old_status: selectedApp.status,
        new_status: 'DECLINED_BY_TL',
        comment: declineReason.trim() || 'Declined by Team Leader'
      });

      setShowDeclineModal(false);
      setSelectedApp(null);
      setDeclineReason('');
      setActionSuccess('Application has been declined.');
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchApplications();
    } catch (err: any) {
      console.error('Decline error:', err);
      setActionError(err.message || 'Failed to decline application');
    } finally {
      setProcessing(false);
    }
  };

  // 3. Escalate to STL Handler
  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !profile?.id) return;
    setProcessing(true);
    setActionError('');

    try {
      const { error: updateError } = await supabase
        .from('associate_applications')
        .update({
          status: 'PENDING_STL_REVIEW',
          escalation_note: escalateNote.trim() || 'Escalated by Team Leader',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

      if (updateError) throw updateError;

      await supabase.from('application_history').insert({
        application_id: selectedApp.id,
        actor_user_id: profile.id,
        action: 'ESCALATED',
        old_status: selectedApp.status,
        new_status: 'PENDING_STL_REVIEW',
        comment: escalateNote.trim() || 'Escalated to Senior TL'
      });

      setShowEscalateModal(false);
      setSelectedApp(null);
      setEscalateNote('');
      setActionSuccess('Application escalated to Senior Team Leader.');
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchApplications();
    } catch (err: any) {
      console.error('Escalate error:', err);
      setActionError(err.message || 'Failed to escalate application');
    } finally {
      setProcessing(false);
    }
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `KHU Developers Associate Account Credentials:\nName: ${createdCredentials.name}\nUser ID: ${createdCredentials.userCode}\nTemporary Password: ${createdCredentials.temporaryPassword}\n\nPlease login at the KHU Portal and change your password.`;
    navigator.clipboard.writeText(text);
    alert('Credentials copied to clipboard!');
  };

  // Filter applications
  const filteredApps = applications.filter(app => {
    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING' && app.status !== 'PENDING_TL_REVIEW') return false;
      if (statusFilter === 'APPROVED' && app.status !== 'APPROVED' && app.status !== 'ACCOUNT_CREATED') return false;
      if (statusFilter === 'DECLINED' && !app.status.includes('DECLINED')) return false;
      if (statusFilter === 'ACCOUNT_CREATED' && app.status !== 'ACCOUNT_CREATED') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        (app.full_name && app.full_name.toLowerCase().includes(q)) ||
        (app.application_number && app.application_number.toLowerCase().includes(q)) ||
        (app.phone && app.phone.toLowerCase().includes(q)) ||
        (app.email && app.email.toLowerCase().includes(q)) ||
        (app.city && app.city.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Counters
  const counts = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING_TL_REVIEW').length,
    approved: applications.filter(a => a.status === 'APPROVED' || a.status === 'ACCOUNT_CREATED').length,
    declined: applications.filter(a => a.status.includes('DECLINED')).length
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PENDING_TL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            Pending TL Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} />
            Approved
          </span>
        );
      case 'ACCOUNT_CREATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <ShieldCheck size={12} />
            Account Created
          </span>
        );
      case 'DECLINED_BY_TL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} />
            Declined by TL
          </span>
        );
      case 'DECLINED_BY_STL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} />
            Declined by STL
          </span>
        );
      case 'PENDING_STL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight size={12} />
            Escalated to STL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Associate Applications</h2>
          <p className="text-sm text-brand-charcoal/70">
            Review, approve, and manage candidate applications submitted under your referral.
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-brand-charcoal bg-white border border-brand-soft-grey rounded-md hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-3 text-sm animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${statusFilter === 'ALL' ? 'bg-blue-50/50 border-brand-architectural-blue shadow-sm' : 'bg-white border-brand-soft-grey hover:border-gray-300'}`}
        >
          <div className="text-[11px] uppercase tracking-wider text-brand-charcoal/60 font-medium">All Applications</div>
          <div className="text-2xl font-serif font-bold text-brand-deep-navy mt-1">{counts.total}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${statusFilter === 'PENDING' ? 'bg-amber-50/50 border-amber-500 shadow-sm' : 'bg-white border-brand-soft-grey hover:border-gray-300'}`}
        >
          <div className="text-[11px] uppercase tracking-wider text-amber-700/80 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Pending Review
          </div>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1">{counts.pending}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${statusFilter === 'APPROVED' ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' : 'bg-white border-brand-soft-grey hover:border-gray-300'}`}
        >
          <div className="text-[11px] uppercase tracking-wider text-emerald-700/80 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Approved
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">{counts.approved}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('DECLINED')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${statusFilter === 'DECLINED' ? 'bg-red-50/50 border-red-500 shadow-sm' : 'bg-white border-brand-soft-grey hover:border-gray-300'}`}
        >
          <div className="text-[11px] uppercase tracking-wider text-red-700/80 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Declined
          </div>
          <div className="text-2xl font-serif font-bold text-red-700 mt-1">{counts.declined}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-brand-soft-grey shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, email, app #..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-architectural-blue"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-brand-charcoal/70 font-medium whitespace-nowrap">Filter:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-architectural-blue w-full md:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending TL Review</option>
            <option value="APPROVED">Approved</option>
            <option value="ACCOUNT_CREATED">Account Created</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-brand-charcoal text-[11px] uppercase tracking-wider bg-gray-50/70 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">App #</th>
                <th className="px-5 py-3.5 font-semibold">Applicant Name</th>
                <th className="px-5 py-3.5 font-semibold">Contact Details</th>
                <th className="px-5 py-3.5 font-semibold">City</th>
                <th className="px-5 py-3.5 font-semibold">Applied Date</th>
                <th className="px-5 py-3.5 font-semibold">Assigned TL</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-brand-charcoal/60">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-brand-architectural-blue" />
                      <span>Loading applications...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-brand-charcoal/60">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="text-gray-300" />
                      <p className="font-medium text-gray-700">No associate applications found.</p>
                      <p className="text-xs text-gray-500">
                        {searchQuery || statusFilter !== 'ALL' 
                          ? 'Try clearing or modifying your search filters.' 
                          : 'New applications submitted through the Join page under your referral code will appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono font-medium text-gray-600">
                      {app.application_number}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-medium text-brand-deep-navy">{app.full_name}</div>
                      {app.referral_code && (
                        <div className="text-[11px] text-gray-500 font-mono">Code: {app.referral_code}</div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      <div>{app.phone || <span className="text-gray-400 font-mono">-</span>}</div>
                      <div className="text-gray-500">{app.email || <span className="text-gray-400 font-mono">-</span>}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {app.city || <span className="text-gray-400">-</span>}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono text-gray-600">
                      {new Date(app.created_at).toLocaleDateString('en-IN')}
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      {app.assigned_tl ? (
                        <span className="font-medium text-brand-deep-navy">
                          {formatUser(app.assigned_tl.user_code, app.assigned_tl.full_name)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Self Assigned</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReview(app)}
                          title="Review Application Details"
                          className="p-1.5 text-gray-600 hover:text-brand-architectural-blue hover:bg-gray-100 rounded transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        {app.status === 'PENDING_TL_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleOpenApprove(app)}
                              title="Approve Application"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                            >
                              <CheckCircle size={16} />
                            </button>

                            <button
                              onClick={() => handleOpenDecline(app)}
                              title="Decline Application"
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            >
                              <XCircle size={16} />
                            </button>

                            <button
                              onClick={() => handleOpenEscalate(app)}
                              title="Escalate to Senior TL"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              <ArrowUpRight size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Review Application Modal */}
      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <div>
                <div className="text-xs font-mono uppercase text-gray-500">{selectedApp.application_number}</div>
                <h3 className="text-xl font-serif font-bold text-brand-deep-navy">{selectedApp.full_name}</h3>
              </div>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-brand-off-white/60 p-4 rounded-lg">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase">Role Applied</div>
                  <div className="text-sm font-medium text-brand-deep-navy mt-0.5">{selectedApp.role_applied_for || 'Associate'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase">Status</div>
                  <div className="mt-1"><StatusBadge status={selectedApp.status} /></div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase">Application Date</div>
                  <div className="text-sm font-mono mt-0.5">{new Date(selectedApp.created_at).toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-brand-deep-navy uppercase tracking-wider">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={15} className="text-gray-400" />
                    <span>{selectedApp.phone || <em className="text-gray-400">Not provided</em>}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail size={15} className="text-gray-400" />
                    <span>{selectedApp.email || <em className="text-gray-400">Not provided</em>}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                    <MapPin size={15} className="text-gray-400" />
                    <span>{selectedApp.city || <em className="text-gray-400">Not provided</em>}</span>
                  </div>
                </div>
              </div>

              {selectedApp.message && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-brand-deep-navy uppercase tracking-wider">Applicant Note</h4>
                  <div className="bg-gray-50 p-3.5 rounded-lg text-sm text-gray-700 italic border border-gray-100">
                    "{selectedApp.message}"
                  </div>
                </div>
              )}

              {selectedApp.decline_reason && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider">Decline Reason</h4>
                  <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800 border border-red-200">
                    {selectedApp.decline_reason}
                  </div>
                </div>
              )}

              {selectedApp.escalation_note && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Escalation Note</h4>
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-200">
                    {selectedApp.escalation_note}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-brand-charcoal bg-white border border-brand-soft-grey rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              {selectedApp.status === 'PENDING_TL_REVIEW' && (
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    handleOpenApprove(selectedApp);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Approve Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Approve Modal */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-brand-deep-navy">Approve Application</h3>
              <button 
                onClick={() => setShowApproveModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            {createdCredentials ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2 font-medium">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span>Associate account created and assigned to you!</span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm font-mono">
                  <div><strong>Name:</strong> {createdCredentials.name}</div>
                  <div><strong>Login User ID:</strong> {createdCredentials.userCode}</div>
                  <div><strong>Temporary Password:</strong> {createdCredentials.temporaryPassword}</div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    onClick={handleCopyCredentials}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-architectural-blue text-white rounded hover:bg-brand-deep-navy"
                  >
                    <Copy size={15} />
                    <span>Copy Credentials</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setCreatedCredentials(null);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  Are you sure you want to approve the application for <strong>{selectedApp.full_name}</strong>?
                </p>

                <div className="bg-blue-50/60 p-3.5 rounded-lg border border-blue-100 text-xs text-brand-charcoal space-y-1">
                  <div><strong>Applicant:</strong> {selectedApp.full_name}</div>
                  <div><strong>Mobile:</strong> {selectedApp.phone || 'Not provided'}</div>
                  <div><strong>Email:</strong> {selectedApp.email || 'Not provided'}</div>
                  <div><strong>Assignment:</strong> Assigned directly under your team leadership.</div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-deep-navy">
                    <input
                      type="checkbox"
                      checked={createAccountDirectly}
                      onChange={e => setCreateAccountDirectly(e.target.checked)}
                      className="rounded text-brand-architectural-blue focus:ring-brand-architectural-blue"
                    />
                    <span>Provision Associate portal account now (Optional)</span>
                  </label>
                  <p className="text-[11px] text-gray-500 ml-5 mt-0.5">
                    If unchecked, the application will simply be marked Approved for Admin workflow.
                  </p>
                </div>

                {createAccountDirectly && (
                  <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-3 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                        Portal Login User ID *
                      </label>
                      <input
                        type="text"
                        value={manualLoginId}
                        onChange={e => setManualLoginId(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm font-mono"
                        placeholder="e.g. KHU0099"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                        Temporary Password *
                      </label>
                      <input
                        type="text"
                        value={manualPassword}
                        onChange={e => setManualPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm font-mono"
                        placeholder="e.g. Khu@1234"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowApproveModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleApprove}
                    className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : createAccountDirectly ? 'Approve & Create Account' : 'Confirm Approval'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Decline Modal */}
      {showDeclineModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-red-700">Decline Application</h3>
              <button 
                onClick={() => setShowDeclineModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleDecline} className="space-y-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to decline the application for <strong>{selectedApp.full_name}</strong>?
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                  Decline Reason / Feedback
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide reason for declining this candidate..."
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Escalate to STL Modal */}
      {showEscalateModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-blue-700">Escalate to Senior Team Leader</h3>
              <button 
                onClick={() => setShowEscalateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleEscalate} className="space-y-4">
              <p className="text-sm text-gray-700">
                Escalate <strong>{selectedApp.full_name}</strong>'s application to Senior Team Leader review.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                  Escalation Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional escalation reason or note for STL..."
                  value={escalateNote}
                  onChange={e => setEscalateNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Escalating...' : 'Confirm Escalate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
