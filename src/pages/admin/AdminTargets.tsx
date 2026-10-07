import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { Search, Download, RefreshCw, Award, CheckCircle, Clock } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const TARGET_AMOUNT = 5000000; // ₹50 Lakh

export default function AdminTargets() {
  const { profile: adminProfile } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [tls, setTls] = useState<any[]>([]);
  const [promotedTls, setPromotedTls] = useState<any[]>([]);
  
  // Modals
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [viewProfileModal, setViewProfileModal] = useState(false);
  const [profileBusiness, setProfileBusiness] = useState<any[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Listen for business changes to update targets in real-time
    const channel = supabase
      .channel('businesses_changes_targets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all active Team Leaders
      const { data: activeTls } = await supabase
        .from('user_profiles')
        .select('id, user_code, full_name, role, status, created_at')
        .eq('role', 'TEAM_LEADER')
        .eq('status', 'ACTIVE');

      // 2. Fetch all STLs to find promoted TLs (since they became STLs)
      const { data: activeStls } = await supabase
        .from('user_profiles')
        .select('id, user_code, full_name, role, status, created_at')
        .eq('role', 'SENIOR_TL')
        .eq('status', 'ACTIVE');

      // 3. Fetch promotions to identify who was promoted
      // We wrap in try-catch in case the promotions table hasn't been migrated yet
      let promotionsList: any[] = [];
      try {
        const { data: promData } = await supabase.from('promotions').select('*');
        if (promData) promotionsList = promData;
      } catch (e) {
        console.warn('Promotions table might not exist yet.');
      }

      // 4. Fetch all businesses for calculation
      // For TLs, eligible business is Self + their Associates
      // We also need all associates under these TLs and STLs
      const { data: allAssociates } = await supabase
        .from('user_profiles')
        .select('id, parent_user_id')
        .eq('role', 'ASSOCIATE');
        
      const { data: allBusiness } = await supabase
        .from('businesses')
        .select('id, assigned_user_id, deal_amount, total_amount, booking_amount, total_income, balance_amount, created_at, customer_name, phone, project_name, area_sqft, commission_percent, notes, remarks');

      const calcBusiness = (userId: string) => {
        const myAssoc = allAssociates?.filter(a => a.parent_user_id === userId).map(a => a.id) || [];
        const eligibleIds = [userId, ...myAssoc];
        const myBiz = allBusiness?.filter(b => eligibleIds.includes(b.assigned_user_id)) || [];
        
        return myBiz.reduce((acc, curr) => ({
          records: acc.records + 1,
          totalAmount: acc.totalAmount + (curr.deal_amount || curr.total_amount || 0),
          bookingAmount: acc.bookingAmount + (curr.booking_amount || 0),
          income: acc.income + (curr.total_income || 0),
          balance: acc.balance + (curr.balance_amount || 0),
          recordsList: myBiz
        }), { records: 0, totalAmount: 0, bookingAmount: 0, income: 0, balance: 0, recordsList: myBiz });
      };

      // Map TLs
      const tlProgress = (activeTls || []).map(tl => {
        const biz = calcBusiness(tl.id);
        const progress = Math.min((biz.totalAmount / TARGET_AMOUNT) * 100, 100);
        let status = 'IN PROGRESS';
        if (biz.totalAmount >= TARGET_AMOUNT) status = 'TARGET ACHIEVED';
        
        return {
          ...tl,
          ...biz,
          target: TARGET_AMOUNT,
          progress,
          remaining: Math.max(TARGET_AMOUNT - biz.totalAmount, 0),
          targetStatus: status,
          isPromoted: false
        };
      });

      // Map Promoted STLs (Those who exist in promotions table)
      const promotedStls = (activeStls || []).map(stl => {
        const promRecord = promotionsList.find(p => p.user_id === stl.id);
        if (!promRecord) return null; // Only include those explicitly promoted via this module
        
        const biz = calcBusiness(stl.id);
        
        return {
          ...stl,
          ...biz,
          target: promRecord.target_amount || TARGET_AMOUNT,
          progress: 100,
          remaining: 0,
          targetStatus: 'PROMOTED',
          isPromoted: true,
          promotionDate: promRecord.promotion_date
        };
      }).filter(Boolean);

      setTls(tlProgress);
      setPromotedTls(promotedStls);

    } catch (error) {
      console.error('Error fetching targets data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (tl: any) => {
    if (!window.confirm(`Are you sure you want to promote ${tl.full_name} to Senior Team Leader?`)) return;
    
    try {
      setLoading(true);
      
      // Update role in user_profiles
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'SENIOR_TL' })
        .eq('id', tl.id);
        
      if (updateError) throw updateError;
      
      // Create promotion record
      try {
        await supabase.from('promotions').insert({
          user_id: tl.id,
          previous_role: 'TEAM_LEADER',
          new_role: 'SENIOR_TL',
          target_amount: TARGET_AMOUNT,
          achieved_amount: tl.totalAmount,
          status: 'PROMOTED',
          created_by: adminProfile?.id
        });
      } catch (e) {
        console.warn('Failed to insert into promotions table', e);
      }
      
      // Add audit log
      await supabase.from('audit_logs').insert({
        action: 'ADMIN_PROMOTED_TEAM_LEADER',
        module: 'USERS',
        actor_user_id: adminProfile?.id,
        entity_id: tl.id,
        entity_type: 'USER',
        new_data: { 
          previous_role: 'TEAM_LEADER',
          new_role: 'SENIOR_TL',
          target_amount: TARGET_AMOUNT,
          achieved_amount: tl.totalAmount
        }
      });
      
      alert(`${tl.full_name} has been successfully promoted to Senior Team Leader!`);
      fetchData();
      
    } catch (error: any) {
      console.error('Promotion error:', error);
      alert('Failed to promote user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = (user: any) => {
    setSelectedProfile(user);
    setProfileBusiness(user.recordsList || []);
    setViewProfileModal(true);
  };

  // Filters
  const applyFilters = (data: any[]) => {
    return data.filter(record => {
      let match = true;
      if (filters.search) {
        const term = filters.search.toLowerCase();
        match = match && (record.full_name.toLowerCase().includes(term) || record.user_code.toLowerCase().includes(term));
      }
      if (filters.status) {
        match = match && record.targetStatus === filters.status;
      }
      return match;
    });
  };

  const filteredTls = applyFilters(tls);
  const filteredPromoted = applyFilters(promotedTls);

  // CSV Export
  const exportCSV = (data: any[], filename: string) => {
    let csv = '';
    const headers = ['Team Leader', 'User ID', 'Current Business', 'Target', 'Progress %', 'Remaining Amount', 'Status', 'Promotion Date'];
    csv += headers.join(',') + '\n';
    
    data.forEach(row => {
      const name = `"${row.full_name || ''}"`;
      const pDate = row.promotionDate ? new Date(row.promotionDate).toLocaleDateString() : 'N/A';
      const values = [
        name, 
        row.user_code, 
        row.totalAmount, 
        row.target, 
        `${row.progress.toFixed(2)}%`, 
        row.remaining, 
        row.targetStatus, 
        pDate
      ];
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
  
  const exportProfileBusinessCSV = (data: any[], filename: string) => {
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
    a.download = `${filename}_Business_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const summary = {
    totalTls: tls.length,
    targetAchieved: tls.filter(t => t.totalAmount >= TARGET_AMOUNT).length,
    promoted: promotedTls.length,
    pendingPromotions: tls.filter(t => t.totalAmount >= TARGET_AMOUNT).length // same as targetAchieved in pending
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-brand-deep-navy">Promotion & Target Tracking</h1>
          <p className="text-sm text-brand-charcoal/70">Track Team Leader business targets (₹50 Lakh) and promotions</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 border border-brand-soft-grey rounded-md bg-white hover:bg-gray-50 text-gray-600">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
          <span className="text-xs text-gray-500 uppercase font-medium">Total Team Leaders</span>
          <span className="text-2xl font-serif text-brand-deep-navy mt-2">{summary.totalTls}</span>
        </div>
        <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
          <span className="text-xs text-gray-500 uppercase font-medium">Target Achieved (Pending)</span>
          <span className="text-2xl font-serif text-amber-600 mt-2">{summary.pendingPromotions}</span>
        </div>
        <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
          <span className="text-xs text-gray-500 uppercase font-medium">Promoted STLs</span>
          <span className="text-2xl font-serif text-green-600 mt-2">{summary.promoted}</span>
        </div>
        <div className="bg-white p-5 shadow-sm border border-brand-soft-grey rounded-lg flex flex-col justify-between">
          <span className="text-xs text-gray-500 uppercase font-medium">Current Goal</span>
          <span className="text-xl font-medium text-brand-architectural-blue mt-2">{formatCurrency(TARGET_AMOUNT)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey mb-8 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Search User Code/Name</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              name="search" 
              value={filters.search} 
              onChange={(e) => setFilters({...filters, search: e.target.value})} 
              placeholder="Search..." 
              className="w-full pl-9 p-2 border rounded text-sm" 
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})} 
            className="w-full p-2 border rounded text-sm bg-white"
          >
            <option value="">All Status</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="TARGET ACHIEVED">Target Achieved</option>
          </select>
        </div>
      </div>

      {/* In Progress & Target Achieved Table */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey mb-10 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
          <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
            Team Leader Target Tracking <span className="bg-white px-2 py-0.5 rounded-full text-xs border">{filteredTls.length}</span>
          </h2>
          <button onClick={() => exportCSV(filteredTls, 'TL_Targets')} className="flex items-center gap-1 text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
            <Download size={14} /> Export Targets CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">Team Leader</th>
                <th className="px-6 py-3 font-medium">User ID</th>
                <th className="px-6 py-3 font-medium text-right">Current Business</th>
                <th className="px-6 py-3 font-medium">Target Progress</th>
                <th className="px-6 py-3 font-medium text-right">Remaining</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTls.map(tl => (
                <tr key={tl.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-brand-deep-navy">{tl.full_name}</td>
                  <td className="px-6 py-4">{tl.user_code}</td>
                  <td className="px-6 py-4 text-right font-medium text-brand-architectural-blue">{formatCurrency(tl.totalAmount)}</td>
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{formatCurrency(tl.totalAmount)}</span>
                      <span className="text-gray-500">{tl.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${tl.progress >= 100 ? 'bg-green-500' : 'bg-brand-architectural-blue'}`} 
                        style={{ width: `${tl.progress}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(tl.remaining)}</td>
                  <td className="px-6 py-4">
                    {tl.targetStatus === 'TARGET ACHIEVED' ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200">
                        <Award size={12} /> TARGET ACHIEVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                        <Clock size={12} /> IN PROGRESS
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => viewProfile(tl)} className="text-xs font-medium text-brand-architectural-blue hover:underline">
                        View
                      </button>
                      {tl.targetStatus === 'TARGET ACHIEVED' && (
                        <button onClick={() => handlePromote(tl)} className="bg-amber-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-amber-600 shadow-sm transition-colors">
                          Promote
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTls.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No active Team Leaders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promoted Team Leaders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
          <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
            Promoted Team Leaders <span className="bg-white px-2 py-0.5 rounded-full text-xs border">{filteredPromoted.length}</span>
          </h2>
          <button onClick={() => exportCSV(filteredPromoted, 'Promoted_TLs')} className="flex items-center gap-1 text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
            <Download size={14} /> Export Promoted TLs CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">User ID</th>
                <th className="px-6 py-3 font-medium text-right">Business Achieved</th>
                <th className="px-6 py-3 font-medium">Promotion Date</th>
                <th className="px-6 py-3 font-medium">Current Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPromoted.map(tl => (
                <tr key={tl.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-brand-deep-navy">{tl.full_name}</td>
                  <td className="px-6 py-4">{tl.user_code}</td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(tl.totalAmount)}</td>
                  <td className="px-6 py-4">{new Date(tl.promotionDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full font-medium">{tl.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-green-200">
                      <CheckCircle size={12} /> PROMOTED
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => viewProfile(tl)} className="text-xs font-medium text-brand-architectural-blue hover:underline">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPromoted.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No promoted team leaders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Modal */}
      {viewProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-brand-off-white">
              <div>
                <h2 className="text-xl font-serif text-brand-deep-navy">{selectedProfile.full_name}'s Profile</h2>
                <p className="text-sm text-gray-500">User ID: {selectedProfile.user_code} | Role: {selectedProfile.role}</p>
              </div>
              <button onClick={() => setViewProfileModal(false)} className="text-gray-400 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Personal Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-brand-deep-navy">{selectedProfile.full_name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">User ID</span><span className="font-medium text-brand-deep-navy">{selectedProfile.user_code}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Current Role</span><span className="font-medium">{selectedProfile.role}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium">{selectedProfile.status}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Join Date</span><span className="font-medium">{new Date(selectedProfile.created_at).toLocaleDateString()}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Performance</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Total Business</span><span className="font-medium text-brand-architectural-blue">{formatCurrency(selectedProfile.totalAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Target</span><span className="font-medium">{formatCurrency(selectedProfile.target)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Progress</span><span className="font-medium">{selectedProfile.progress.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Booking Amount</span><span className="font-medium">{formatCurrency(selectedProfile.bookingAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Income</span><span className="font-medium text-green-600">{formatCurrency(selectedProfile.income)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Balance</span><span className="font-medium text-red-500">{formatCurrency(selectedProfile.balance)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Records Count</span><span className="font-medium">{selectedProfile.records}</span></div>
                  </div>
                </div>

                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                  <h3 className="text-xs font-medium text-blue-800 uppercase tracking-wider mb-4">Promotion Status</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-blue-700">Status</span><span className="font-bold text-blue-900">{selectedProfile.targetStatus}</span></div>
                    {selectedProfile.isPromoted && (
                      <>
                        <div className="flex justify-between"><span className="text-blue-700">Promotion Date</span><span className="font-medium text-blue-900">{new Date(selectedProfile.promotionDate).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="text-blue-700">Previous Role</span><span className="font-medium text-blue-900">TEAM_LEADER</span></div>
                        <div className="flex justify-between"><span className="text-blue-700">Current Role</span><span className="font-medium text-blue-900">{selectedProfile.role}</span></div>
                      </>
                    )}
                  </div>
                  {!selectedProfile.isPromoted && selectedProfile.targetStatus === 'TARGET ACHIEVED' && (
                    <button onClick={() => { setViewProfileModal(false); handlePromote(selectedProfile); }} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded text-sm font-medium shadow-sm">
                      Confirm Promotion Now
                    </button>
                  )}
                </div>
              </div>

              {/* Eligible Business Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium text-brand-deep-navy">Eligible Business Records ({profileBusiness.length})</h3>
                  <button onClick={() => exportProfileBusinessCSV(profileBusiness, selectedProfile.user_code)} className="flex items-center gap-1 text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Customer</th>
                        <th className="px-4 py-2">Project</th>
                        <th className="px-4 py-2 text-right">Total Amount</th>
                        <th className="px-4 py-2 text-right">Booking</th>
                        <th className="px-4 py-2 text-right">Income</th>
                        <th className="px-4 py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profileBusiness.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{new Date(b.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{b.customer_name}</td>
                          <td className="px-4 py-2">{b.project_name}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(b.deal_amount || b.total_amount)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(b.booking_amount)}</td>
                          <td className="px-4 py-2 text-right text-green-600">{formatCurrency(b.total_income)}</td>
                          <td className="px-4 py-2 text-right text-red-500">{formatCurrency(b.balance_amount)}</td>
                        </tr>
                      ))}
                      {profileBusiness.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No eligible business records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
