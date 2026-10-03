import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, X } from 'lucide-react';
import BusinessSpreadsheet from '../../components/BusinessSpreadsheet';
import { formatUser } from '../../utils/formatUser';
import { formatCurrency } from '../../utils/formatCurrency';
import UserSelector from '../../components/UserSelector';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function AdminBusiness() {
  const { profile: adminProfile } = useCurrentUser();
  const [records, setRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    assigned_user_id: '',
    customer_name: '',
    phone: '',
    address: '',
    project_name: '',
    area_sqft: '',
    total_amount: '',
    booking_amount: '',
    commission_percent: '',
    total_income: '',
    balance_amount: '',
    remarks: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRes = await supabase
        .from('user_profiles')
        .select('id, user_code, full_name, role')
        .in('role', ['SENIOR_TL', 'TEAM_LEADER', 'ASSOCIATE'])
        .eq('status', 'ACTIVE')
        .order('user_code');
        
      if (!usersRes.error) {
        setUsers(usersRes.data || []);
      }

      const recordsRes = await supabase
        .from('businesses')
        .select(`*, user_profiles:assigned_user_id(user_code, full_name, role)`)
        .not('customer_name', 'is', null) // Only fetch flat admin records
        .order('created_at', { ascending: false });
      
      if (!recordsRes.error) {
        setRecords(recordsRes.data || []);
      }
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
      record.user_profiles?.user_code?.toLowerCase().includes(term) ||
      record.user_profiles?.full_name?.toLowerCase().includes(term)
    );
  });

  const handleOpenModal = (record: any = null) => {
    setError('');
    if (record) {
      setCurrentRecord(record);
      setFormData({
        assigned_user_id: record.assigned_user_id,
        customer_name: record.customer_name,
        phone: record.phone,
        address: record.address,
        project_name: record.project_name,
        area_sqft: record.area_sqft.toString(),
        total_amount: (record.deal_amount || record.total_amount || 0).toString(),
        booking_amount: record.booking_amount.toString(),
        commission_percent: record.commission_percent.toString(),
        total_income: record.total_income.toString(),
        balance_amount: record.balance_amount.toString(),
        remarks: record.notes || record.remarks || ''
      });
    } else {
      setCurrentRecord(null);
      setFormData({
        assigned_user_id: '',
        customer_name: '',
        phone: '',
        address: '',
        project_name: '',
        area_sqft: '',
        total_amount: '',
        booking_amount: '',
        commission_percent: '',
        total_income: '',
        balance_amount: '',
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleView = (record: any) => {
    setCurrentRecord(record);
    setIsViewModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      // Validate
      if (!formData.assigned_user_id) {
        throw new Error('Please select an assigned user.');
      }
      
      const userExists = users.some(u => u.id === formData.assigned_user_id);
      if (!userExists) {
        throw new Error('The selected user is no longer available. Please select another user.');
      }
      
      if (Number(formData.booking_amount) > Number(formData.total_amount)) {
        throw new Error('Booking Amount cannot exceed Total Amount.');
      }
      if (Number(formData.balance_amount) < 0) {
        throw new Error('Balance Amount cannot be negative.');
      }
      
      const payload = {
        assigned_user_id: formData.assigned_user_id,
        customer_name: formData.customer_name,
        phone: formData.phone,
        address: formData.address,
        project_name: formData.project_name,
        area_sqft: Number(formData.area_sqft),
        deal_amount: Number(formData.total_amount),
        booking_amount: Number(formData.booking_amount),
        commission_percent: Number(formData.commission_percent),
        total_income: Number(formData.total_income),
        balance_amount: Number(formData.balance_amount),
        notes: formData.remarks
      };
      
      const assignedUserObj = users.find(u => u.id === payload.assigned_user_id);
      let res;
      if (currentRecord) {
        res = await supabase
          .from('businesses')
          .update(payload)
          .eq('id', currentRecord.id)
          .select(`*, user_profiles:assigned_user_id(user_code, full_name, role)`)
          .single();
          
        const oldAssignedUser = currentRecord.assigned_user_id !== payload.assigned_user_id;
        if (oldAssignedUser) {
          await supabase.from('audit_logs').insert({
            action: 'ADMIN_REASSIGNED_BUSINESS_RECORD',
            module: 'BUSINESS',
            actor_user_id: adminProfile?.id,
            entity_id: currentRecord.id,
            entity_type: 'BUSINESS',
            new_data: { 
              old_assigned: currentRecord.assigned_user_id, 
              new_assigned: payload.assigned_user_id,
              admin_code: adminProfile?.user_code,
              admin_name: adminProfile?.full_name,
              assigned_user_code: assignedUserObj?.user_code,
              assigned_user_name: assignedUserObj?.full_name
            }
          });
        } else {
          await supabase.from('audit_logs').insert({
            action: 'ADMIN_UPDATED_BUSINESS_RECORD',
            module: 'BUSINESS',
            actor_user_id: adminProfile?.id,
            entity_id: currentRecord.id,
            entity_type: 'BUSINESS',
            new_data: { 
              old_assigned: currentRecord.assigned_user_id, 
              new_assigned: payload.assigned_user_id 
            }
          });
        }
      } else {
        res = await supabase
          .from('businesses')
          .insert({
            ...payload,
            created_by: adminProfile?.id
          })
          .select(`*, user_profiles:assigned_user_id(user_code, full_name, role)`)
          .single();
          
        if (res.data) {
          await supabase.from('audit_logs').insert({
            action: 'ADMIN_CREATED_BUSINESS_RECORD',
            module: 'BUSINESS',
            actor_user_id: adminProfile?.id,
            entity_id: res.data.id,
            entity_type: 'BUSINESS',
            new_data: { 
              assigned_to: payload.assigned_user_id,
              admin_code: adminProfile?.user_code,
              admin_name: adminProfile?.full_name,
              assigned_user_code: assignedUserObj?.user_code,
              assigned_user_name: assignedUserObj?.full_name
            }
          });
        }
      }
      
      if (res.error) throw res.error;
      
      await fetchData(); // Refresh list
      setIsModalOpen(false);
      alert(`Business record ${currentRecord ? 'updated' : 'created'} successfully.`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    totalRecords: filteredRecords.length,
    totalBusiness: filteredRecords.reduce((sum, r) => sum + Number(r.total_amount || 0), 0),
    totalBooking: filteredRecords.reduce((sum, r) => sum + Number(r.booking_amount || 0), 0),
    totalIncome: filteredRecords.reduce((sum, r) => sum + Number(r.total_income || 0), 0),
    totalBalance: filteredRecords.reduce((sum, r) => sum + Number(r.balance_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">Business Management</h2>
          <p className="text-sm text-brand-charcoal/70">Manage all customer business records globally.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded shadow-sm hover:bg-brand-primary/90 transition-colors"
        >
          <Plus size={18} /> Add New Record
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Records</p>
          <p className="text-xl font-serif text-brand-deep-navy">{stats.totalRecords}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Business Amount</p>
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
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Total Balance Amount</p>
          <p className="text-xl font-serif text-brand-deep-navy text-red-700">{formatCurrency(stats.totalBalance)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={18} />
          <input
            type="text"
            placeholder="Search by customer, phone, project, user code..."
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
        <BusinessSpreadsheet 
          records={filteredRecords} 
          isAdmin={true} 
          onEdit={handleOpenModal} 
          onView={handleView}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-deep-navy/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl relative flex flex-col max-h-[90vh] md:max-h-[85vh]">
            <div className="p-5 border-b border-brand-soft-grey bg-brand-off-white rounded-t-lg shrink-0 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-serif text-brand-deep-navy">
                {currentRecord ? 'Edit Business Record' : 'Add New Record'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-brand-charcoal/50 hover:text-brand-deep-navy transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
                    {error}
                  </div>
                )}
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 relative z-50">
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Assign To *</label>
                  <UserSelector 
                    users={users}
                    value={formData.assigned_user_id}
                    onChange={(id) => setFormData(prev => ({ ...prev, assigned_user_id: id }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Customer Name *</label>
                  <input type="text" name="customer_name" required value={formData.customer_name} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Phone *</label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Address *</label>
                  <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Project Name *</label>
                  <input type="text" name="project_name" required value={formData.project_name} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Area (sqft) *</label>
                  <input type="number" min="0" step="any" name="area_sqft" required value={formData.area_sqft} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Total Amount *</label>
                  <input type="number" min="0" step="any" name="total_amount" required value={formData.total_amount} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Booking Amount *</label>
                  <input type="number" min="0" step="any" name="booking_amount" required value={formData.booking_amount} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Commission (%) *</label>
                  <input type="number" min="0" max="100" step="any" name="commission_percent" required value={formData.commission_percent} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Total Income *</label>
                  <input type="number" min="0" step="any" name="total_income" required value={formData.total_income} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Balance Amount *</label>
                  <input type="number" min="0" step="any" name="balance_amount" required value={formData.balance_amount} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brand-deep-navy mb-1">Remarks</label>
                  <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleChange} className="w-full p-2 border border-brand-soft-grey rounded focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                </div>
              </div>
              
                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-brand-soft-grey">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-brand-charcoal bg-white border border-brand-soft-grey rounded hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-primary/90 disabled:opacity-50">
                    {saving ? 'Saving...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && currentRecord && (
        <div className="fixed inset-0 z-50 bg-brand-deep-navy/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 relative">
            <button 
              onClick={() => setIsViewModalOpen(false)}
              className="absolute right-4 top-4 text-brand-charcoal/50 hover:text-brand-deep-navy"
            >
              <X size={24} />
            </button>
            <div className="p-6 border-b border-brand-soft-grey bg-brand-off-white rounded-t-lg">
              <h3 className="text-xl font-serif text-brand-deep-navy">View Business Record</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Assigned To</p>
                  <p className="font-medium text-brand-deep-navy">
                    {currentRecord.user_profiles ? formatUser(currentRecord.user_profiles.user_code, currentRecord.user_profiles.full_name) : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Customer</p>
                  <p className="font-medium text-brand-deep-navy">{currentRecord.customer_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Phone</p>
                  <p className="font-medium text-brand-deep-navy">{currentRecord.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Project</p>
                  <p className="font-medium text-brand-deep-navy">{currentRecord.project_name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Address</p>
                  <p className="font-medium text-brand-deep-navy">{currentRecord.address}</p>
                </div>
                
                <div className="col-span-2 border-t border-brand-soft-grey pt-4 mt-2">
                  <h4 className="font-serif text-brand-deep-navy mb-4">Financial Summary</h4>
                </div>
                
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Area</p>
                  <p className="font-medium text-brand-deep-navy">{currentRecord.area_sqft} sqft</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Total Amount</p>
                  <p className="font-medium text-brand-deep-navy">{formatCurrency(currentRecord.deal_amount || currentRecord.total_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Booking Amount</p>
                  <p className="font-medium text-brand-deep-navy">{formatCurrency(currentRecord.booking_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Commission %</p>
                  <p className="font-medium text-brand-deep-navy">{currentRecord.commission_percent}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Total Income</p>
                  <p className="font-medium text-green-700">{formatCurrency(currentRecord.total_income)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Balance Amount</p>
                  <p className="font-medium text-red-700">{formatCurrency(currentRecord.balance_amount)}</p>
                </div>
                
                <div className="col-span-2 border-t border-brand-soft-grey pt-4 mt-2">
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Remarks</p>
                  <p className="font-medium text-brand-deep-navy">{currentRecord.notes || currentRecord.remarks || '-'}</p>
                </div>
                
                <div className="col-span-2 text-xs text-brand-charcoal/60 mt-4 text-right">
                  Created on {new Date(currentRecord.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
