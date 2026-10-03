import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Briefcase, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Summary Stats
  const [stats, setStats] = useState({
    totalBusiness: 0,
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0
  });

  useEffect(() => {
    fetchCommissions();
    
    const channel = supabase
      .channel('commissions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commissions' }, () => {
        fetchCommissions();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          user_profiles:user_id(full_name, user_code),
          businesses:business_id(customer_name, project_name, deal_amount, payment_status, created_at)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const records = data || [];
      setCommissions(records);
      
      // Calculate stats
      let totalBusiness = 0;
      let totalComm = 0;
      let pendingComm = 0;
      let paidComm = 0;
      
      records.forEach(c => {
        const amt = Number(c.commission_amount) || 0;
        const busAmt = Number(c.base_amount) || 0;
        
        totalBusiness += busAmt;
        totalComm += amt;
        
        if (c.status === 'PAID') {
          paidComm += amt;
        } else {
          pendingComm += amt; // PENDING or APPROVED
        }
      });
      
      setStats({
        totalBusiness,
        totalCommission: totalComm,
        pendingCommission: pendingComm,
        paidCommission: paidComm
      });
      
    } catch (err: any) {
      console.error('Error fetching commissions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = 
      (c.user_profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.user_profiles?.user_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.businesses?.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.businesses?.project_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-brand-deep-navy">Commissions</h1>
        <p className="text-sm text-brand-charcoal/70">Manage partner and associate commissions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Assigned Business</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalBusiness)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Commission</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalCommission)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Commission</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.pendingCommission)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Paid Commission</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.paidCommission)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search user or client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-brand-soft-grey rounded-md focus:outline-none focus:border-brand-architectural-blue"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto p-2 border border-brand-soft-grey rounded-md text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-architectural-blue"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center absolute inset-0 bg-white/50 z-10">
              <div className="w-8 h-8 border-4 border-brand-architectural-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-brand-charcoal/70">
                <tr>
                  <th className="px-6 py-4 font-bold text-brand-architectural-blue">USER NAME</th>
                  <th className="px-6 py-4 font-bold text-brand-architectural-blue">COMMISSION %</th>
                  <th className="px-6 py-4 font-bold text-brand-architectural-blue">COMMISSION AMOUNT</th>
                  <th className="px-6 py-4 font-semibold">Business / Client</th>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Total Business</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCommissions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-deep-navy">{c.user_profiles?.full_name}</div>
                      <div className="text-xs text-brand-charcoal/70 font-mono">{c.user_profiles?.user_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-base font-semibold text-gray-700 bg-gray-100 inline-block px-2 py-1 rounded">
                        {c.commission_percentage}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-base font-bold text-green-700 bg-green-50 inline-block px-3 py-1 rounded border border-green-200">
                        {formatCurrency(c.commission_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{c.businesses?.customer_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.businesses?.project_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {formatCurrency(c.base_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        c.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        c.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                      {c.businesses?.payment_status && (
                        <div className="text-[10px] uppercase text-gray-500 mt-1">
                          Bus: {c.businesses.payment_status}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {c.businesses?.created_at ? format(new Date(c.businesses.created_at), 'dd MMM yyyy') : '-'}
                    </td>
                  </tr>
                ))}
                {!loading && filteredCommissions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No commission records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
