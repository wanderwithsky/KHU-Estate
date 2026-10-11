import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatCurrency } from '../../utils/formatCurrency';
import { 
  Plus, X, Download, Briefcase, IndianRupee, TrendingUp, 
  Search, RefreshCw, CheckCircle, AlertCircle 
} from 'lucide-react';

export default function AssociateSelfPerformance() {
  const { profile } = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    business_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    phone: '',
    project_name: '',
    address: '',
    area_sqft: '',
    total_amount: '',
    booking_amount: '',
    balance_amount: '0',
    commission_percent: '5',
    total_income: '0',
    remarks: ''
  });

  const fetchRecords = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      setError('');
      // Strictly query records personally entered by this authenticated Associate
      const { data, error: fetchError } = await supabase
        .from('stl_self_performance')
        .select('*')
        .eq('stl_id', profile.id)
        .order('business_date', { ascending: false });

      if (fetchError) throw fetchError;
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching personal records:', err.message);
      setError('Failed to load your personal business records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    // Realtime subscription for instant synchronization
    const channel = supabase
      .channel('assoc_self_perf_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stl_self_performance',
          filter: `stl_id=eq.${profile.id}`
        },
        () => {
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateFields = (data: typeof formData) => {
    const total = Number(data.total_amount) || 0;
    const booking = Number(data.booking_amount) || 0;
    const rate = Number(data.commission_percent) || 5;
    
    const balance = Math.max(0, total - booking);
    const income = (total * rate) / 100;

    return {
      ...data,
      balance_amount: balance.toString(),
      total_income: income.toString()
    };
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(calculateFields(updated));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      // Validations
      if (!formData.customer_name?.trim()) {
        throw new Error('Customer Name is required.');
      }
      if (!formData.phone?.trim()) {
        throw new Error('Phone number is required.');
      }
      if (!formData.project_name?.trim()) {
        throw new Error('Project Name is required.');
      }
      const totalNum = Number(formData.total_amount);
      if (isNaN(totalNum) || totalNum <= 0) {
        throw new Error('Total Amount must be a valid positive number.');
      }
      const bookingNum = Number(formData.booking_amount);
      if (isNaN(bookingNum) || bookingNum < 0) {
        throw new Error('Booking Amount cannot be negative.');
      }
      if (bookingNum > totalNum) {
        throw new Error('Booking Amount cannot exceed Total Amount.');
      }

      const balanceNum = Math.max(0, totalNum - bookingNum);
      const commissionRate = Number(formData.commission_percent) || 5;
      const incomeNum = (totalNum * commissionRate) / 100;

      const payload = {
        stl_id: profile.id, // Authenticated associate's profile id
        business_date: formData.business_date,
        customer_name: formData.customer_name.trim(),
        phone: formData.phone.trim(),
        project_name: formData.project_name.trim(),
        location: formData.address?.trim() || '',
        address: formData.address?.trim() || '',
        area_sqft: Number(formData.area_sqft) || 0,
        total_amount: totalNum,
        booking_amount: bookingNum,
        balance_amount: balanceNum,
        commission_percent: commissionRate,
        total_income: incomeNum,
        remarks: formData.remarks?.trim() || ''
      };

      const { error: insertError } = await supabase
        .from('stl_self_performance')
        .insert(payload);

      if (insertError) throw insertError;

      setIsModalOpen(false);
      setSuccessMsg('Personal business record saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);

      // Reset form
      setFormData({
        business_date: new Date().toISOString().split('T')[0],
        customer_name: '',
        phone: '',
        project_name: '',
        address: '',
        area_sqft: '',
        total_amount: '',
        booking_amount: '',
        balance_amount: '0',
        commission_percent: '5',
        total_income: '0',
        remarks: ''
      });

      await fetchRecords();
    } catch (err: any) {
      setError(err.message || 'Error saving business record.');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      'Sr. No.',
      'Business Date',
      'Customer Name',
      'Phone',
      'Address',
      'Project Name',
      'Area (sq.ft)',
      'Total Amount (INR)',
      'Booking Amount (INR)',
      'Balance Amount (INR)',
      'Commission Rate (%)',
      'Income (INR)',
      'Remarks'
    ];

    const csvRows = [headers.join(',')];

    filteredRecords.forEach((record, idx) => {
      const row = [
        idx + 1,
        record.business_date,
        `"${(record.customer_name || '').replace(/"/g, '""')}"`,
        `"${(record.phone || '').replace(/"/g, '""')}"`,
        `"${(record.address || record.location || '').replace(/"/g, '""')}"`,
        `"${(record.project_name || '').replace(/"/g, '""')}"`,
        record.area_sqft || 0,
        record.total_amount || 0,
        record.booking_amount || 0,
        record.balance_amount || 0,
        record.commission_percent || 5,
        record.total_income || ((Number(record.total_amount || 0) * (Number(record.commission_percent) || 5)) / 100),
        `"${(record.remarks || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    a.setAttribute('download', `Associate_Self_Performance_${profile?.user_code || 'Records'}_${dateStr}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filtered records
  const filteredRecords = records.filter(r => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      (r.customer_name && r.customer_name.toLowerCase().includes(term)) ||
      (r.phone && r.phone.toLowerCase().includes(term)) ||
      (r.project_name && r.project_name.toLowerCase().includes(term)) ||
      (r.address && r.address.toLowerCase().includes(term)) ||
      (r.location && r.location.toLowerCase().includes(term))
    );
  });

  // Calculate Aggregates
  const stats = {
    totalDeals: filteredRecords.length,
    totalBusiness: filteredRecords.reduce((sum, r) => sum + Number(r.total_amount || 0), 0),
    totalBooking: filteredRecords.reduce((sum, r) => sum + Number(r.booking_amount || 0), 0),
    totalBalance: filteredRecords.reduce((sum, r) => sum + Number(r.balance_amount || 0), 0),
    totalIncome: filteredRecords.reduce((sum, r) => {
      const inc = r.total_income != null 
        ? Number(r.total_income) 
        : (Number(r.total_amount || 0) * (Number(r.commission_percent) || 5)) / 100;
      return sum + inc;
    }, 0)
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Self Performance</h2>
          <p className="text-sm text-brand-charcoal/70">
            Track and record your personally generated business and earned commissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportCSV}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white text-brand-charcoal border border-brand-soft-grey font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 text-sm"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-architectural-blue text-white font-medium rounded-md hover:bg-brand-deep-navy transition-colors shadow-sm text-sm"
          >
            <Plus size={16} />
            <span>Add Self Business</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-3 text-sm animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-lg border border-brand-soft-grey shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-brand-charcoal/60">Personal Deals</span>
            <div className="p-2 bg-blue-50 text-brand-architectural-blue rounded-full">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif text-brand-deep-navy font-bold">{stats.totalDeals}</div>
          <p className="text-xs text-brand-charcoal/60 mt-1">Total personal sales</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-brand-soft-grey shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-brand-charcoal/60">Total Business</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif text-emerald-700 font-bold">{formatCurrency(stats.totalBusiness)}</div>
          <p className="text-xs text-brand-charcoal/60 mt-1">Gross sales amount</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-brand-soft-grey shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-brand-charcoal/60">Booking Amount</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif text-indigo-700 font-bold">{formatCurrency(stats.totalBooking)}</div>
          <p className="text-xs text-brand-charcoal/60 mt-1">Upfront received</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-brand-soft-grey shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-brand-charcoal/60">Balance Due</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-full">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif text-amber-700 font-bold">{formatCurrency(stats.totalBalance)}</div>
          <p className="text-xs text-brand-charcoal/60 mt-1">Pending payments</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-brand-soft-grey shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-brand-charcoal/60">Total Income (5%)</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-full">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif text-green-700 font-bold">{formatCurrency(stats.totalIncome)}</div>
          <p className="text-xs text-brand-charcoal/60 mt-1">Personal earnings</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-brand-soft-grey shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer, project, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-architectural-blue"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchRecords}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-charcoal/80 bg-gray-50 border border-brand-soft-grey rounded-md hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Excel-Style Tabular View */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-brand-charcoal text-[11px] uppercase tracking-wider bg-gray-50/70 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Sr. No.</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Customer Name</th>
                <th className="px-5 py-3.5 font-semibold">Phone</th>
                <th className="px-5 py-3.5 font-semibold">Project Name</th>
                <th className="px-5 py-3.5 font-semibold">Area (Sq.ft)</th>
                <th className="px-5 py-3.5 font-semibold text-right">Total Amount (₹)</th>
                <th className="px-5 py-3.5 font-semibold text-right">Booking (₹)</th>
                <th className="px-5 py-3.5 font-semibold text-right">Balance (₹)</th>
                <th className="px-5 py-3.5 font-semibold text-center">Comm. (%)</th>
                <th className="px-5 py-3.5 font-semibold text-right">Income (₹)</th>
                <th className="px-5 py-3.5 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-brand-charcoal/60">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-brand-architectural-blue" />
                      <span>Loading personal business records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-brand-charcoal/60">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Briefcase size={32} className="text-gray-300" />
                      <p className="font-medium text-gray-700">No personal business entries found.</p>
                      <p className="text-xs text-gray-500">
                        {searchQuery ? 'Try adjusting your search criteria.' : "Click 'Add Self Business' to enter your first personally generated deal."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => {
                  const commPercent = Number(record.commission_percent) || 5;
                  const totalAmt = Number(record.total_amount) || 0;
                  const incomeAmt = record.total_income != null 
                    ? Number(record.total_income) 
                    : (totalAmt * commPercent) / 100;

                  return (
                    <tr key={record.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-500">{idx + 1}</td>
                      <td className="px-5 py-3.5 text-xs font-mono">
                        {record.business_date ? new Date(record.business_date).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-brand-deep-navy">
                        {record.customer_name}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 font-mono">
                        {record.phone || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {record.project_name}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono">
                        {record.area_sqft ? Number(record.area_sqft).toLocaleString('en-IN') : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-brand-architectural-blue font-mono">
                        ₹{totalAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-emerald-700 font-mono">
                        ₹{Number(record.booking_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-amber-700 font-mono">
                        ₹{Number(record.balance_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono text-xs">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-semibold">
                          {commPercent}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-green-700 font-mono">
                        ₹{Math.round(incomeAmt).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate" title={record.remarks || ''}>
                        {record.remarks || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Self Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-serif text-brand-deep-navy font-bold">Add Self Business</h2>
                <p className="text-xs text-brand-charcoal/60 mt-0.5">
                  Enter your personally generated real estate deal.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-start gap-2 rounded-r">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                    Business Date *
                  </label>
                  <input
                    type="date"
                    name="business_date"
                    required
                    value={formData.business_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    placeholder="Enter customer full name"
                    required
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="project_name"
                    placeholder="e.g. KHU Green Valley"
                    required
                    value={formData.project_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                    Location / Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. Sector 12, Lucknow"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                    Plot Area (Sq.ft)
                  </label>
                  <input
                    type="number"
                    name="area_sqft"
                    placeholder="e.g. 1000"
                    min="0"
                    step="any"
                    value={formData.area_sqft}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Financial Calculations Section */}
              <div className="pt-3 border-t border-gray-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-deep-navy mb-3">
                  Financial & Commission Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                      Total Amount (₹) *
                    </label>
                    <input
                      type="number"
                      name="total_amount"
                      placeholder="e.g. 1500000"
                      required
                      min="1"
                      step="any"
                      value={formData.total_amount}
                      onChange={handleNumericChange}
                      className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                      Booking Amount (₹) *
                    </label>
                    <input
                      type="number"
                      name="booking_amount"
                      placeholder="e.g. 300000"
                      required
                      min="0"
                      step="any"
                      value={formData.booking_amount}
                      onChange={handleNumericChange}
                      className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                      Balance Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="balance_amount"
                      readOnly
                      value={formData.balance_amount}
                      className="w-full border border-gray-200 rounded-md p-2.5 text-sm bg-gray-50 text-gray-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-blue-50/50 p-3.5 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1">
                      Associate Commission Rate (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="commission_percent"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.commission_percent}
                        onChange={handleNumericChange}
                        className="w-24 border border-gray-200 rounded-md p-2 text-sm bg-white font-mono"
                      />
                      <span className="text-xs text-gray-500 font-medium">Standard Associate rate is 5%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1">
                      Calculated Income (₹)
                    </label>
                    <div className="text-xl font-serif font-bold text-green-700 pt-1">
                      ₹{Math.round(Number(formData.total_income || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-brand-charcoal/80 uppercase tracking-wider mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  name="remarks"
                  placeholder="Optional details or payment notes"
                  rows={2}
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-architectural-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-brand-charcoal bg-white border border-brand-soft-grey rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm font-medium bg-brand-architectural-blue text-white rounded-md hover:bg-brand-deep-navy transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Self Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
