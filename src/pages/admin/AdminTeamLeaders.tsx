import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatUser } from '../../utils/formatUser';
import { Search, Filter, Eye, Edit2, Ban, RefreshCw } from 'lucide-react';
import UserActionModal from '../../components/admin/UserActionModal';

export default function AdminTeamLeaders() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<'VIEW' | 'EDIT' | 'SUSPEND' | 'REVIVE' | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          parent:parent_user_id ( full_name, user_code ),
          team:user_profiles!parent_user_id(id)
        `)
        .eq('role', 'TEAM_LEADER')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err: any) {
      setError('Unable to load users.');
    } finally {
      setLoading(false);
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

  // KPIs
  const total = users.length;
  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const totalAssociates = users.reduce((acc, user) => acc + (user.team?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Team Leaders</h2>
          <p className="text-brand-charcoal/60">Manage Team Leaders across the organization.</p>
        </div>
        <button 
          className="bg-brand-deep-navy text-white px-5 py-2.5 text-sm tracking-widest font-bold uppercase hover:bg-brand-architectural-blue transition-colors"
          onClick={() => alert('Please use the Applications flow to promote/create Team Leaders, or implement direct creation here if required.')}
        >
          Create Team Leader
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-brand-charcoal/10 rounded-lg shadow-sm">
          <div className="text-sm font-bold tracking-widest uppercase text-brand-charcoal/50 mb-1">Total TLs</div>
          <div className="text-3xl font-serif text-brand-deep-navy">{total}</div>
        </div>
        <div className="bg-white p-6 border border-brand-charcoal/10 rounded-lg shadow-sm">
          <div className="text-sm font-bold tracking-widest uppercase text-brand-charcoal/50 mb-1">Active</div>
          <div className="text-3xl font-serif text-green-700">{activeCount}</div>
        </div>
        <div className="bg-white p-6 border border-brand-charcoal/10 rounded-lg shadow-sm">
          <div className="text-sm font-bold tracking-widest uppercase text-brand-charcoal/50 mb-1">Total Associates under TLs</div>
          <div className="text-3xl font-serif text-brand-gold">{totalAssociates}</div>
        </div>
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

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline text-sm">Try Again</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-brand-off-white text-brand-charcoal uppercase text-xs tracking-wider border-b border-brand-soft-grey">
                <tr>
                  <th className="px-6 py-4 font-medium">User Code & Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Senior Team Leader</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Associates</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-soft-grey">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"/><div className="h-3 bg-gray-100 rounded w-24"/></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"/><div className="h-3 bg-gray-100 rounded w-24"/></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"/></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16"/></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8"/></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"/></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"/></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-brand-charcoal/60">No Team Leaders found.</td></tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-brand-warm-white/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-deep-navy">{formatUser(user.user_code, user.full_name)}</div>
                        <div className="text-xs text-brand-charcoal/60 mt-1">Team Leader</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-brand-charcoal">{user.email}</div>
                        <div className="text-xs text-brand-charcoal/60 mt-1">{user.mobile || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {user.parent ? (
                          <div className="text-brand-architectural-blue font-medium hover:underline cursor-pointer">
                            {formatUser(user.parent.user_code, user.parent.full_name)}
                          </div>
                        ) : (
                          <span className="text-brand-charcoal/50 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-brand-architectural-blue">
                        {user.team?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-brand-charcoal/70">
                        {user.joining_date && user.joining_date !== '1970-01-01' ? new Date(user.joining_date).toLocaleDateString() : 'Not available'}
                      </td>
                      <td className="px-6 py-4">
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
      )}

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
    </div>
  );
}
