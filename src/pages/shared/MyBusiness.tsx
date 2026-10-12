import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, RefreshCw, X } from 'lucide-react';
import BusinessSpreadsheet from '../../components/BusinessSpreadsheet';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatCurrency } from '../../utils/formatCurrency';
import { mapBusinessRecord } from '../../utils/businessMapping';

interface MyBusinessProps {
  selfOnly?: boolean;
}

export default function MyBusiness({ selfOnly = false }: MyBusinessProps) {
  const { profile } = useCurrentUser();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View Modal state
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchData();

    // Realtime subscription for business changes
    const channel = supabase
      .channel(`businesses_changes_mybiz_${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          fetchData(true);
        }
      )
      .subscribe();

    // Window focus refetching for accurate data across tabs
    const handleFocus = () => {
      fetchData(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, [profile?.id, profile?.role]);

  const fetchData = async (isBackground = false) => {
    if (!profile?.id) return;
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

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
        query = query.or(`associate_id.eq.${profile.id},assigned_user_id.eq.${profile.id}`);
      } else if (profile.role === 'ASSOCIATE') {
        query = query.or(`associate_id.eq.${profile.id},assigned_user_id.eq.${profile.id}`);
      } else if (profile.role === 'TEAM_LEADER') {
        // TL Total Business: shows records assigned to this TL by Admin or self
        query = query.or(`associate_id.eq.${profile.id},assigned_user_id.eq.${profile.id}`);
      } else if (profile.role === 'SENIOR_TL') {
        query = query.or(`associate_id.eq.${profile.id},assigned_user_id.eq.${profile.id},tl_id.eq.${profile.id},stl_id.eq.${profile.id}`);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      
      const mappedRecords = (data || []).map((r: any) => mapBusinessRecord(r));
      setRecords(mappedRecords);
    } catch (err: any) {
      console.error('Error fetching data:', err.message);
      setError(err.message || 'Failed to fetch business records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      record.customer_name?.toLowerCase().includes(term) ||
      record.phone?.toLowerCase().includes(term) ||
      record.project_name?.toLowerCase().includes(term) ||
      record.notes?.toLowerCase().includes(term) ||
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

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Business Details</h2>
          <p className="text-sm text-brand-charcoal/70">Your assigned customer and business records.</p>
        </div>
        <button
          onClick={() => fetchData(false)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-brand-charcoal/80 bg-white border border-brand-soft-grey rounded-md hover:bg-brand-off-white transition-colors disabled:opacity-50 shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={loading || refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

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
        <BusinessSpreadsheet records={filteredRecords} isAdmin={false} onView={handleView} />
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-brand-soft-grey">
            <div className="flex justify-between items-center p-6 border-b border-brand-soft-grey bg-brand-off-white rounded-t-lg">
              <h3 className="text-xl font-serif text-brand-deep-navy">View Business Record</h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 text-brand-charcoal/60 hover:text-brand-charcoal hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Customer</p>
                  <p className="font-medium text-brand-deep-navy">{selectedRecord.customer_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Phone</p>
                  <p className="font-medium text-brand-deep-navy">{selectedRecord.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Project</p>
                  <p className="font-medium text-brand-deep-navy">{selectedRecord.project_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Area</p>
                  <p className="font-medium text-brand-deep-navy">{selectedRecord.area_sqft} sqft</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Address</p>
                  <p className="font-medium text-brand-deep-navy">{selectedRecord.address || '-'}</p>
                </div>
                
                <div className="col-span-2 border-t border-brand-soft-grey pt-4 mt-2">
                  <h4 className="font-serif text-brand-deep-navy mb-4 font-semibold">Financial Summary</h4>
                </div>
                
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Total Amount</p>
                  <p className="font-medium text-brand-deep-navy">{formatCurrency(selectedRecord.deal_amount || selectedRecord.total_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Booking Amount</p>
                  <p className="font-medium text-brand-deep-navy text-green-700">{formatCurrency(selectedRecord.booking_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Commission %</p>
                  <p className="font-medium text-brand-deep-navy">{selectedRecord.commission_percent}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Total Income</p>
                  <p className="font-medium text-green-700">{formatCurrency(selectedRecord.total_income)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Balance Amount</p>
                  <p className="font-medium text-red-700">{formatCurrency(selectedRecord.balance_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Date</p>
                  <p className="font-medium text-brand-deep-navy">{new Date(selectedRecord.created_at).toLocaleDateString()}</p>
                </div>
                
                <div className="col-span-2 border-t border-brand-soft-grey pt-4 mt-2">
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Remarks</p>
                  <p className="font-medium text-brand-deep-navy">{selectedRecord.notes || '-'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-brand-soft-grey bg-brand-off-white rounded-b-lg flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

