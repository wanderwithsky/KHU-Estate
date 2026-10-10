import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatCurrency } from '../../utils/formatCurrency';
import { format } from 'date-fns';

export default function MyCommissions() {
  const { profile } = useCurrentUser();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [stats, setStats] = useState({
    totalCommission: 0,
    pendingCommission: 0,
    approvedCommission: 0,
    paidCommission: 0
  });

  useEffect(() => {
    if (profile) {
      fetchCommissions();

      const channel = supabase
        .channel(`user_commissions_${profile.id}`)
        .on(
          'postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'commissions',
            filter: `user_id=eq.${profile.id}` 
          }, 
          () => {
            fetchCommissions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchCommissions = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          businesses:business_id(
            deal_amount,
            created_at,
            customer_name,
            project_name,
            client:client_id(name),
            project:project_id(name)
          ),
          user:user_id(id, user_code, full_name, role)
        `)
        .order('created_at', { ascending: false });
        
      // Enforce reading only own commissions for all roles
      query = query.eq('user_id', profile.id);
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      const records = (data || []).map((c: any) => ({
        ...c,
        businesses: c.businesses ? {
          ...c.businesses,
          customer_name: c.businesses.customer_name || c.businesses.client?.name || 'N/A',
          project_name: c.businesses.project_name || c.businesses.project?.name || 'N/A'
        } : null
      }));
      
      setCommissions(records);
      
      let totalComm = 0;
      let pendingComm = 0;
      let approvedComm = 0;
      let paidComm = 0;
      
      records.forEach(c => {
        const amt = Number(c.commission_amount) || 0;
        totalComm += amt;
        
        if (c.status === 'PAID') {
          paidComm += amt;
        } else if (c.status === 'APPROVED') {
          approvedComm += amt;
        } else {
          pendingComm += amt;
        }
      });
      
      setStats({
        totalCommission: totalComm,
        pendingCommission: pendingComm,
        approvedCommission: approvedComm,
        paidCommission: paidComm
      });
      
    } catch (err: any) {
      console.error('Error fetching commissions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommissions = commissions.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.commission_number?.toLowerCase().includes(term) ||
      c.businesses?.customer_name?.toLowerCase().includes(term) ||
      c.businesses?.project_name?.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term)
    );
  });

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Income Report</h2>
          <p className="text-sm text-brand-charcoal/70">Your commission history and payouts.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Earned</p>
          <p className="text-xl font-serif text-brand-deep-navy">{formatCurrency(stats.totalCommission)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Pending</p>
          <p className="text-xl font-serif text-amber-600">{formatCurrency(stats.pendingCommission)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Approved</p>
          <p className="text-xl font-serif text-blue-600">{formatCurrency(stats.approvedCommission)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey border-l-4 border-l-green-600">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Paid</p>
          <p className="text-xl font-serif text-green-700">{formatCurrency(stats.paidCommission)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey flex gap-4 items-center">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={18} />
          <input
            type="text"
            placeholder="Search commissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-brand-soft-grey rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden relative">
        {loading ? (
          <div className="p-8 text-center text-brand-charcoal/60">Loading commissions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-off-white text-brand-charcoal text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Commission ID</th>
                  <th className="px-6 py-4 font-medium">Business / Customer</th>
                  <th className="px-6 py-4 font-medium text-right">Base Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Commission Rate</th>
                  <th className="px-6 py-4 font-medium text-right">Payout</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCommissions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-brand-deep-navy">{c.commission_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-deep-navy">{c.businesses?.customer_name || 'N/A'}</div>
                      <div className="text-xs text-brand-charcoal/70">{c.businesses?.project_name}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(c.base_amount)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {c.commission_percentage}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-green-700">{formatCurrency(c.commission_amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        c.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        c.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-charcoal/70">
                      {format(new Date(c.created_at || c.generated_at), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
                
                {filteredCommissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-brand-charcoal">
                      No commission records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
