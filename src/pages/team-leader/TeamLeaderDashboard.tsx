import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function TeamLeaderDashboard() {
  const { session } = useAuth();
  const { profile } = useCurrentUser();
  const [applications, setApplications] = useState<any[]>([]);
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
    if (profile) fetchApplications();
  }, [profile]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('associate_applications')
      .select('*')
      .eq('assigned_tl_id', profile?.id)
      .in('status', ['PENDING_TL_REVIEW']) // TL only needs to see their pending apps here
      .order('created_at', { ascending: false });
    
    if (data) setApplications(data);
    setLoading(false);
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
        throw new Error(invokeError.message || 'Failed to create Associate account');
      }

      setSuccess(`Account Created! Code: ${data.userCode}, Temp Password: ${data.tempPassword}`);
      setTimeout(() => {
        setShowApproveModal(false);
        setSuccess('');
        setSelectedApp(null);
        fetchApplications();
      }, 5000); // give them time to copy it, or close manually
      
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
      fetchApplications();
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
        
        fetchApplications();
    } catch (e) {
        console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif text-brand-deep-navy">Assigned Applications</h2>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-off-white text-brand-charcoal uppercase text-xs tracking-wider border-b border-brand-soft-grey">
            <tr>
              <th className="px-6 py-4 font-medium">App Number</th>
              <th className="px-6 py-4 font-medium">Applicant</th>
              <th className="px-6 py-4 font-medium">Phone / City</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-soft-grey">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : applications.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">No pending applications found.</td></tr>
            ) : (
              applications.map(app => (
                <tr key={app.id} className="hover:bg-brand-warm-white/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-brand-architectural-blue">{app.application_number}</td>
                  <td className="px-6 py-4">
                    <div>{app.full_name}</div>
                    <div className="text-xs text-brand-charcoal/60">{app.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{app.phone}</div>
                    <div className="text-xs text-brand-charcoal/60">{app.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => { setSelectedApp(app); setShowApproveModal(true); }}
                      className="text-green-600 hover:text-green-800 text-xs uppercase font-medium tracking-wider"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleSendToStl(app)}
                      className="text-blue-600 hover:text-blue-800 text-xs uppercase font-medium tracking-wider"
                    >
                      Escalate
                    </button>
                    <button 
                      onClick={() => { setSelectedApp(app); setShowDeclineModal(true); }}
                      className="text-red-600 hover:text-red-800 text-xs uppercase font-medium tracking-wider"
                    >
                      Decline
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* APPROVE MODAL */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl relative">
            <button onClick={() => setShowApproveModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">X</button>
            <h3 className="text-lg font-serif text-brand-deep-navy mb-4">Create Associate Account</h3>
            <p className="text-sm text-brand-charcoal mb-4">
              Approving application <strong>{selectedApp.application_number}</strong> for {selectedApp.full_name}.
              This will immediately provision a Supabase Auth identity.
            </p>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-200 rounded">{error}</div>}
            {success ? (
                <div className="mb-4 p-4 bg-green-50 text-green-700 text-sm border border-green-200 rounded flex flex-col space-y-2">
                    <strong className="text-base text-green-900">Account successfully created!</strong>
                    <span>Please securely provide these credentials to the user, or they will be sent via email (if configured).</span>
                    <div className="bg-white p-3 rounded border border-green-100 font-mono select-all">
                        {success}
                    </div>
                </div>
            ) : (
                <button 
                onClick={handleApprove}
                disabled={processing} 
                className="w-full bg-green-600 text-white p-3 text-sm font-medium hover:bg-green-700 mt-4 transition-colors"
                >
                {processing ? 'Provisioning Account...' : 'Create Account & Send Credentials'}
                </button>
            )}
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {showDeclineModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl relative">
            <button onClick={() => setShowDeclineModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">X</button>
            <h3 className="text-lg font-serif text-brand-deep-navy mb-4">Decline Application</h3>
            
            <form onSubmit={handleDecline} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Reason for Declining</label>
                <textarea 
                    required 
                    rows={3}
                    value={declineReason} 
                    onChange={e => setDeclineReason(e.target.value)} 
                    className="w-full border border-gray-300 p-2 text-sm resize-none" 
                />
              </div>
              <button type="submit" disabled={processing} className="w-full bg-red-600 text-white p-3 text-sm font-medium hover:bg-red-700 mt-4">
                {processing ? 'Declining...' : 'Confirm Decline'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
