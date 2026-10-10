import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Download, Filter, RefreshCw, Users, Briefcase } from 'lucide-react';

export default function SeniorTLTeamPerformance() {
  const { profile } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  
  // Data
  const [teamBusiness, setTeamBusiness] = useState<any[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<any[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    role: '',
    searchUser: ''
  });

  useEffect(() => {
    if (profile?.id) {
      fetchPerformanceData();
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;
    
    // Real-time subscription for businesses table
    const channel = supabase
      .channel('businesses_changes_team')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          fetchPerformanceData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchPerformanceData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // 1. Fetch TLs reporting to this STL
      const { data: tls } = await supabase
        .from('user_profiles')
        .select('id, user_code, full_name, role, parent_user_id, senior_tl_id')
        .or(`parent_user_id.eq.${profile.id},senior_tl_id.eq.${profile.id}`)
        .eq('role', 'TEAM_LEADER');
        
      const tlList = tls || [];
      const tlIds = tlList.map(tl => tl.id);
      
      // 2. Fetch Associates reporting to those TLs, or directly to this STL
      let assocQuery = supabase
        .from('user_profiles')
        .select('id, user_code, full_name, role, parent_user_id, senior_tl_id')
        .eq('role', 'ASSOCIATE');
        
      if (tlIds.length > 0) {
        assocQuery = assocQuery.or(`parent_user_id.in.(${tlIds.join(',')}),parent_user_id.eq.${profile.id},senior_tl_id.eq.${profile.id}`);
      } else {
        assocQuery = assocQuery.or(`parent_user_id.eq.${profile.id},senior_tl_id.eq.${profile.id}`);
      }
      
      const { data: associates } = await assocQuery;
      
      // 3. Combine profiles
      const profiles = [...tlList, ...(associates || [])];
        
      if (profiles && profiles.length > 0) {
        setTeamProfiles(profiles);
        const profileIds = profiles.map(p => p.id);
        
        // Fetch Team Business
        const { data: teamData } = await supabase
          .from('businesses')
          .select(`
            *,
            client:client_id(name, phone, client_number),
            project:project_id(name),
            user_profiles:associate_id(id, user_code, full_name, role)
          `)
          .in('associate_id', profileIds)
          .order('created_at', { ascending: false });
          
        const mappedTeam = (teamData || []).map((r: any) => ({
          ...r,
          customer_name: r.customer_name || r.client?.name || 'N/A',
          phone: r.phone || r.client?.phone || 'N/A',
          project_name: r.project_name || r.project?.name || 'N/A',
          assigned_user_id: r.assigned_user_id || r.associate_id
        }));
        setTeamBusiness(mappedTeam);
      } else {
        setTeamProfiles([]);
        setTeamBusiness([]);
      }
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
      role: '',
      searchUser: ''
    });
  };

  // Filtering Logic
  const applyFilters = (data: any[]) => {
    return data.filter(record => {
      let match = true;
      if (filters.dateFrom) match = match && new Date(record.created_at) >= new Date(filters.dateFrom);
      if (filters.dateTo) match = match && new Date(record.created_at) <= new Date(filters.dateTo + 'T23:59:59');
      if (filters.project) match = match && record.project_name.toLowerCase().includes(filters.project.toLowerCase());
      if (filters.role && record.user_profiles) match = match && record.user_profiles.role === filters.role;
      if (filters.searchUser && record.user_profiles) {
        const userStr = `${record.user_profiles.user_code} ${record.user_profiles.full_name}`.toLowerCase();
        match = match && userStr.includes(filters.searchUser.toLowerCase());
      }
      return match;
    });
  };

  const filteredTeam = applyFilters(teamBusiness);

  // Summaries
  const calcTotals = (data: any[]) => {
    return data.reduce((acc, curr) => ({
      records: acc.records + 1,
      totalAmount: acc.totalAmount + (curr.deal_amount || curr.total_amount || 0),
      bookingAmount: acc.bookingAmount + (curr.booking_amount || 0),
      income: acc.income + (curr.total_income || 0),
      balance: acc.balance + (curr.balance_amount || 0)
    }), { records: 0, totalAmount: 0, bookingAmount: 0, income: 0, balance: 0 });
  };

  const teamTotals = calcTotals(filteredTeam);

  // Team Breakdown
  const teamBreakdown = teamProfiles.map(p => {
    let myBusiness = filteredTeam.filter(b => b.assigned_user_id === p.id);
    let myTotals = calcTotals(myBusiness);
    
    // If TL, include their immediate associates
    let assocTotals = { records: 0, totalAmount: 0, bookingAmount: 0, income: 0 };
    let associatesCount = 0;
    
    if (p.role === 'TEAM_LEADER') {
      const myAssociates = teamProfiles.filter(sub => sub.parent_user_id === p.id && sub.role === 'ASSOCIATE');
      associatesCount = myAssociates.length;
      const assocIds = myAssociates.map(a => a.id);
      const assocBusiness = filteredTeam.filter(b => assocIds.includes(b.assigned_user_id));
      assocTotals = calcTotals(assocBusiness);
    }
    
    return {
      ...p,
      associatesCount,
      businessRecords: myTotals.records + assocTotals.records,
      totalBusiness: myTotals.totalAmount + assocTotals.totalAmount,
      booking: myTotals.bookingAmount + assocTotals.bookingAmount,
      income: myTotals.income + assocTotals.income,
      isTL: p.role === 'TEAM_LEADER'
    };
  });

  const tlBreakdown = teamBreakdown.filter(p => p.isTL);
  const associateBreakdown = teamBreakdown.filter(p => !p.isTL);

  // CSV Export
  const exportCSV = (data: any[], filename: string) => {
    let csv = '';
    const headers = ['Date', 'User Code', 'User Name', 'Role', 'Customer Name', 'Phone', 'Project', 'Area (sqft)', 'Total Amount', 'Booking Amount', 'Commission %', 'Total Income', 'Balance', 'Remarks'];
    
    csv += headers.join(',') + '\n';
    
    data.forEach(row => {
      const date = new Date(row.created_at).toLocaleDateString();
      const userCode = row.user_profiles?.user_code || '';
      const userName = `"${row.user_profiles?.full_name || ''}"`;
      const role = row.user_profiles?.role || '';
      const cust = `"${row.customer_name || ''}"`;
      const proj = `"${row.project_name || ''}"`;
      const remarks = `"${(row.notes || row.remarks || '').replace(/"/g, '""')}"`;
      
      const values = [date, userCode, userName, role, cust, row.phone, proj, row.area_sqft, row.deal_amount || row.total_amount, row.booking_amount, row.commission_percent, row.total_income, row.balance_amount, remarks];
      
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

  const SummaryCard = ({ title, totals, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={colorClass} size={20} />
        </div>
        <h3 className="font-serif text-brand-deep-navy font-medium">{title}</h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Records</span>
          <span className="font-medium text-brand-deep-navy">{totals.records}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Business Amount</span>
          <span className="font-medium text-brand-deep-navy">{formatCurrency(totals.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Booking Amount</span>
          <span className="font-medium text-brand-architectural-blue">{formatCurrency(totals.bookingAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Income</span>
          <span className="font-medium text-green-600">{formatCurrency(totals.income)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Balance Amount</span>
          <span className="font-medium text-red-500">{formatCurrency(totals.balance)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-brand-deep-navy">Team Performance</h1>
          <p className="text-sm text-brand-charcoal/70">Analyze the business generated by your Associates and Team Leaders.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(filteredTeam, 'Team_Business')}
            disabled={!profile || filteredTeam.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-soft-grey text-brand-charcoal rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            <span className="text-sm font-medium">Export</span>
          </button>
          <button
            onClick={fetchPerformanceData}
            disabled={loading || !profile}
            className="flex items-center gap-2 px-4 py-2 bg-brand-architectural-blue text-white rounded hover:bg-brand-deep-navy transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-deep-navy mb-4 border-b border-gray-100 pb-2">
          <Filter size={16} /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1">Date From</label>
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1">Date To</label>
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1">Search Team Member</label>
            <input type="text" name="searchUser" value={filters.searchUser} onChange={handleFilterChange} placeholder="Name or Code..." className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={resetFilters} className="px-4 py-2 w-full text-sm text-brand-charcoal bg-gray-100 rounded hover:bg-gray-200 transition-colors">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SummaryCard 
          title="Team Business (TLs + Associates)" 
          totals={teamTotals} 
          icon={Users} 
          colorClass="text-brand-architectural-blue bg-brand-architectural-blue"
        />
        <div className="bg-gradient-to-br from-brand-deep-navy to-[#1a2c47] p-6 shadow-sm rounded-lg text-white flex flex-col justify-center">
          <h3 className="font-serif font-medium mb-2 text-lg text-white/90">Team Structure</h3>
          <p className="text-3xl font-serif mb-1">{teamProfiles.length} Total</p>
          <p className="text-white/70 text-sm mb-4">Eligible Downline Members</p>
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div className="bg-white/10 p-3 rounded">
              <div className="text-xs text-white/60 uppercase tracking-widest">Team Leaders</div>
              <div className="text-xl font-medium">{teamProfiles.filter(p => p.role === 'TEAM_LEADER').length}</div>
            </div>
            <div className="bg-white/10 p-3 rounded">
              <div className="text-xs text-white/60 uppercase tracking-widest">Associates</div>
              <div className="text-xl font-medium">{teamProfiles.filter(p => p.role === 'ASSOCIATE').length}</div>
            </div>
          </div>
        </div>
      </div>

      {tlBreakdown.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-serif text-brand-deep-navy mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Briefcase size={18} /> Team Leader Performance
          </h3>
          <div className="bg-white border border-brand-soft-grey rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-off-white text-brand-charcoal text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Team Leader</th>
                    <th className="px-6 py-4 font-medium">Team Size</th>
                    <th className="px-6 py-4 font-medium text-right">Records</th>
                    <th className="px-6 py-4 font-medium text-right">Total Business</th>
                    <th className="px-6 py-4 font-medium text-right">Booking Amount</th>
                    <th className="px-6 py-4 font-medium text-right">Total Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {tlBreakdown.sort((a, b) => b.totalBusiness - a.totalBusiness).map((tl, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-deep-navy">{tl.full_name}</div>
                        <div className="text-xs font-mono text-brand-charcoal/60">{tl.user_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {tl.associatesCount} Associates
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{tl.businessRecords}</td>
                      <td className="px-6 py-4 text-right text-brand-architectural-blue font-medium">{formatCurrency(tl.totalBusiness)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(tl.booking)}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(tl.income)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-serif text-brand-deep-navy mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
          <Users size={18} /> Associate Performance
        </h3>
        <div className="bg-white border border-brand-soft-grey rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-off-white text-brand-charcoal text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Associate</th>
                  <th className="px-6 py-4 font-medium">Assigned TL</th>
                  <th className="px-6 py-4 font-medium text-right">Records</th>
                  <th className="px-6 py-4 font-medium text-right">Total Business</th>
                  <th className="px-6 py-4 font-medium text-right">Booking Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Total Income</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {associateBreakdown.sort((a, b) => b.totalBusiness - a.totalBusiness).map((assoc, idx) => {
                  const tl = teamProfiles.find(p => p.id === assoc.parent_user_id);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-deep-navy">{assoc.full_name}</div>
                        <div className="text-xs font-mono text-brand-charcoal/60">{assoc.user_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        {tl ? (
                          <>
                            <div className="text-brand-deep-navy">{tl.full_name}</div>
                            <div className="text-xs text-brand-charcoal/60">{tl.user_code}</div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Direct to STL</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{assoc.businessRecords}</td>
                      <td className="px-6 py-4 text-right text-brand-architectural-blue font-medium">{formatCurrency(assoc.totalBusiness)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(assoc.booking)}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(assoc.income)}</td>
                    </tr>
                  );
                })}
                {associateBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No Associates found in your hierarchy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
