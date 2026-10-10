import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatUser } from '../../utils/formatUser';
import { Download, Filter, RefreshCw, TrendingUp, Users, Briefcase } from 'lucide-react';

export default function AdminTLPerformance() {
  const [loading, setLoading] = useState(false);
  const [tls, setTls] = useState<any[]>([]);
  const [selectedTl, setSelectedTl] = useState<string>('');
  
  // Data
  const [selfBusiness, setSelfBusiness] = useState<any[]>([]);
  const [teamBusiness, setTeamBusiness] = useState<any[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<any[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    searchCustomer: '',
    searchUser: ''
  });

  useEffect(() => {
    fetchTls();
  }, []);

  useEffect(() => {
    if (selectedTl) {
      fetchPerformanceData();
    } else {
      setSelfBusiness([]);
      setTeamBusiness([]);
      setTeamProfiles([]);
    }
  }, [selectedTl]);

  useEffect(() => {
    // Real-time subscription for businesses table
    const channel = supabase
      .channel('businesses_changes_tl')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          if (selectedTl) {
            fetchPerformanceData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTl]);

  const fetchTls = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, user_code, full_name')
      .eq('role', 'TEAM_LEADER')
      .eq('status', 'ACTIVE')
      .order('full_name');
      
    if (data) setTls(data);
  };

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch TL's self business
      const { data: selfData } = await supabase
        .from('businesses')
        .select(`
          *,
          client:client_id(name, phone, client_number),
          project:project_id(name),
          user_profiles:associate_id(id, user_code, full_name, role)
        `)
        .eq('associate_id', selectedTl)
        .order('created_at', { ascending: false });
        
      const mappedSelf = (selfData || []).map((r: any) => ({
        ...r,
        customer_name: r.client?.name || 'N/A',
        phone: r.client?.phone || 'N/A',
        project_name: r.project?.name || 'N/A',
        assigned_user_id: r.associate_id
      }));
      setSelfBusiness(mappedSelf);

      // Fetch Team Profiles (downline associates)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, user_code, full_name, role')
        .eq('parent_user_id', selectedTl)
        .eq('role', 'ASSOCIATE')
        .neq('id', selectedTl);
        
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
          customer_name: r.client?.name || 'N/A',
          phone: r.client?.phone || 'N/A',
          project_name: r.project?.name || 'N/A',
          assigned_user_id: r.associate_id
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

  // Associate Breakdown
  const associateBreakdown = teamProfiles.map(profile => {
    let myBusiness = filteredTeam.filter(b => b.assigned_user_id === profile.id);
    let myTotals = calcTotals(myBusiness);
    
    return {
      ...profile,
      businessRecords: myTotals.records,
      totalBusiness: myTotals.totalAmount,
      booking: myTotals.bookingAmount,
      income: myTotals.income,
      balance: myTotals.balance
    };
  });

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

  const SummaryCard = ({ title, totals, icon: Icon, colorClass, recordLabel = 'Total Records' }: any) => (
    <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={colorClass} size={20} />
        </div>
        <h3 className="font-serif text-brand-deep-navy font-medium">{title}</h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{recordLabel}</span>
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
          <h1 className="text-2xl font-serif text-brand-deep-navy">Team Leader Performance</h1>
          <p className="text-sm text-brand-charcoal/70">Analyze Team Leader Self and Associate business</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedTl}
            onChange={(e) => setSelectedTl(e.target.value)}
            className="w-full sm:w-64 p-2.5 border border-brand-soft-grey rounded-md text-sm bg-white focus:ring-2 focus:ring-brand-architectural-blue outline-none"
          >
            <option value="">Select Team Leader</option>
            {tls.map(tl => (
              <option key={tl.id} value={tl.id}>{tl.user_code} — {tl.full_name}</option>
            ))}
          </select>
          {loading && <RefreshCw size={20} className="animate-spin text-brand-architectural-blue" />}
        </div>
      </div>

      {selectedTl && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-soft-grey mb-8">
            <div className="flex items-center gap-2 mb-4 text-brand-deep-navy font-medium text-sm">
              <Filter size={16} /> Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">Associate Code/Name</label>
                <input type="text" name="searchUser" value={filters.searchUser} onChange={handleFilterChange} placeholder="Search associate" className="w-full p-2 border rounded" />
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
            <SummaryCard title="Team Business" totals={teamTotals} icon={Users} colorClass="text-green-600" recordLabel="Total Associate Records" />
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
                    <th className="px-6 py-3 font-medium">Associate</th>
                    <th className="px-6 py-3 font-medium">Customer Name</th>
                    <th className="px-6 py-3 font-medium">Phone</th>
                    <th className="px-6 py-3 font-medium">Project</th>
                    <th className="px-6 py-3 font-medium text-right">Total Amount</th>
                    <th className="px-6 py-3 font-medium text-right">Booking</th>
                    <th className="px-6 py-3 font-medium text-right">Comm %</th>
                    <th className="px-6 py-3 font-medium text-right">Total Income</th>
                    <th className="px-6 py-3 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredTeam.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">{new Date(record.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium">{formatUser(record.user_profiles?.user_code, record.user_profiles?.full_name)}</div>
                      </td>
                      <td className="px-6 py-3">{record.customer_name}</td>
                      <td className="px-6 py-3">{record.phone}</td>
                      <td className="px-6 py-3">{record.project_name}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(record.deal_amount || record.total_amount)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(record.booking_amount)}</td>
                      <td className="px-6 py-3 text-right">{record.commission_percent}%</td>
                      <td className="px-6 py-3 text-right text-green-600 font-medium">{formatCurrency(record.total_income)}</td>
                      <td className="px-6 py-3 text-right text-red-500">{formatCurrency(record.balance_amount)}</td>
                    </tr>
                  ))}
                  {filteredTeam.length === 0 && (
                    <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500">No team business records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Associate Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden mb-8 max-w-4xl mx-auto">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-serif text-brand-deep-navy font-medium">Associate Performance Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap text-sm">
                <thead className="bg-white border-b text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Associate</th>
                    <th className="px-6 py-3 text-center">Business Records</th>
                    <th className="px-6 py-3 text-right">Total Business</th>
                    <th className="px-6 py-3 text-right">Booking Amount</th>
                    <th className="px-6 py-3 text-right">Total Income</th>
                    <th className="px-6 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {associateBreakdown.map(assoc => (
                    <tr key={assoc.id}>
                      <td className="px-6 py-3 font-medium">{formatUser(assoc.user_code, assoc.full_name)}</td>
                      <td className="px-6 py-3 text-center">{assoc.businessRecords}</td>
                      <td className="px-6 py-3 text-right text-brand-architectural-blue font-medium">{formatCurrency(assoc.totalBusiness)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(assoc.booking)}</td>
                      <td className="px-6 py-3 text-right text-green-600 font-medium">{formatCurrency(assoc.income)}</td>
                      <td className="px-6 py-3 text-right text-red-500">{formatCurrency(assoc.balance)}</td>
                    </tr>
                  ))}
                  {associateBreakdown.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No Associates found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-center mb-8">
             <button onClick={() => exportCSV([...filteredSelf, ...filteredTeam], 'Overall_TL_Performance', true)} className="flex items-center gap-2 font-medium bg-brand-deep-navy text-white px-6 py-3 rounded-lg hover:bg-brand-charcoal transition-colors">
                <Download size={18} /> Export Overall Performance CSV
              </button>
          </div>
        </>
      )}
    </div>
  );
}
