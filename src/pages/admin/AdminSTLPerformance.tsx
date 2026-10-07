import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatUser } from '../../utils/formatUser';
import { Download, Filter, RefreshCw, TrendingUp, Users, Briefcase } from 'lucide-react';

export default function AdminSTLPerformance() {
  const [loading, setLoading] = useState(false);
  const [stls, setStls] = useState<any[]>([]);
  const [selectedStl, setSelectedStl] = useState<string>('');
  
  // Data
  const [selfBusiness, setSelfBusiness] = useState<any[]>([]);
  const [teamBusiness, setTeamBusiness] = useState<any[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<any[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    role: '',
    searchCustomer: '',
    searchUser: ''
  });

  useEffect(() => {
    fetchStls();
  }, []);

  useEffect(() => {
    if (selectedStl) {
      fetchPerformanceData();
    } else {
      setSelfBusiness([]);
      setTeamBusiness([]);
      setTeamProfiles([]);
    }
  }, [selectedStl]);

  useEffect(() => {
    // Real-time subscription for businesses table
    const channel = supabase
      .channel('businesses_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          if (selectedStl) {
            fetchPerformanceData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStl]);

  const fetchStls = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, user_code, full_name')
      .eq('role', 'SENIOR_TL')
      .eq('status', 'ACTIVE')
      .order('full_name');
      
    if (data) setStls(data);
  };

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch STL's self business
      const { data: selfData } = await supabase
        .from('businesses')
        .select('*, user_profiles:assigned_user_id(id, user_code, full_name, role)')
        .eq('assigned_user_id', selectedStl)
        .order('created_at', { ascending: false });
        
      setSelfBusiness(selfData || []);

      // Fetch Team Profiles (downline)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, user_code, full_name, role, parent_user_id')
        .eq('senior_tl_id', selectedStl)
        .neq('id', selectedStl);
        
      if (profiles && profiles.length > 0) {
        setTeamProfiles(profiles);
        const profileIds = profiles.map(p => p.id);
        
        // Fetch Team Business
        const { data: teamData } = await supabase
          .from('businesses')
          .select('*, user_profiles:assigned_user_id(id, user_code, full_name, role)')
          .in('assigned_user_id', profileIds)
          .order('created_at', { ascending: false });
          
        setTeamBusiness(teamData || []);
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
      searchCustomer: '',
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
      if (filters.searchCustomer) match = match && record.customer_name?.toLowerCase().includes(filters.searchCustomer.toLowerCase());
      if (filters.searchUser && record.user_profiles) {
        const userStr = `${record.user_profiles.user_code} ${record.user_profiles.full_name}`.toLowerCase();
        match = match && userStr.includes(filters.searchUser.toLowerCase());
      }
      return match;
    });
  };

  const filteredSelf = applyFilters(selfBusiness);
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

  const selfTotals = calcTotals(filteredSelf);
  const teamTotals = calcTotals(filteredTeam);
  const overallTotals = {
    records: selfTotals.records + teamTotals.records,
    totalAmount: selfTotals.totalAmount + teamTotals.totalAmount,
    bookingAmount: selfTotals.bookingAmount + teamTotals.bookingAmount,
    income: selfTotals.income + teamTotals.income,
    balance: selfTotals.balance + teamTotals.balance
  };

  // Team Breakdown
  const teamBreakdown = teamProfiles.map(profile => {
    let myBusiness = filteredTeam.filter(b => b.assigned_user_id === profile.id);
    let myTotals = calcTotals(myBusiness);
    
    // If TL, include their immediate associates
    let assocTotals = { records: 0, totalAmount: 0, bookingAmount: 0, income: 0 };
    let associatesCount = 0;
    
    if (profile.role === 'TEAM_LEADER') {
      const myAssociates = teamProfiles.filter(p => p.parent_user_id === profile.id && p.role === 'ASSOCIATE');
      associatesCount = myAssociates.length;
      const assocIds = myAssociates.map(a => a.id);
      const assocBusiness = filteredTeam.filter(b => assocIds.includes(b.assigned_user_id));
      assocTotals = calcTotals(assocBusiness);
    }
    
    return {
      ...profile,
      associatesCount,
      businessRecords: myTotals.records + assocTotals.records,
      totalBusiness: myTotals.totalAmount + assocTotals.totalAmount,
      booking: myTotals.bookingAmount + assocTotals.bookingAmount,
      income: myTotals.income + assocTotals.income,
      isTL: profile.role === 'TEAM_LEADER'
    };
  });

  const tlBreakdown = teamBreakdown.filter(p => p.isTL);
  const associateBreakdown = teamBreakdown.filter(p => !p.isTL);

  // CSV Export
  const exportCSV = (data: any[], filename: string, includeUser: boolean = false) => {
    let csv = '';
    const headers = includeUser 
      ? ['Date', 'User Code', 'User Name', 'Role', 'Customer Name', 'Phone', 'Project', 'Area (sqft)', 'Total Amount', 'Booking Amount', 'Commission %', 'Total Income', 'Balance', 'Remarks']
      : ['Date', 'Customer Name', 'Phone', 'Project', 'Area (sqft)', 'Total Amount', 'Booking Amount', 'Commission %', 'Total Income', 'Balance', 'Remarks'];
    
    csv += headers.join(',') + '\n';
    
    data.forEach(row => {
      const date = new Date(row.created_at).toLocaleDateString();
      const userCode = row.user_profiles?.user_code || '';
      const userName = `"${row.user_profiles?.full_name || ''}"`;
      const role = row.user_profiles?.role || '';
      const cust = `"${row.customer_name || ''}"`;
      const proj = `"${row.project_name || ''}"`;
      const remarks = `"${(row.notes || row.remarks || '').replace(/"/g, '""')}"`;
      
      const values = includeUser
        ? [date, userCode, userName, role, cust, row.phone, proj, row.area_sqft, row.deal_amount || row.total_amount, row.booking_amount, row.commission_percent, row.total_income, row.balance_amount, remarks]
        : [date, cust, row.phone, proj, row.area_sqft, row.deal_amount || row.total_amount, row.booking_amount, row.commission_percent, row.total_income, row.balance_amount, remarks];
      
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
          <h1 className="text-2xl font-serif text-brand-deep-navy">STL Performance</h1>
          <p className="text-sm text-brand-charcoal/70">Analyze Senior Team Leader Self and Team business</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedStl}
            onChange={(e) => setSelectedStl(e.target.value)}
            className="w-full sm:w-64 p-2.5 border border-brand-soft-grey rounded-md text-sm bg-white focus:ring-2 focus:ring-brand-architectural-blue outline-none"
          >
            <option value="">Select Senior Team Leader</option>
            {stls.map(stl => (
              <option key={stl.id} value={stl.id}>{stl.user_code} — {stl.full_name}</option>
            ))}
          </select>
          {loading && <RefreshCw size={20} className="animate-spin text-brand-architectural-blue" />}
        </div>
      </div>

      {selectedStl && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey mb-8">
            <div className="flex items-center gap-2 mb-4 text-brand-deep-navy font-medium text-sm">
              <Filter size={16} /> Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-sm">
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
                <label className="block text-xs text-gray-500 mb-1">Role (Team)</label>
                <select name="role" value={filters.role} onChange={handleFilterChange} className="w-full p-2 border rounded bg-white">
                  <option value="">All Roles</option>
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="ASSOCIATE">Associate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Customer</label>
                <input type="text" name="searchCustomer" value={filters.searchCustomer} onChange={handleFilterChange} placeholder="Customer name" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">User Code/Name</label>
                <input type="text" name="searchUser" value={filters.searchUser} onChange={handleFilterChange} placeholder="Search user" className="w-full p-2 border rounded" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={resetFilters} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">Reset</button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Overall Performance" totals={overallTotals} icon={TrendingUp} colorClass="text-brand-deep-navy" />
            <SummaryCard title="Self Business" totals={selfTotals} icon={Briefcase} colorClass="text-brand-architectural-blue" />
            <SummaryCard title="Team Business" totals={teamTotals} icon={Users} colorClass="text-green-600" />
          </div>

          {/* Self Business Table */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
              <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
                Self Business <span className="bg-white px-2 py-0.5 rounded-full text-xs border">{filteredSelf.length}</span>
              </h2>
              <button onClick={() => exportCSV(filteredSelf, 'Self_Business')} className="flex items-center gap-1 text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
                <Download size={14} /> Export Self Business CSV
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

          {/* Team Business Table */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
              <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
                Team Business <span className="bg-white px-2 py-0.5 rounded-full text-xs border">{filteredTeam.length}</span>
              </h2>
              <button onClick={() => exportCSV(filteredTeam, 'Team_Business', true)} className="flex items-center gap-1 text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
                <Download size={14} /> Export Team Business CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Customer Name</th>
                    <th className="px-6 py-3 font-medium">Project</th>
                    <th className="px-6 py-3 font-medium text-right">Total Amount</th>
                    <th className="px-6 py-3 font-medium text-right">Booking</th>
                    <th className="px-6 py-3 font-medium text-right">Comm %</th>
                    <th className="px-6 py-3 font-medium text-right">Total Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredTeam.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">{new Date(record.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium">{formatUser(record.user_profiles?.user_code, record.user_profiles?.full_name)}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full font-medium">{record.user_profiles?.role}</span>
                      </td>
                      <td className="px-6 py-3">{record.customer_name}</td>
                      <td className="px-6 py-3">{record.project_name}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(record.deal_amount || record.total_amount)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(record.booking_amount)}</td>
                      <td className="px-6 py-3 text-right">{record.commission_percent}%</td>
                      <td className="px-6 py-3 text-right text-green-600 font-medium">{formatCurrency(record.total_income)}</td>
                    </tr>
                  ))}
                  {filteredTeam.length === 0 && (
                    <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">No team business records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* TL Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-serif text-brand-deep-navy font-medium">Team Leader Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm">
                  <thead className="bg-white border-b text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">TL</th>
                      <th className="px-6 py-3 text-center">Assoc.</th>
                      <th className="px-6 py-3 text-center">Records</th>
                      <th className="px-6 py-3 text-right">Business</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tlBreakdown.map(tl => (
                      <tr key={tl.id}>
                        <td className="px-6 py-3 font-medium">{formatUser(tl.user_code, tl.full_name)}</td>
                        <td className="px-6 py-3 text-center">{tl.associatesCount}</td>
                        <td className="px-6 py-3 text-center">{tl.businessRecords}</td>
                        <td className="px-6 py-3 text-right text-brand-architectural-blue font-medium">{formatCurrency(tl.totalBusiness)}</td>
                      </tr>
                    ))}
                    {tlBreakdown.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No Team Leaders.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Associate Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-serif text-brand-deep-navy font-medium">Associate Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm">
                  <thead className="bg-white border-b text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Associate</th>
                      <th className="px-6 py-3 text-center">Records</th>
                      <th className="px-6 py-3 text-right">Business</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {associateBreakdown.map(assoc => (
                      <tr key={assoc.id}>
                        <td className="px-6 py-3 font-medium">{formatUser(assoc.user_code, assoc.full_name)}</td>
                        <td className="px-6 py-3 text-center">{assoc.businessRecords}</td>
                        <td className="px-6 py-3 text-right text-brand-architectural-blue font-medium">{formatCurrency(assoc.totalBusiness)}</td>
                      </tr>
                    ))}
                    {associateBreakdown.length === 0 && (
                      <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No Associates.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mb-8">
             <button onClick={() => exportCSV([...filteredSelf, ...filteredTeam], 'Overall_Performance', true)} className="flex items-center gap-2 font-medium bg-brand-deep-navy text-white px-6 py-3 rounded-lg hover:bg-brand-charcoal transition-colors">
                <Download size={18} /> Export Overall Performance CSV
              </button>
          </div>
        </>
      )}
    </div>
  );
}
