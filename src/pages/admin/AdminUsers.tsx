import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatUser } from '../../utils/formatUser';
import { Search, Filter, Edit2, Eye, Ban, RefreshCw } from 'lucide-react';
import UserActionModal from '../../components/admin/UserActionModal';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // Action Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<'VIEW' | 'EDIT' | 'SUSPEND' | 'REVIVE' | null>(null);

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

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        (user.user_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Users & Hierarchy</h2>
          <p className="text-brand-charcoal/60">Global master list of all users across the organization.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-deep-navy text-white px-5 py-2.5 text-sm tracking-widest font-bold uppercase hover:bg-brand-architectural-blue transition-colors"
        >
          Create Senior TL
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-brand-charcoal/10 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={18} />
          <input 
            type="text" 
            placeholder="Search by Code, Name, or Email..." 
            className="w-full pl-10 pr-4 py-2 border border-brand-charcoal/20 rounded-md focus:outline-none focus:border-brand-architectural-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-brand-charcoal/60" />
          <select 
            className="w-full md:w-auto border border-brand-charcoal/20 rounded-md py-2 px-3 focus:outline-none focus:border-brand-architectural-blue"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-off-white text-brand-charcoal uppercase text-xs tracking-wider border-b border-brand-soft-grey">
              <tr>
                <th className="px-6 py-4 font-medium">User Code & Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Reports To</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft-grey">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"/><div className="h-3 bg-gray-100 rounded w-24"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"/><div className="h-3 bg-gray-100 rounded w-24"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"/></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"/></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-brand-charcoal/60">No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-brand-warm-white/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-deep-navy">{formatUser(user.user_code, user.full_name)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-brand-charcoal">{user.email}</div>
                      <div className="text-xs text-brand-charcoal/60 mt-1">{user.mobile || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold tracking-widest uppercase text-brand-charcoal/70">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.parent ? (
                        <div className="text-brand-architectural-blue font-medium hover:underline cursor-pointer">
                          {formatUser(user.parent.user_code, user.parent.full_name)}
                        </div>
                      ) : (
                        <span className="text-brand-charcoal/50 italic">{user.role === 'ADMIN' ? '-' : 'Admin'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-brand-charcoal/70">
                      {user.joining_date && user.joining_date !== '1970-01-01' ? new Date(user.joining_date).toLocaleDateString() : 'Not available'}
                    </td>
                    <td className="px-6 py-4 relative">
                      <div className="flex gap-2 text-sm relative">
                        <button onClick={() => { setSelectedUser(user); setActionType('VIEW'); }} className="text-brand-architectural-blue hover:underline flex items-center gap-1" title="View"><Eye size={16}/></button>
                        <button onClick={() => { setSelectedUser(user); setActionType('EDIT'); }} className="text-brand-charcoal/60 hover:text-brand-charcoal hover:underline flex items-center gap-1" title="Edit"><Edit2 size={16}/></button>
                        {user.status === 'SUSPENDED' ? (
                          <button onClick={() => { setSelectedUser(user); setActionType('REVIVE'); }} className="text-brand-gold hover:underline flex items-center gap-1" title="Revive"><RefreshCw size={16}/></button>
                        ) : (
                          <button onClick={() => { setSelectedUser(user); setActionType('SUSPEND'); }} className="text-red-500 hover:underline flex items-center gap-1" title="Suspend"><Ban size={16}/></button>
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

      {actionType && selectedUser && (
        <UserActionModal
          user={selectedUser}
          action={actionType}
          onClose={() => {
            setActionType(null);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setActionType(null);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">X</button>
            <h3 className="text-xl font-serif text-brand-deep-navy mb-4">Create Senior Team Leader</h3>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-200 rounded">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm border border-green-200 rounded break-all">{success}</div>}

            <form onSubmit={handleCreateStl} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Full Name</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-gray-300 p-2 text-sm rounded focus:border-brand-architectural-blue focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 p-2 text-sm rounded focus:border-brand-architectural-blue focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Mobile</label>
                <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full border border-gray-300 p-2 text-sm rounded focus:border-brand-architectural-blue focus:outline-none" />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-brand-deep-navy text-white p-3 text-sm font-bold tracking-widest uppercase hover:bg-brand-architectural-blue mt-4 transition-colors">
                {creating ? 'Creating...' : 'Create Senior TL'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
