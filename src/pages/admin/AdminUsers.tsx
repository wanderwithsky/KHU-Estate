import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatUser } from '../../utils/formatUser';
export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select(`
        *,
        parent:parent_user_id ( full_name, user_code )
      `)
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleCreateStl = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-stl', {
        body: formData
      });

      if (invokeError) {
        let errMessage = invokeError.message;
        if (invokeError.context && typeof invokeError.context.json === 'function') {
          try {
            const errData = await invokeError.context.json();
            errMessage = errData.error || errData.message || errMessage;
          } catch(e) {}
        }
        throw new Error(errMessage || 'Failed to create Senior TL');
      }

      setSuccess(`Success! Code: ${data.userCode}, Temp Password: ${data.tempPassword}`);
      setFormData({ fullName: '', email: '', mobile: '', address: '', joiningDate: new Date().toISOString().split('T')[0] });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif text-brand-deep-navy">Users & Hierarchy</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-deep-navy text-white px-4 py-2 text-sm font-medium hover:bg-brand-architectural-blue transition-colors"
        >
          Create Senior TL
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-off-white text-brand-charcoal uppercase text-xs tracking-wider border-b border-brand-soft-grey">
            <tr>
              <th className="px-6 py-4 font-medium">User Code</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium">Reports To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-soft-grey">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">No users found.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-brand-warm-white/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-brand-architectural-blue">{user.user_code}</td>
                  <td className="px-6 py-4">
                    <div>{formatUser(user.user_code, user.full_name)}</div>
                    <div className="text-xs text-brand-charcoal/60">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">{user.role.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-brand-charcoal/60">{new Date(user.joining_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-brand-charcoal/60">
                    {user.parent ? formatUser(user.parent.user_code, user.parent.full_name) : (user.role === 'ADMIN' ? '-' : 'Admin')}
                  </td>
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
            <h3 className="text-lg font-serif text-brand-deep-navy mb-4">Create Senior Team Leader</h3>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-200 rounded">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm border border-green-200 rounded break-all">{success}</div>}

            <form onSubmit={handleCreateStl} className="space-y-4">
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
                {creating ? 'Creating...' : 'Create Senior TL'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
