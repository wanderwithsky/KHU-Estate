import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Plus, X, Download } from 'lucide-react';

export default function SeniorTLSelfPerformance() {
  const { profile } = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    business_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    phone: '',
    project_name: '',
    location: '',
    area_sqft: '',
    total_amount: '',
    booking_amount: '',
    balance_amount: '',
    remarks: ''
  });

  const fetchRecords = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stl_self_performance')
        .select('*')
        .eq('stl_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching records:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateFields = (data: typeof formData) => {
    const total = Number(data.total_amount) || 0;
    const booking = Number(data.booking_amount) || 0;
    return {
      ...data,
      balance_amount: (total - booking).toString()
    };
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(calculateFields(newData));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    
    try {
      if (Number(formData.booking_amount) > Number(formData.total_amount)) {
        throw new Error('Booking Amount cannot exceed Total Amount.');
      }

      const payload = {
        stl_id: profile.id,
        business_date: formData.business_date,
        customer_name: formData.customer_name,
        phone: formData.phone,
        project_name: formData.project_name,
        location: formData.location,
        area_sqft: Number(formData.area_sqft) || 0,
        total_amount: Number(formData.total_amount),
        booking_amount: Number(formData.booking_amount),
        balance_amount: Number(formData.balance_amount),
        remarks: formData.remarks
      };
      
      const { error: insertError } = await supabase
        .from('stl_self_performance')
        .insert(payload);
        
      if (insertError) throw insertError;
      
      setIsModalOpen(false);
      setFormData({
        business_date: new Date().toISOString().split('T')[0],
        customer_name: '', phone: '', location: '', project_name: '',
        area_sqft: '', total_amount: '', booking_amount: '', balance_amount: '',
        remarks: ''
      });
      await fetchRecords();
    } catch (err: any) {
      setError(err.message || 'Error saving business record');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (records.length === 0) return;
    
    const headers = [
      'Sr. No.', 'Business Date', 'Client Name', 'Phone',
      'Project Name', 'Location', 'Area (sq.ft)', 'Total Amount',
      'Booking Amount', 'Balance Amount', 'Remarks'
    ];
    
    const csvRows = [headers.join(',')];
    
    records.forEach((record, idx) => {
      const row = [
        idx + 1,
        record.business_date,
        `"${(record.customer_name || '').replace(/"/g, '""')}"`,
        `"${(record.phone || '').replace(/"/g, '""')}"`,
        `"${(record.project_name || '').replace(/"/g, '""')}"`,
        `"${(record.location || '').replace(/"/g, '""')}"`,
        record.area_sqft || 0,
        record.total_amount,
        record.booking_amount,
        record.balance_amount,
        `"${(record.remarks || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    a.setAttribute('download', `STL_Self_Performance_${dateStr}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Self Performance</h2>
          <p className="text-sm text-brand-charcoal/70">Your personal business records and metrics.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white text-brand-charcoal border border-brand-soft-grey font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-architectural-blue text-white font-medium rounded-md hover:bg-brand-deep-navy transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add Self Business</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-brand-charcoal text-[10px] uppercase tracking-wider bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Sr. No.</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Client Name</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium text-right">Total (₹)</th>
                <th className="px-6 py-4 font-medium text-right">Booking (₹)</th>
                <th className="px-6 py-4 font-medium text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-brand-charcoal/60">No personal business entries found.</td></tr>
              ) : (
                records.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">{idx + 1}</td>
                    <td className="px-6 py-4">{new Date(record.business_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">{record.customer_name}</td>
                    <td className="px-6 py-4">{record.project_name}</td>
                    <td className="px-6 py-4 text-right text-brand-architectural-blue font-medium">
                      {Number(record.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {Number(record.booking_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {Number(record.balance_amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-serif text-brand-deep-navy">Add Personal Business</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Date *</label>
                  <input type="date" name="business_date" required value={formData.business_date} onChange={handleInputChange} className="w-full border border-gray-200 rounded p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Customer Name *</label>
                  <input type="text" name="customer_name" required value={formData.customer_name} onChange={handleInputChange} className="w-full border border-gray-200 rounded p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-200 rounded p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Project Name *</label>
                  <input type="text" name="project_name" required value={formData.project_name} onChange={handleInputChange} className="w-full border border-gray-200 rounded p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Location / Address</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full border border-gray-200 rounded p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Area (Sq.ft)</label>
                  <input type="number" name="area_sqft" value={formData.area_sqft} onChange={handleInputChange} className="w-full border border-gray-200 rounded p-2.5 text-sm" />
                </div>
                
                <div className="pt-4 mt-2 border-t border-gray-100 md:col-span-2">
                  <h3 className="text-sm font-medium text-brand-deep-navy mb-4">Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Total Amount (₹) *</label>
                      <input type="number" name="total_amount" required value={formData.total_amount} onChange={handleNumericChange} className="w-full border border-gray-200 rounded p-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Booking Amount (₹) *</label>
                      <input type="number" name="booking_amount" required value={formData.booking_amount} onChange={handleNumericChange} className="w-full border border-gray-200 rounded p-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Balance Amount (₹)</label>
                      <input type="number" name="balance_amount" readOnly value={formData.balance_amount} className="w-full border border-gray-200 rounded p-2.5 text-sm bg-gray-50" />
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-widest mb-1">Remarks</label>
                  <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={3} className="w-full border border-gray-200 rounded p-2.5 text-sm"></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-brand-charcoal bg-white border border-brand-soft-grey rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-architectural-blue text-white font-medium rounded hover:bg-brand-deep-navy disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Personal Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
