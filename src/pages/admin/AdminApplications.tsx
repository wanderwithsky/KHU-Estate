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
  const [statusFilter, setStatusFilter] = useState('ALL');

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
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    setErrorMsg('');
    setSuccess('');
    
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

      if (!data || !data.temporaryPassword) {
        throw new Error('Account creation partially succeeded, but no temporary password was returned from the server.');
      }

      setSuccess('Account Created Successfully!');
      setCreatedCredentials({
        name: selectedApp.full_name,
        userCode: data.userCode,
        email: data.email || selectedApp.email,
        temporaryPassword: data.temporaryPassword,
        role: data.role || role,
        manager: selectedApp.assigned_tl ? formatUser(selectedApp.assigned_tl.user_code, selectedApp.assigned_tl.full_name) : 'Not Assigned'
      });
      fetchApplications();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating account');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowApproveModal(false);
    setShowPassword(false);
    setSuccess('');
    setErrorMsg('');
    setCreatedCredentials(null);
    setSelectedApp(null);
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Welcome to KHU Developers!\n\nName: ${createdCredentials.name}\nUser ID: ${createdCredentials.userCode}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.temporaryPassword}\nRole: ${createdCredentials.role}\n\nPlease log in and change your temporary password immediately.`;
    navigator.clipboard.writeText(text);
    alert('Credentials copied to clipboard!');
  };

  const handleCopyPassword = () => {
    if (!createdCredentials) return;
    navigator.clipboard.writeText(createdCredentials.temporaryPassword);
    alert('Password copied to clipboard!');
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

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return app.status.includes('PENDING');
    if (statusFilter === 'APPROVED') return app.status.includes('APPROVED') || app.status === 'ACCOUNT_CREATED';
    if (statusFilter === 'DECLINED') return app.status.includes('DECLINED') || app.status.includes('REJECTED');
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-brand-deep-navy">Applications</h1>
          <p className="text-sm text-brand-charcoal/70">Global view of all applications</p>
        </div>
        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-brand-soft-grey rounded-md text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-architectural-blue shadow-sm min-w-[160px]"
          >
            <option value="ALL">All Applications</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-max">
            <thead className="bg-brand-off-white text-brand-charcoal text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Applicant</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Referral Code</th>
                <th className="px-6 py-4 font-medium">Assigned To</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium sticky right-0 bg-brand-off-white border-l border-gray-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)] z-10 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {filteredApplications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50 transition-colors bg-white group">
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
                <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50 transition-colors border-l border-gray-100 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)] z-0">
                  <div className="flex gap-2 justify-center min-w-[200px]">
                    {app.status.includes('PENDING') && (
                      <>
                        <button 
                          onClick={() => { 
                            setSelectedApp(app); 
                            setErrorMsg('');
                            setSuccess('');
                            setCreatedCredentials(null);
                            setShowApproveModal(true); 
                          }}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                        >
                          Approve
                        </button>

                        <button 
                          onClick={() => { setSelectedApp(app); setShowTransferModal(true); }}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                        >
                          Transfer
                        </button>
                        <button 
                          onClick={() => { setSelectedApp(app); setShowDeclineModal(true); }}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredApplications.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-brand-charcoal">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Modals go here */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-xl font-serif text-brand-deep-navy mb-4">
              {success ? 'Account Created Successfully' : `Create ID & Password for ${selectedApp.full_name}`}
            </h2>
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6 text-sm">
                <strong>Error:</strong> {errorMsg}
              </div>
            )}

            {success && createdCredentials ? (
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 text-green-800 p-4 rounded text-sm font-medium border border-green-200">
                  {success}
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Name:</span>
                    <span className="col-span-2 font-semibold">{createdCredentials.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">User ID:</span>
                    <span className="col-span-2 font-semibold text-brand-architectural-blue">{createdCredentials.userCode}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Email:</span>
                    <span className="col-span-2">{createdCredentials.email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-500 font-medium">Password:</span>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="font-mono bg-white px-2 py-1 border rounded flex-1">
                        {showPassword ? createdCredentials.temporaryPassword : '••••••••••••'}
                      </span>
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-xs text-brand-architectural-blue hover:underline"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                      <button 
                        onClick={handleCopyPassword}
                        className="text-xs text-gray-500 hover:text-gray-800"
                        title="Copy Password"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Role:</span>
                    <span className="col-span-2">{createdCredentials.role}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Manager:</span>
                    <span className="col-span-2">{createdCredentials.manager}</span>
                  </div>
                </div>
                <p className="text-xs text-red-600 font-medium mt-2">
                  * The user must change their temporary password after their first login.
                </p>
                <button 
                  onClick={handleCopyCredentials}
                  className="w-full mt-4 bg-brand-deep-navy text-white py-2 rounded text-sm hover:bg-brand-charcoal transition-colors"
                >
                  Copy Credentials
                </button>
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
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm text-brand-charcoal hover:bg-gray-100 rounded border"
              >
                CLOSE
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
