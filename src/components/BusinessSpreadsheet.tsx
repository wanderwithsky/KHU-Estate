import { Download, Edit, Eye } from 'lucide-react';
import { formatUser } from '../utils/formatUser';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../lib/supabase';

interface BusinessRecord {
  id: string;
  assigned_user_id: string;
  customer_name: string;
  phone: string;
  address: string;
  project_name: string;
  area_sqft: number;
  deal_amount: number;
  total_amount?: number;
  booking_amount: number;
  commission_percent: number;
  total_income: number;
  balance_amount: number;
  notes?: string;
  created_at: string;
  user_profiles?: {
    user_code: string;
    full_name: string;
    role: string;
  };
}

export default function BusinessSpreadsheet({ 
  records, 
  onEdit, 
  onView, 
  isAdmin 
}: { 
  records: BusinessRecord[], 
  onEdit?: (record: BusinessRecord) => void,
  onView?: (record: BusinessRecord) => void,
  isAdmin: boolean
}) {
  const exportCSV = () => {
    const headers = [
      'Customer Name', 'Phone', 'Address', 'Project Name', 'Area (sqft)', 
      'Total Amount', 'Booking Amount', 'Commission (%)', 'Total Income', 
      'Balance Amount', 'Remarks', 'Assigned User Code', 'Assigned User Name', 'Created Date'
    ];
    
    const rows = records.map(r => [
      r.customer_name,
      r.phone,
      r.address,
      r.project_name,
      r.area_sqft.toString(),
      (r.deal_amount || r.total_amount || 0).toString(),
      r.booking_amount.toString(),
      r.commission_percent.toString(),
      r.total_income.toString(),
      r.balance_amount.toString(),
      r.notes || '',
      r.user_profiles?.user_code || '',
      r.user_profiles?.full_name || '',
      new Date(r.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(f => `"${f.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `khu-business-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Log CSV export
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && isAdmin) {
        supabase.from('audit_logs').insert({
          action: 'ADMIN_EXPORTED_BUSINESS_REPORT',
          actor_id: data.user.id,
          details: { record_count: records.length }
        }).then();
      }
    });

    alert('CSV exported successfully.');
  };

  return (
    <div className="bg-white border border-brand-soft-grey shadow-sm overflow-hidden rounded-lg flex flex-col w-full h-[600px]">
      <div className="flex justify-between items-center p-4 border-b border-brand-soft-grey bg-brand-off-white">
        <h3 className="text-lg font-serif text-brand-deep-navy font-semibold">Business / Customer Details</h3>
        <button 
          onClick={exportCSV} 
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary/90 transition-colors text-sm font-medium shadow-sm"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>
      
      <div className="overflow-auto flex-1 w-full bg-white relative spreadsheet-container" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-left text-sm whitespace-nowrap min-w-max border-collapse">
          <thead className="sticky top-0 z-10 bg-brand-deep-navy text-white shadow-md">
            <tr>
              <th className="p-3 border border-brand-charcoal/30 font-semibold w-12 text-center bg-brand-deep-navy">#</th>
              {isAdmin && <th className="p-3 border border-brand-charcoal/30 font-semibold bg-brand-deep-navy">ASSIGNED USER</th>}
              <th className="p-3 border border-brand-charcoal/30 font-semibold bg-brand-deep-navy">CUSTOMER NAME</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold bg-brand-deep-navy">PHONE</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold bg-brand-deep-navy">PROJECT NAME</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold bg-brand-deep-navy">AREA (sqft)</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold text-right bg-brand-deep-navy">TOTAL AMOUNT</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold text-right bg-brand-deep-navy">BOOKING AMOUNT</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold text-center bg-brand-deep-navy">COMMISSION %</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold text-right bg-brand-deep-navy">TOTAL INCOME</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold text-right bg-brand-deep-navy">BALANCE</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold bg-brand-deep-navy">REMARKS</th>
              <th className="p-3 border border-brand-charcoal/30 font-semibold bg-brand-deep-navy">DATE</th>
              {isAdmin && <th className="p-3 border border-brand-charcoal/30 font-semibold text-center bg-brand-deep-navy sticky right-0">ACTIONS</th>}
            </tr>
          </thead>
          <tbody className="bg-white">
            {records.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 14 : 12} className="p-8 text-center text-brand-charcoal/60">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-lg font-serif">No Business Records Yet</p>
                    <p className="text-sm">Your business details will appear here when records are assigned.</p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={record.id} className="hover:bg-brand-primary/5 transition-colors border-b border-brand-soft-grey group">
                  <td className="p-2 border-r border-brand-soft-grey text-center text-brand-charcoal/50 text-xs bg-gray-50/50">{index + 1}</td>
                  {isAdmin && (
                    <td className="p-2 border-r border-brand-soft-grey font-medium text-brand-architectural-blue">
                      {record.user_profiles ? formatUser(record.user_profiles.user_code, record.user_profiles.full_name) : 'Unknown'}
                    </td>
                  )}
                  <td className="p-2 border-r border-brand-soft-grey font-medium text-brand-deep-navy">{record.customer_name}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-brand-charcoal">{record.phone}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-brand-charcoal">{record.project_name}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-brand-charcoal">{record.area_sqft}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-right font-medium text-brand-deep-navy">{formatCurrency(record.deal_amount || record.total_amount || 0)}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-right text-brand-charcoal">{formatCurrency(record.booking_amount)}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-center text-brand-charcoal">{record.commission_percent}%</td>
                  <td className="p-2 border-r border-brand-soft-grey text-right font-medium text-green-700">{formatCurrency(record.total_income)}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-right text-red-700">{formatCurrency(record.balance_amount)}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-brand-charcoal max-w-[200px] truncate" title={record.notes}>{record.notes || '-'}</td>
                  <td className="p-2 border-r border-brand-soft-grey text-brand-charcoal text-xs">{new Date(record.created_at).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td className="p-2 text-center sticky right-0 bg-white group-hover:bg-brand-primary/5 border-l border-brand-soft-grey">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => onView?.(record)} className="p-1.5 text-brand-architectural-blue hover:bg-brand-architectural-blue/10 rounded" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => onEdit?.(record)} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded" title="Edit">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
