import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Phone, Mail, Calendar, User, Clock, Copy, X, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatUser } from '../../utils/formatUser';

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    fetchClients();
    
    const channel = supabase
      .channel('clients_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        fetchClients();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          assigned_associate:assigned_associate_id(full_name, user_code),
          assigned_tl:assigned_tl_id(full_name, user_code),
          assigned_stl:assigned_stl_id(full_name, user_code),
          leads(lead_number)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      console.error('Error fetching clients:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.client_number || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const updateClientStatus = async (clientId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientId);
        
      if (error) throw error;
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-brand-deep-navy">Clients</h1>
          <p className="text-sm text-brand-charcoal/70">Manage converted leads and active clients</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search clients..." 
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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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
                  <th className="px-6 py-4 font-semibold">Client Details</th>
                  <th className="px-6 py-4 font-semibold">Contact Info</th>
                  <th className="px-6 py-4 font-semibold">Original Lead</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Assigned To</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold sticky right-0 bg-gray-50 z-10 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-deep-navy">{client.name}</div>
                      <div className="text-xs font-mono text-brand-charcoal/70">{client.client_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-brand-charcoal">{client.phone}</div>
                      {client.email && <div className="text-xs text-brand-charcoal/70">{client.email}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {client.leads?.lead_number ? (
                        <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block text-gray-700">
                          {client.leads.lead_number}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Direct / None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={client.status || 'ACTIVE'}
                        onChange={(e) => updateClientStatus(client.id, e.target.value)}
                        disabled={updating}
                        className={`text-xs font-semibold px-2 py-1 rounded border-0 cursor-pointer ${
                          client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {client.assigned_associate 
                        ? formatUser(client.assigned_associate.user_code, client.assigned_associate.full_name) 
                        : client.assigned_tl 
                        ? formatUser(client.assigned_tl.user_code, client.assigned_tl.full_name)
                        : <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-charcoal/70">
                      {format(new Date(client.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50 z-10 text-right">
                      <button 
                        onClick={() => {
                          setSelectedClient(client);
                          setShowDetailModal(true);
                        }}
                        className="text-brand-architectural-blue hover:text-brand-deep-navy font-medium text-xs px-3 py-1.5 rounded border border-brand-architectural-blue/30 hover:bg-brand-architectural-blue/5 transition-colors"
                      >
                        <span className="flex items-center gap-1">View <ArrowRight size={14} /></span>
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No clients found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDetailModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative my-auto shadow-2xl">
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-deep-navy transition-colors bg-gray-50 p-1 rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-brand-architectural-blue/10 flex items-center justify-center text-brand-architectural-blue">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-serif text-brand-deep-navy">{selectedClient.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium font-mono">{selectedClient.client_number}</span>
                  {selectedClient.leads?.lead_number && (
                    <span className="text-xs text-brand-charcoal/60 uppercase tracking-wider">FROM LEAD: {selectedClient.leads.lead_number}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 border border-gray-100">
                  <Phone size={16} className="text-brand-charcoal/50 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Phone Number</p>
                    <div className="flex items-center justify-between gap-2">
                      <a href={`tel:${selectedClient.phone}`} className="text-sm font-medium text-brand-architectural-blue hover:underline truncate">{selectedClient.phone}</a>
                      <button onClick={() => copyToClipboard(selectedClient.phone)} className="text-gray-400 hover:text-brand-deep-navy"><Copy size={14} /></button>
                    </div>
                  </div>
                </div>
                
                {selectedClient.email && (
                  <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 border border-gray-100">
                    <Mail size={16} className="text-brand-charcoal/50 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Email Address</p>
                      <div className="flex items-center justify-between gap-2">
                        <a href={`mailto:${selectedClient.email}`} className="text-sm font-medium text-brand-architectural-blue hover:underline truncate">{selectedClient.email}</a>
                        <button onClick={() => copyToClipboard(selectedClient.email)} className="text-gray-400 hover:text-brand-deep-navy"><Copy size={14} /></button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 border border-gray-100">
                  <Clock size={16} className="text-brand-charcoal/50 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Conversion Date</p>
                    <p className="text-sm font-medium text-brand-deep-navy">{format(new Date(selectedClient.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-2">Client Status</p>
                  <select
                    value={selectedClient.status || 'ACTIVE'}
                    onChange={(e) => updateClientStatus(selectedClient.id, e.target.value)}
                    disabled={updating}
                    className="w-full text-sm font-semibold px-3 py-2 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Assigned To</p>
                  <p className="text-sm font-medium text-brand-deep-navy">
                    {selectedClient.assigned_associate 
                      ? formatUser(selectedClient.assigned_associate.user_code, selectedClient.assigned_associate.full_name) 
                      : selectedClient.assigned_tl 
                      ? formatUser(selectedClient.assigned_tl.user_code, selectedClient.assigned_tl.full_name)
                      : <span className="text-gray-400 italic">Not Assigned</span>}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-brand-warm-white p-5 rounded-lg border border-gray-200">
              <h3 className="text-xs uppercase tracking-widest text-brand-charcoal font-bold mb-3 flex items-center gap-2">
                <Calendar size={14} /> Notes
              </h3>
              <div className="prose prose-sm max-w-none text-brand-charcoal whitespace-pre-wrap">
                {selectedClient.notes || 'No notes provided.'}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
