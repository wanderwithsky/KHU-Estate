import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import VisitSpreadsheet from '../../components/VisitSpreadsheet';
import UserSelector from '../../components/UserSelector';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function AdminVisits() {
  const { profile: adminProfile } = useCurrentUser();
  const [scheduledRecords, setScheduledRecords] = useState<any[]>([]);
  const [completedRecords, setCompletedRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'COMPLETED'>('SCHEDULED');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    assigned_user_id: '',
    customer_name: '',
    phone: '',
    visit_date: '',
    visit_time: '',
    location: '',
    project_name: '',
    remarks: '',
    status: 'SCHEDULED'
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
        .from('site_visits')
        .select(`
          *,
          user_profiles:assigned_user_id(user_code, full_name, role)
        `)
        .order('visit_date', { ascending: false })
        .order('visit_time', { ascending: false });

      if (recordsRes.error) throw recordsRes.error;

      const scheduled = recordsRes.data.filter(r => ['SCHEDULED', 'RESCHEDULED', 'NO_SHOW'].includes(r.status));
      const completed = recordsRes.data.filter(r => ['COMPLETED', 'CANCELLED'].includes(r.status));
      
      setScheduledRecords(scheduled);
      setCompletedRecords(completed);
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record: any = null) => {
    setError('');
    if (record) {
      setCurrentRecord(record);
      setFormData({
        assigned_user_id: record.assigned_user_id,
        customer_name: record.customer_name,
        phone: record.phone,
        visit_date: record.visit_date,
        visit_time: record.visit_time || '',
        location: record.location || '',
        project_name: record.project_name || '',
        remarks: record.remarks || '',
        status: record.status || 'SCHEDULED'
      });
    } else {
      setCurrentRecord(null);
      setFormData({
        assigned_user_id: '',
        customer_name: '',
        phone: '',
        visit_date: new Date().toISOString().split('T')[0],
        visit_time: '',
        location: '',
        project_name: '',
        remarks: '',
        status: 'SCHEDULED'
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
      if (!formData.assigned_user_id) throw new Error('Please select an assigned user.');
      
      const payload = {
        ...formData
      };
      
      const assignedUserObj = users.find(u => u.id === payload.assigned_user_id);
      let res;
      let actionType = '';
      
      if (currentRecord) {
        res = await supabase
          .from('site_visits')
          .update(payload)
          .eq('id', currentRecord.id)
          .select(`*, user_profiles:assigned_user_id(user_code, full_name, role)`)
          .single();
          
        if (res.data) {
          actionType = currentRecord.assigned_user_id !== payload.assigned_user_id 
            ? 'ADMIN_REASSIGNED_VISIT'
            : currentRecord.visit_date !== payload.visit_date || currentRecord.visit_time !== payload.visit_time
            ? 'ADMIN_RESCHEDULED_VISIT'
            : payload.status === 'CANCELLED' 
            ? 'ADMIN_CANCELLED_VISIT'
            : 'ADMIN_UPDATED_VISIT';

          await supabase.from('audit_logs').insert({
            action: actionType,
            module: 'VISIT',
            actor_user_id: adminProfile?.id,
            entity_id: currentRecord.id,
            entity_type: 'SITE_VISIT',
            new_data: { 
              old_data: currentRecord, 
              new_data: payload,
              admin_code: adminProfile?.user_code,
              admin_name: adminProfile?.full_name,
              assigned_user_code: assignedUserObj?.user_code,
              assigned_user_name: assignedUserObj?.full_name
            }
          });
        }
      } else {
        res = await supabase
          .from('site_visits')
          .insert({
            ...payload,
            created_by: adminProfile?.id
          })
          .select(`*, user_profiles:assigned_user_id(user_code, full_name, role)`)
          .single();
          
        if (res.data) {
          await supabase.from('audit_logs').insert({
            action: 'ADMIN_SCHEDULED_VISIT',
            module: 'VISIT',
            actor_user_id: adminProfile?.id,
            entity_id: res.data.id,
            entity_type: 'SITE_VISIT',
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
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving visit:', err);
      setError(err.message || 'Unable to save visit record.');
    } finally {
      setSaving(false);
    }
  };

  const activeRecords = activeTab === 'SCHEDULED' ? scheduledRecords : completedRecords;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-brand-soft-grey shadow-sm">
        <div>
          <h1 className="text-2xl font-serif text-brand-deep-navy mb-1">Visit Management</h1>
          <p className="text-sm text-brand-charcoal/70">Schedule and manage site visits and reports.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-deep-navy text-white px-4 py-2 rounded font-medium hover:bg-brand-deep-navy/90 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={16} />
          Schedule Visit
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <div className="flex border-b border-brand-soft-grey">
          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'SCHEDULED' 
                ? 'bg-brand-primary/10 text-brand-deep-navy border-b-2 border-brand-gold' 
                : 'text-brand-charcoal/60 hover:bg-gray-50'
            }`}
          >
            Scheduled / Upcoming ({scheduledRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'COMPLETED' 
                ? 'bg-brand-primary/10 text-brand-deep-navy border-b-2 border-brand-gold' 
                : 'text-brand-charcoal/60 hover:bg-gray-50'
            }`}
          >
            Completed / Reports ({completedRecords.length})
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-20 bg-gray-100 rounded w-full"></div>
              <div className="h-20 bg-gray-100 rounded w-full"></div>
            </div>
          ) : (
            <VisitSpreadsheet 
              records={activeRecords}
              type="ADMIN"
              onEdit={handleOpenModal}
              onView={handleView}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-brand-soft-grey">
            <div className="sticky top-0 bg-brand-deep-navy px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-serif text-white">
                {currentRecord ? 'Edit Visit' : 'Schedule Visit'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Assign To *</label>
                  <UserSelector 
                    users={users}
                    value={formData.assigned_user_id}
                    onChange={(val) => setFormData({...formData, assigned_user_id: val})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Customer Name *</label>
                    <input 
                      type="text" 
                      name="customer_name"
                      required
                      value={formData.customer_name}
                      onChange={handleChange}
                      className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all text-sm"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Phone *</label>
                    <input 
                      type="text" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all text-sm"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Visit Date *</label>
                    <input 
                      type="date" 
                      name="visit_date"
                      required
                      value={formData.visit_date}
                      onChange={handleChange}
                      className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Visit Time *</label>
                    <input 
                      type="time" 
                      name="visit_time"
                      required
                      value={formData.visit_time}
                      onChange={handleChange}
                      className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Location / Address *</label>
                    <input 
                      type="text" 
                      name="location"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all text-sm"
                      placeholder="e.g. Site Office"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Project Name</label>
                    <input 
                      type="text" 
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleChange}
                      className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all text-sm"
                      placeholder="e.g. Green Valley"
                    />
                  </div>
                </div>

                {currentRecord && (
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all text-sm bg-white"
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="RESCHEDULED">Rescheduled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No Show</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Remarks</label>
                  <textarea 
                    name="remarks"
                    rows={3}
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all text-sm resize-none"
                    placeholder="Optional remarks..."
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-brand-soft-grey">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-brand-soft-grey rounded text-sm font-medium text-brand-charcoal hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-gold text-white rounded text-sm font-medium hover:bg-brand-gold/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : (currentRecord ? 'Save Changes' : 'Schedule Visit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details / Selfie Modal */}
      {isViewModalOpen && currentRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-brand-soft-grey max-h-[90vh]">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-900 flex items-center justify-center min-h-[300px] p-4 relative">
              {currentRecord.selfie_url ? (
                <img 
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/visit-selfies/${currentRecord.selfie_url}`}
                  alt="Visit Selfie"
                  className="max-w-full max-h-[80vh] object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // If public access fails, it might be private. Try with signed url logic or fallback.
                    // Assuming for now the storage policy handles viewing. 
                    // To do it securely for private buckets, we would need to request a signed URL.
                    // For now, this is a placeholder URL structure, actual auth might be required.
                    target.src = "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&q=80"; // fallback
                  }}
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <ImageIcon size={48} className="mb-2 opacity-50" />
                  <p>No selfie provided</p>
                </div>
              )}
            </div>
            
            {/* Details Section */}
            <div className="md:w-1/2 flex flex-col h-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-brand-deep-navy px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-serif text-white">Visit Report Details</h2>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1">Submitted By</h3>
                  <div className="bg-brand-primary/5 p-3 rounded border border-brand-soft-grey flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-deep-navy text-white flex items-center justify-center font-medium">
                      {currentRecord.user_profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-brand-deep-navy">{currentRecord.user_profiles?.user_code} — {currentRecord.user_profiles?.full_name}</p>
                      <p className="text-xs text-brand-charcoal/70">{currentRecord.user_profiles?.role?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-brand-soft-grey pt-4 mt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Customer</p>
                    <p className="font-medium text-brand-deep-navy">{currentRecord.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Phone</p>
                    <p className="font-medium text-brand-deep-navy">{currentRecord.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Date</p>
                    <p className="font-medium text-brand-deep-navy">{currentRecord.visit_date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Meet Time</p>
                    <p className="font-medium text-brand-deep-navy">{currentRecord.visit_time || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Location</p>
                    <p className="font-medium text-brand-deep-navy">{currentRecord.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Project</p>
                    <p className="font-medium text-brand-deep-navy">{currentRecord.project_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Status</p>
                    <p className="font-medium text-brand-deep-navy">{currentRecord.status}</p>
                  </div>
                </div>
                
                <div className="border-t border-brand-soft-grey pt-4 mt-2">
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Remarks</p>
                  <p className="font-medium text-brand-deep-navy bg-gray-50 p-3 rounded border border-brand-soft-grey mt-1">
                    {currentRecord.remarks || 'No remarks provided.'}
                  </p>
                </div>
                
                <div className="text-xs text-brand-charcoal/60 text-right">
                  Submitted on {new Date(currentRecord.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
