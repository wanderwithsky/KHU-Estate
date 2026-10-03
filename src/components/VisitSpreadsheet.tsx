import { Camera, Eye, PlusCircle, Download } from 'lucide-react';

interface VisitRecord {
  id: string;
  assigned_user_id?: string;
  customer_name: string;
  phone: string;
  project_name?: string;
  location?: string;
  visit_date: string;
  visit_time?: string;
  status: string;
  remarks?: string;
  selfie_url?: string;
  created_at: string;
  user_profiles?: {
    user_code: string;
    full_name: string;
    role: string;
  };
}

interface VisitSpreadsheetProps {
  records: VisitRecord[];
  type: 'MY_VISITS' | 'HISTORY' | 'ADMIN';
  onEdit?: (record: VisitRecord) => void; // Used for "Submit Report" or Admin "Edit"
  onView?: (record: VisitRecord) => void;
  isAdminScheduled?: boolean;
}

export default function VisitSpreadsheet({ records, type, onEdit, onView, isAdminScheduled }: VisitSpreadsheetProps) {
  const exportCSV = () => {
    let headers: string[] = [];
    
    if (type === 'MY_VISITS') {
      headers = ['Date', 'Time', 'Customer Name', 'Phone', 'Location', 'Project Name', 'Status', 'Remarks'];
    } else if (type === 'HISTORY') {
      headers = ['Date', 'Customer Name', 'Phone', 'Meet Time', 'Remarks', 'Status', 'Submitted At'];
    } else {
      const userColHeader = isAdminScheduled ? 'Scheduled To' : 'Submitted By';
      headers = ['User Code', userColHeader, 'Role', 'Customer Name', 'Phone', 'Visit Date', 'Meet Time', 'Location', 'Project Name', 'Status', 'Remarks', 'Submitted At'];
    }
    
    const rows = records.map(r => {
      if (type === 'MY_VISITS') {
        return [
          r.visit_date || '',
          r.visit_time || '',
          r.customer_name || '',
          r.phone || '',
          r.location || '',
          r.project_name || '',
          r.status || '',
          r.remarks || ''
        ];
      } else if (type === 'HISTORY') {
        return [
          r.visit_date || '',
          r.customer_name || '',
          r.phone || '',
          r.visit_time || '',
          r.remarks || '',
          r.status || '',
          new Date(r.created_at).toLocaleString()
        ];
      } else {
        return [
          r.user_profiles?.user_code || '',
          r.user_profiles?.full_name || '',
          r.user_profiles?.role || '',
          r.customer_name || '',
          r.phone || '',
          r.visit_date || '',
          r.visit_time || '',
          r.location || '',
          r.project_name || '',
          r.status || '',
          r.remarks || '',
          new Date(r.created_at).toLocaleString()
        ];
      }
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    let filename = '';
    const dateStr = new Date().toISOString().split('T')[0];
    if (type === 'MY_VISITS') filename = `my-visits-${dateStr}.csv`;
    else if (type === 'HISTORY') filename = `visit-history-${dateStr}.csv`;
    else filename = `all-visits-${dateStr}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESCHEDULED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded border border-brand-soft-grey shadow-sm overflow-hidden flex flex-col relative">
      <div className="p-3 border-b border-brand-soft-grey flex justify-between items-center bg-gray-50/50 sticky top-0 left-0 right-0 z-10">
        <div className="text-xs font-medium text-brand-charcoal/60 uppercase tracking-wider">
          Total Records: {records.length}
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-1.5 text-xs bg-brand-deep-navy text-white px-4 py-1.5 rounded font-medium hover:bg-brand-deep-navy/90 transition-colors shadow-sm"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto relative">
        <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead className="text-[10px] text-white uppercase bg-brand-deep-navy font-medium tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-2.5 border-r border-brand-soft-grey/20 w-12 text-center sticky left-0 bg-brand-deep-navy">#</th>
              
              {type === 'ADMIN' && (
                <>
                  <th className="p-2.5 border-r border-brand-soft-grey/20">{isAdminScheduled ? 'Scheduled To' : 'Submitted By'}</th>
                </>
              )}
              
              <th className="p-2.5 border-r border-brand-soft-grey/20">Date</th>
              
              {type === 'MY_VISITS' && (
                <th className="p-2.5 border-r border-brand-soft-grey/20">Time</th>
              )}
              
              <th className="p-2.5 border-r border-brand-soft-grey/20">Customer Name</th>
              <th className="p-2.5 border-r border-brand-soft-grey/20">Phone</th>
              
              {(type === 'HISTORY' || type === 'ADMIN') && (
                <>
                  <th className="p-2.5 border-r border-brand-soft-grey/20 text-center">Selfie</th>
                  <th className="p-2.5 border-r border-brand-soft-grey/20">Meet Time</th>
                </>
              )}
              
              {(type === 'MY_VISITS' || type === 'ADMIN') && (
                <>
                  <th className="p-2.5 border-r border-brand-soft-grey/20">Location</th>
                  <th className="p-2.5 border-r border-brand-soft-grey/20">Project Name</th>
                </>
              )}
              
              <th className="p-2.5 border-r border-brand-soft-grey/20 text-center">Status</th>
              <th className="p-2.5 border-r border-brand-soft-grey/20">Remarks</th>
              
              {(type === 'HISTORY' || type === 'ADMIN') && (
                <th className="p-2.5 border-r border-brand-soft-grey/20">Submitted At</th>
              )}
              
              <th className="p-2.5 text-center sticky right-0 bg-brand-deep-navy border-l border-brand-soft-grey/20 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] z-10">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-soft-grey/50 text-xs">
            {records.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-8 text-center text-brand-charcoal/60">
                  {type === 'MY_VISITS' ? 'No visits scheduled for you yet.' : type === 'HISTORY' ? 'No visit reports submitted yet.' : 'No visit records found.'}
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={record.id} className="hover:bg-brand-primary/5 transition-colors group bg-white">
                  <td className="p-2.5 border-r border-brand-soft-grey/50 text-center text-brand-charcoal/50 font-medium sticky left-0 bg-inherit z-0">{index + 1}</td>
                  
                  {type === 'ADMIN' && (
                    <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-deep-navy font-medium whitespace-nowrap">
                      {record.user_profiles?.user_code} — {record.user_profiles?.full_name}
                    </td>
                  )}
                  
                  <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal whitespace-nowrap">
                    {record.visit_date}
                  </td>
                  
                  {type === 'MY_VISITS' && (
                    <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal font-medium whitespace-nowrap">
                      {record.visit_time || '-'}
                    </td>
                  )}
                  
                  <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal font-medium truncate max-w-[150px]" title={record.customer_name}>
                    {record.customer_name}
                  </td>
                  <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal whitespace-nowrap">
                    {record.phone}
                  </td>
                  
                  {(type === 'HISTORY' || type === 'ADMIN') && (
                    <>
                      <td className="p-2.5 border-r border-brand-soft-grey/50 text-center">
                        {record.selfie_url ? (
                          <button 
                            onClick={() => onView && onView(record)}
                            className="inline-flex items-center justify-center p-1.5 bg-brand-primary/10 text-brand-deep-navy rounded-full hover:bg-brand-primary/20 transition-colors shadow-sm border border-brand-deep-navy/10"
                            title="View Selfie"
                          >
                            <Camera size={14} />
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal whitespace-nowrap">
                        {record.visit_time || '-'}
                      </td>
                    </>
                  )}
                  
                  {(type === 'MY_VISITS' || type === 'ADMIN') && (
                    <>
                      <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal truncate max-w-[120px]" title={record.location || ''}>
                        {record.location || '-'}
                      </td>
                      <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal truncate max-w-[120px]" title={record.project_name || ''}>
                        {record.project_name || '-'}
                      </td>
                    </>
                  )}
                  
                  <td className="p-2.5 border-r border-brand-soft-grey/50 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  
                  <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal max-w-[200px] truncate" title={record.remarks}>
                    {record.remarks || '-'}
                  </td>
                  
                  {(type === 'HISTORY' || type === 'ADMIN') && (
                    <td className="p-2.5 border-r border-brand-soft-grey/50 text-brand-charcoal/70 text-[10px] whitespace-nowrap">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                  )}
                  
                  <td className="p-2 text-center sticky right-0 bg-inherit border-l border-brand-soft-grey/50 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)] z-0">
                    <div className="flex justify-center gap-1.5">
                      {type === 'MY_VISITS' && (record.status === 'SCHEDULED' || record.status === 'RESCHEDULED') ? (
                        <button 
                          onClick={() => onEdit && onEdit(record)}
                          className="flex items-center gap-1 text-brand-deep-navy bg-brand-primary/10 hover:bg-brand-primary/20 px-2 py-1 text-xs font-medium border border-brand-deep-navy/10 rounded transition-colors"
                        >
                          <PlusCircle size={12} />
                          Report
                        </button>
                      ) : (
                        <button 
                          onClick={() => onView && onView(record)}
                          className="flex items-center gap-1 text-brand-charcoal hover:text-brand-deep-navy bg-gray-50 hover:bg-gray-100 px-2 py-1 text-xs font-medium border border-gray-200 rounded transition-colors"
                        >
                          <Eye size={12} />
                          View
                        </button>
                      )}
                      
                      {type === 'ADMIN' && (
                        <button 
                          onClick={() => onEdit && onEdit(record)}
                          className="flex items-center gap-1 text-brand-gold bg-brand-deep-navy hover:bg-brand-deep-navy/90 px-2 py-1 text-xs font-medium rounded transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
