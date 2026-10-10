import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search } from 'lucide-react';
import BusinessSpreadsheet from '../../components/BusinessSpreadsheet';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatCurrency } from '../../utils/formatCurrency';

interface MyBusinessProps {
  selfOnly?: boolean;
}

export default function MyBusiness({ selfOnly = false }: MyBusinessProps) {
  const { profile } = useCurrentUser();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('businesses')
        .select(`
          *,
          client:client_id(name, phone, client_number),
          project:project_id(name),
          assigned_user:assigned_user_id(user_code, full_name, role),
          associate:associate_id(user_code, full_name, role),
          tl:tl_id(user_code, full_name, role),
          stl:stl_id(user_code, full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (selfOnly) {
        query = query.eq('associate_id', profile?.id);
      } else if (profile?.role === 'ASSOCIATE') {
        query = query.eq('associate_id', profile.id);
      } else if (profile?.role === 'TEAM_LEADER') {
        query = query.or(`associate_id.eq.${profile.id},tl_id.eq.${profile.id}`);
      } else if (profile?.role === 'SENIOR_TL') {
        query = query.or(`associate_id.eq.${profile.id},tl_id.eq.${profile.id},stl_id.eq.${profile.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const mappedRecords = (data || []).map((r: any) => ({
        ...r,
        customer_name: r.customer_name || r.client?.name || 'N/A',
        phone: r.phone || r.client?.phone || 'N/A',
        project_name: r.project_name || r.project?.name || 'N/A',
        // Optional: map user_profiles for BusinessSpreadsheet
        user_profiles: r.assigned_user || r.associate || r.tl || r.stl || undefined,
        assigned_user_id: r.assigned_user_id || r.associate_id || r.tl_id || r.stl_id
      }));
      
      setRecords(mappedRecords);
    } catch (err: any) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      record.customer_name?.toLowerCase().includes(term) ||
      record.phone?.toLowerCase().includes(term) ||
      record.project_name?.toLowerCase().includes(term) ||
      record.business_number?.toLowerCase().includes(term)
    );
  });

  const stats = {
    totalCustomers: filteredRecords.length,
    totalBusiness: filteredRecords.reduce((sum, r) => sum + Number(r.deal_amount || r.total_amount || 0), 0),
    totalBooking: filteredRecords.reduce((sum, r) => sum + Number(r.booking_amount || 0), 0),
    totalIncome: filteredRecords.reduce((sum, r) => sum + Number(r.total_income || 0), 0),
    totalBalance: filteredRecords.reduce((sum, r) => sum + Number(r.balance_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Business Details</h2>
          <p className="text-sm text-brand-charcoal/70">Your assigned customer and business records.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Customers</p>
          <p className="text-xl font-serif text-brand-deep-navy">{stats.totalCustomers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Business</p>
          <p className="text-xl font-serif text-brand-deep-navy">{formatCurrency(stats.totalBusiness)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Booking Amount</p>
          <p className="text-xl font-serif text-brand-deep-navy text-green-700">{formatCurrency(stats.totalBooking)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Income</p>
          <p className="text-xl font-serif text-brand-deep-navy text-green-700">{formatCurrency(stats.totalIncome)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Balance</p>
          <p className="text-xl font-serif text-brand-deep-navy text-red-700">{formatCurrency(stats.totalBalance)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={18} />
          <input
            type="text"
            placeholder="Search by customer, phone, project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-brand-soft-grey rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-brand-soft-grey">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-brand-charcoal/60">Loading records...</p>
        </div>
      ) : (
        <BusinessSpreadsheet records={filteredRecords} isAdmin={false} />
      )}
    </div>
  );
}
