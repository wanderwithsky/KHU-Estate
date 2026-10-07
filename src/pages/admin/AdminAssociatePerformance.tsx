import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { Download, Filter, RefreshCw, MapPin, Award } from 'lucide-react';

export default function AdminAssociatePerformance() {
  const [loading, setLoading] = useState(false);
  const [associates, setAssociates] = useState<any[]>([]);
  const [selectedAssociate, setSelectedAssociate] = useState<string>('');
  
  // Data
  const [selfBusiness, setSelfBusiness] = useState<any[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    searchCustomer: ''
  });

  useEffect(() => {
    fetchAssociates();
  }, []);

  useEffect(() => {
    if (selectedAssociate) {
      fetchPerformanceData();
    } else {
      setSelfBusiness([]);
    }
  }, [selectedAssociate]);

  useEffect(() => {
    // Real-time subscription for businesses table
    const channel = supabase
      .channel('businesses_changes_assoc')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          if (selectedAssociate) {
            fetchPerformanceData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAssociate]);

  const fetchAssociates = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, user_code, full_name')
      .eq('role', 'ASSOCIATE')
      .eq('status', 'ACTIVE')
      .order('full_name');
      
    if (data) setAssociates(data);
  };

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch Associate's self business
      const { data: selfData } = await supabase
        .from('businesses')
        .select('*, user_profiles:assigned_user_id(id, user_code, full_name, role)')
        .eq('assigned_user_id', selectedAssociate)
        .order('created_at', { ascending: false });
        
      setSelfBusiness(selfData || []);
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      project: '',
      searchCustomer: ''
    });
  };

  // Filtering Logic
  const applyFilters = (data: any[]) => {
    return data.filter(record => {
      let match = true;
      if (filters.dateFrom) match = match && new Date(record.created_at) >= new Date(filters.dateFrom);
      if (filters.dateTo) match = match && new Date(record.created_at) <= new Date(filters.dateTo + 'T23:59:59');
      if (filters.project) match = match && record.project_name.toLowerCase().includes(filters.project.toLowerCase());
      if (filters.searchCustomer) match = match && record.customer_name?.toLowerCase().includes(filters.searchCustomer.toLowerCase());
      return match;
    });
  };

  const filteredSelf = applyFilters(selfBusiness);

  // Summaries
  const selfTotals = filteredSelf.reduce((acc, curr) => ({
    records: acc.records + 1,
    totalAmount: acc.totalAmount + (curr.deal_amount || curr.total_amount || 0),
    bookingAmount: acc.bookingAmount + (curr.booking_amount || 0),
    income: acc.income + (curr.total_income || 0),
    balance: acc.balance + (curr.balance_amount || 0)
  }), { records: 0, totalAmount: 0, bookingAmount: 0, income: 0, balance: 0 });

  const avgBusinessAmount = selfTotals.records > 0 ? selfTotals.totalAmount / selfTotals.records : 0;

  // CSV Export
  const exportCSV = (data: any[], filename: string) => {
    let csv = '';
    const headers = ['Date', 'Customer Name', 'Phone', 'Project', 'Area (sqft)', 'Total Amount', 'Booking Amount', 'Commission %', 'Total Income', 'Balance', 'Remarks'];
    
    csv += headers.join(',') + '\n';
    
    data.forEach(row => {
      const date = new Date(row.created_at).toLocaleDateString();
      const cust = `"${row.customer_name || ''}"`;
      const proj = `"${row.project_name || ''}"`;
      const remarks = `"${(row.notes || row.remarks || '').replace(/"/g, '""')}"`;
      
      const values = [date, cust, row.phone, proj, row.area_sqft, row.deal_amount || row.total_amount, row.booking_amount, row.commission_percent, row.total_income, row.balance_amount, remarks];
      
      csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-brand-deep-navy">Associate Performance</h1>
          <p className="text-sm text-brand-charcoal/70">Analyze Individual Associate business records</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedAssociate}
            onChange={(e) => setSelectedAssociate(e.target.value)}
            className="w-full sm:w-64 p-2.5 border border-brand-soft-grey rounded-md text-sm bg-white focus:ring-2 focus:ring-brand-architectural-blue outline-none"
          >
            <option value="">Select Associate</option>
            {associates.map(assoc => (
              <option key={assoc.id} value={assoc.id}>{assoc.user_code} — {assoc.full_name}</option>
            ))}
          </select>
          {loading && <RefreshCw size={20} className="animate-spin text-brand-architectural-blue" />}
        </div>
      </div>

      {selectedAssociate && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey mb-8">
            <div className="flex items-center gap-2 mb-4 text-brand-deep-navy font-medium text-sm">
              <Filter size={16} /> Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date From</label>
                <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date To</label>
                <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Project</label>
                <input type="text" name="project" value={filters.project} onChange={handleFilterChange} placeholder="Search project" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Customer</label>
                <input type="text" name="searchCustomer" value={filters.searchCustomer} onChange={handleFilterChange} placeholder="Customer name" className="w-full p-2 border rounded" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={resetFilters} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">Reset</button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
              <span className="text-xs text-gray-500 uppercase font-medium">Business Records</span>
              <span className="text-2xl font-serif text-brand-deep-navy mt-2">{selfTotals.records}</span>
            </div>
            <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
              <span className="text-xs text-gray-500 uppercase font-medium">Total Business</span>
              <span className="text-xl font-medium text-brand-architectural-blue mt-2">{formatCurrency(selfTotals.totalAmount)}</span>
            </div>
            <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
              <span className="text-xs text-gray-500 uppercase font-medium">Booking Amount</span>
              <span className="text-xl font-medium text-brand-deep-navy mt-2">{formatCurrency(selfTotals.bookingAmount)}</span>
            </div>
            <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
              <span className="text-xs text-gray-500 uppercase font-medium">Total Income</span>
              <span className="text-xl font-medium text-green-600 mt-2">{formatCurrency(selfTotals.income)}</span>
            </div>
            <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
              <span className="text-xs text-gray-500 uppercase font-medium">Balance Amount</span>
              <span className="text-xl font-medium text-red-500 mt-2">{formatCurrency(selfTotals.balance)}</span>
            </div>
            <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
              <span className="text-xs text-gray-500 uppercase font-medium">Average Deal</span>
              <span className="text-xl font-medium text-indigo-500 mt-2">{formatCurrency(avgBusinessAmount)}</span>
            </div>
          </div>

          {/* Self Business Table */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
              <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
                Self Business <span className="bg-white px-2 py-0.5 rounded-full text-xs border">{filteredSelf.length}</span>
              </h2>
              <button onClick={() => exportCSV(filteredSelf, 'Associate_Business')} className="flex items-center gap-1 text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
                <Download size={14} /> Export Business CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Customer Name</th>
                    <th className="px-6 py-3 font-medium">Phone</th>
                    <th className="px-6 py-3 font-medium">Project</th>
                    <th className="px-6 py-3 font-medium text-right">Area (sqft)</th>
                    <th className="px-6 py-3 font-medium text-right">Total Amount</th>
                    <th className="px-6 py-3 font-medium text-right">Booking</th>
                    <th className="px-6 py-3 font-medium text-right">Comm %</th>
                    <th className="px-6 py-3 font-medium text-right">Total Income</th>
                    <th className="px-6 py-3 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredSelf.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">{new Date(record.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3 font-medium">{record.customer_name}</td>
                      <td className="px-6 py-3">{record.phone}</td>
                      <td className="px-6 py-3">{record.project_name}</td>
                      <td className="px-6 py-3 text-right">{record.area_sqft}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(record.deal_amount || record.total_amount)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(record.booking_amount)}</td>
                      <td className="px-6 py-3 text-right">{record.commission_percent}%</td>
                      <td className="px-6 py-3 text-right text-green-600 font-medium">{formatCurrency(record.total_income)}</td>
                      <td className="px-6 py-3 text-right text-red-500">{formatCurrency(record.balance_amount)}</td>
                    </tr>
                  ))}
                  {filteredSelf.length === 0 && (
                    <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500">No self business records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Additional Performance (Placeholders for real DB integration) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-brand-soft-grey text-center">
              <MapPin className="text-gray-300 mx-auto mb-4" size={48} />
              <h3 className="font-serif text-brand-deep-navy text-lg mb-2">Plot Visits</h3>
              <p className="text-sm text-gray-500">Real database visits will appear here when configured.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-brand-soft-grey text-center">
              <Award className="text-gray-300 mx-auto mb-4" size={48} />
              <h3 className="font-serif text-brand-deep-navy text-lg mb-2">Rewards & Targets</h3>
              <p className="text-sm text-gray-500">Real database rewards will appear here when configured.</p>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
