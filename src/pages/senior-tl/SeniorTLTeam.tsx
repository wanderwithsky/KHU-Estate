import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function SeniorTLTeam() {
  const { session } = useAuth();
  const { profile } = useCurrentUser();
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) fetchTeamLeaders();
  }, [profile]);

  const fetchTeamLeaders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('senior_tl_id', profile?.id)
      .eq('role', 'TEAM_LEADER')
      .order('created_at', { ascending: false });
    
    if (data) setTeamLeaders(data);
    setLoading(false);
  };

  const handleCreateTl = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://[PROJECT_REF].supabase.co/functions/v1/create-tl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create Team Leader');
      }

      setSuccess(`Success! Code: ${result.userCode}, Temp Password: ${result.tempPassword}`);
      setFormData({ fullName: '', email: '', mobile: '', address: '', joiningDate: new Date().toISOString().split('T')[0] });
      fetchTeamLeaders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif text-brand-deep-navy">My Team Leaders</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-deep-navy text-white px-4 py-2 text-sm font-medium hover:bg-brand-architectural-blue transition-colors"
        >
          Add Team Leader
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-off-white text-brand-charcoal uppercase text-xs tracking-wider border-b border-brand-soft-grey">
            <tr>
              <th className="px-6 py-4 font-medium">User Code</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-soft-grey">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : teamLeaders.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">No team leaders found.</td></tr>
            ) : (
              teamLeaders.map(tl => (
                <tr key={tl.id} className="hover:bg-brand-warm-white/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-brand-architectural-blue">{tl.user_code}</td>
                  <td className="px-6 py-4">
                    <div>{tl.full_name}</div>
                    <div className="text-xs text-brand-charcoal/60">{tl.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${tl.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {tl.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-brand-charcoal/60">{new Date(tl.joining_date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">X</button>
            <h3 className="text-lg font-serif text-brand-deep-navy mb-4">Add Team Leader</h3>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-200 rounded">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm border border-green-200 rounded break-all">{success}</div>}

            <form onSubmit={handleCreateTl} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Full Name</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Mobile</label>
                <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-brand-deep-navy text-white p-3 text-sm font-medium hover:bg-brand-architectural-blue mt-4">
                {creating ? 'Creating...' : 'Create Team Leader'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
