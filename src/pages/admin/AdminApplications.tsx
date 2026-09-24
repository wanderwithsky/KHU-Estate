import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatUser } from '../../utils/formatUser';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function AdminApplications() {
  const { profile } = useCurrentUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [seniorTeamLeaders, setSeniorTeamLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Action State
  const [declineReason, setDeclineReason] = useState('');
  const [selectedTlId, setSelectedTlId] = useState('');
  const [selectedStlId, setSelectedStlId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile?.role === 'ADMIN') {
      fetchApplications();
      fetchTeamLeaders();
      fetchSeniorTeamLeaders();
    }
  }, [profile]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('associate_applications')
      .select(`*, assigned_tl:assigned_tl_id (user_code, full_name), assigned_stl:assigned_stl_id (user_code, full_name)`)
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

  const fetchSeniorTeamLeaders = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, user_code, full_name')
      .eq('role', 'SENIOR_TL')
      .eq('status', 'ACTIVE');
    if (data) setSeniorTeamLeaders(data);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    try {
      const role = selectedApp.role_applied_for || 'Associate';
      let edgeFunction = 'create-associate';
      if (role === 'Team Leader') edgeFunction = 'create-tl';
      if (role === 'Senior Team Leader') edgeFunction = 'create-stl';

      const { data, error: invokeError } = await supabase.functions.invoke(edgeFunction, {
        body: {
          applicationId: selectedApp.id,
          isAdminApproval: true // Special flag for Edge function
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
        throw new Error(errMessage || `Failed to create ${role} account`);
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
    if (!selectedApp) return;
    const isTLApp = selectedApp.role_applied_for === 'Team Leader';
    const targetId = isTLApp ? selectedStlId : selectedTlId;

    if (!targetId) return;
    
    setProcessing(true);
    try {
      if (isTLApp) {
        // Use secure RPC for Team Leader transfer to Senior TL
        const { error } = await supabase.rpc('transfer_tl_application', {
          p_application_id: selectedApp.id,
          p_senior_tl_id: targetId
        });
        if (error) throw error;
      } else {
        // Keep existing Associate transfer to Team Leader
        const { error } = await supabase
          .from('associate_applications')
          .update({ 
            assigned_tl_id: targetId,
            status: 'PENDING_TL_REVIEW'
          })
          .eq('id', selectedApp.id);
        if (error) throw error;
      }
      
      setShowTransferModal(false);
      setSelectedTlId('');
      setSelectedStlId('');
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
          <h1 className="text-2xl font-serif text-brand-deep-navy">Applications</h1>
          <p className="text-sm text-brand-charcoal/70">Global view of all applications</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-off-white text-brand-charcoal text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Applicant</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Contact</th>
              <th className="px-6 py-4 font-medium">Referral Code</th>
              <th className="px-6 py-4 font-medium">Assigned To</th>
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
                  <span className="text-sm font-medium">{app.role_applied_for || 'Associate'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-brand-charcoal">{app.email}</div>
                  <div className="text-sm text-brand-charcoal">{app.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{app.referral_code || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">
                    {app.assigned_tl 
                      ? `TL: ${formatUser(app.assigned_tl.user_code, app.assigned_tl.full_name)}` 
                      : app.assigned_stl
                      ? `STL: ${formatUser(app.assigned_stl.user_code, app.assigned_stl.full_name)}`
                      : 'Unassigned (Admin)'}
                  </span>
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
                  <p className="font-medium">{selectedApp.assigned_tl ? formatUser(selectedApp.assigned_tl.user_code, selectedApp.assigned_tl.full_name) : 'Not Assigned'}</p>
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
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4">
              Transfer {selectedApp.role_applied_for === 'Team Leader' ? 'Team Leader' : 'Associate'} Application
            </h2>
            
            {selectedApp.role_applied_for === 'Team Leader' ? (
              <>
                <p className="text-sm mb-4">Select a Senior Team Leader to transfer {selectedApp.full_name}'s application to:</p>
                {seniorTeamLeaders.length === 0 ? (
                  <div className="p-4 bg-yellow-50 text-yellow-800 text-sm mb-6 rounded">
                    No active Senior Team Leaders available.
                  </div>
                ) : (
                  <select
                    value={selectedStlId}
                    onChange={(e) => setSelectedStlId(e.target.value)}
                    className="w-full border p-2 mb-6 rounded"
                  >
                    <option value="">Select Senior Team Leader</option>
                    {seniorTeamLeaders.map(stl => (
                      <option key={stl.id} value={stl.id}>{stl.user_code} — {stl.full_name}</option>
                    ))}
                  </select>
                )}
              </>
            ) : (
              <>
                <p className="text-sm mb-4">Select a Team Leader to transfer {selectedApp.full_name}'s application to:</p>
                {teamLeaders.length === 0 ? (
                  <div className="p-4 bg-yellow-50 text-yellow-800 text-sm mb-6 rounded">
                    No active Team Leaders available.
                  </div>
                ) : (
                  <select
                    value={selectedTlId}
                    onChange={(e) => setSelectedTlId(e.target.value)}
                    className="w-full border p-2 mb-6 rounded"
                  >
                    <option value="">Select Team Leader</option>
                    {teamLeaders.map(tl => (
                      <option key={tl.id} value={tl.id}>{tl.user_code} — {tl.full_name}</option>
                    ))}
                  </select>
                )}
              </>
            )}

            {(selectedApp.role_applied_for === 'Team Leader' ? selectedStlId : selectedTlId) && (
              <div className="mb-6 p-4 bg-blue-50 text-blue-900 rounded-md">
                <p className="text-xs font-semibold uppercase opacity-70 mb-1">
                  Selected {selectedApp.role_applied_for === 'Team Leader' ? 'Senior Team Leader' : 'Team Leader'}:
                </p>
                <p className="font-medium text-sm">
                  {selectedApp.role_applied_for === 'Team Leader' 
                    ? seniorTeamLeaders.find(stl => stl.id === selectedStlId)?.user_code + ' — ' + seniorTeamLeaders.find(stl => stl.id === selectedStlId)?.full_name
                    : teamLeaders.find(tl => tl.id === selectedTlId)?.user_code + ' — ' + teamLeaders.find(tl => tl.id === selectedTlId)?.full_name}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-sm hover:bg-gray-100 rounded"
              >
                CANCEL
              </button>
              <button 
                onClick={handleTransfer}
                disabled={processing || (selectedApp.role_applied_for === 'Team Leader' ? !selectedStlId : !selectedTlId)}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
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
