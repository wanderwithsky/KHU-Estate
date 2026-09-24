import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function AdminApplications() {
  const { profile } = useCurrentUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Action State
  const [declineReason, setDeclineReason] = useState('');
  const [selectedTlId, setSelectedTlId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile?.role === 'ADMIN') {
      fetchApplications();
      fetchTeamLeaders();
    }
  }, [profile]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('associate_applications')
      .select(`*, assigned_tl:assigned_tl_id (user_code, full_name)`)
      .order('created_at', { ascending: false });
    
    if (data) setApplications(data);
    setLoading(false);
  };

  const fetchTeamLeaders = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, user_code, full_name')
      .eq('role', 'TEAM_LEADER')
      .eq('status', 'ACTIVE');
    if (data) setTeamLeaders(data);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-associate', {
        body: {
          applicationId: selectedApp.id,
          fullName: selectedApp.full_name,
          email: selectedApp.email,
          isAdminApproval: true // Special flag for Edge function
        }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to create Associate account');
      }

      setSuccess(`Account Created! Code: ${data.userCode}, Temp Password: ${data.tempPassword}`);
      setTimeout(() => {
        setShowApproveModal(false);
        setSuccess('');
        fetchApplications();
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
          status: 'DECLINED_BY_STL', // using existing enum value for now
          decline_reason: declineReason,
          declined_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

      if (error) throw error;
      
      setShowDeclineModal(false);
      setDeclineReason('');
      fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Error declining application');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedApp || !selectedTlId) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('associate_applications')
        .update({ 
          assigned_tl_id: selectedTlId,
          status: 'PENDING_TL_REVIEW'
        })
        .eq('id', selectedApp.id);

      if (error) throw error;
      
      setShowTransferModal(false);
      setSelectedTlId('');
      fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Error transferring application');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-6">Loading applications...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif text-brand-deep-navy">Associate Applications</h1>
          <p className="text-sm text-brand-charcoal/70">Global view of all applications</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-off-white text-brand-charcoal text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Applicant</th>
              <th className="px-6 py-4 font-medium">Contact</th>
              <th className="px-6 py-4 font-medium">TL Code</th>
              <th className="px-6 py-4 font-medium">Assigned TL</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-brand-deep-navy">{app.full_name}</div>
                  <div className="text-xs text-brand-charcoal/60">{new Date(app.created_at).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-brand-charcoal">{app.email}</div>
                  <div className="text-sm text-brand-charcoal">{app.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{app.referral_code || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">{app.assigned_tl ? `${app.assigned_tl.full_name} (${app.assigned_tl.user_code})` : 'Unassigned (Admin)'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    app.status.includes('PENDING') ? 'bg-yellow-100 text-yellow-800' :
                    app.status.includes('APPROVED') ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {app.status.includes('PENDING') && (
                      <>
                        <button 
                          onClick={() => { setSelectedApp(app); setShowApproveModal(true); }}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => { setSelectedApp(app); setShowTransferModal(true); }}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Transfer
                        </button>
                        <button 
                          onClick={() => { setSelectedApp(app); setShowDeclineModal(true); }}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-brand-charcoal">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals go here */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4">Create ID & Password for {selectedApp.full_name}</h2>
            
            {success ? (
              <div className="bg-green-50 text-green-800 p-4 rounded mb-6 text-sm font-medium">
                {success}
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-brand-charcoal/60 uppercase">Email</p>
                  <p className="font-medium">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-charcoal/60 uppercase">Mobile</p>
                  <p className="font-medium">{selectedApp.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-charcoal/60 uppercase">Team Leader</p>
                  <p className="font-medium">{selectedApp.assigned_tl ? selectedApp.assigned_tl.full_name : 'Not Assigned'}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => { setShowApproveModal(false); setSuccess(''); }}
                className="px-4 py-2 text-sm text-brand-charcoal hover:bg-gray-100 rounded"
              >
                {success ? 'CLOSE' : 'CANCEL'}
              </button>
              {!success && (
                <button 
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-4 py-2 text-sm bg-brand-architectural-blue text-white rounded hover:bg-brand-deep-navy disabled:opacity-50"
                >
                  {processing ? 'CREATING...' : 'CREATE ID & PASSWORD'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showTransferModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4">Transfer Application</h2>
            <p className="text-sm mb-4">Select a Team Leader to transfer {selectedApp.full_name}'s application to:</p>
            
            <select
              value={selectedTlId}
              onChange={(e) => setSelectedTlId(e.target.value)}
              className="w-full border p-2 mb-6"
            >
              <option value="">Select Team Leader...</option>
              {teamLeaders.map(tl => (
                <option key={tl.id} value={tl.id}>{tl.user_code} - {tl.full_name}</option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-sm hover:bg-gray-100 rounded"
              >
                CANCEL
              </button>
              <button 
                onClick={handleTransfer}
                disabled={processing || !selectedTlId}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
              >
                {processing ? 'TRANSFERRING...' : 'TRANSFER APPLICATION'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeclineModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4">Decline Application</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Reason for decline (Optional)</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 text-sm text-brand-charcoal hover:bg-gray-100 rounded"
              >
                CANCEL
              </button>
              <button 
                onClick={handleDecline}
                disabled={processing}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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
