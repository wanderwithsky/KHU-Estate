/**
 * Canonical Business Mapping Utility
 * Ensures consistent handling of customer name, phone, project, and financial details
 * across all Admin and STL/TL/Associate modules.
 */

export interface MappedBusinessRecord {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  project_name: string;
  area_sqft: number;
  deal_amount: number;
  total_amount: number;
  booking_amount: number;
  commission_percent: number;
  total_income: number;
  balance_amount: number;
  notes: string;
  address?: string;
  assigned_user_id?: string;
  user_profiles?: {
    id?: string;
    user_code?: string;
    full_name?: string;
    role?: string;
  };
  source?: 'businesses' | 'stl_self_performance' | string;
  raw?: any;
}

export function formatBusinessField(value: any, fallback = 'Not provided'): string {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str.length > 0 ? str : fallback;
}

export function mapBusinessRecord(r: any, fallbackUser?: any): MappedBusinessRecord {
  // Resolve customer name from authoritative direct column, then joined client relation, then fallback
  const rawCustomer = r.customer_name ?? r.client?.name ?? r.client_name;
  const customerName = formatBusinessField(rawCustomer);

  // Resolve phone from direct column, then joined client relation, then fallback
  const rawPhone = r.phone ?? r.client?.phone ?? r.mobile;
  const phone = formatBusinessField(rawPhone);

  // Resolve project name from direct column, then joined project relation, then fallback
  const rawProject = r.project_name ?? r.project?.name;
  const projectName = formatBusinessField(rawProject);

  const totalAmt = Number(r.deal_amount ?? r.total_amount ?? 0);
  const bookingAmt = Number(r.booking_amount ?? 0);
  const balanceAmt = Number(r.balance_amount ?? 0);
  const incomeAmt = Number(r.total_income ?? 0);
  const commPercent = Number(r.commission_percent ?? 0);
  const area = Number(r.area_sqft ?? 0);

  const assignedId = r.assigned_user_id || r.associate_id || r.stl_id;
  const userProfile = r.assigned_user || r.user_profiles || r.associate || r.tl || r.stl || fallbackUser;

  return {
    id: r.id,
    created_at: r.created_at || r.business_date || new Date().toISOString(),
    customer_name: customerName,
    phone: phone,
    project_name: projectName,
    area_sqft: isNaN(area) ? 0 : area,
    deal_amount: isNaN(totalAmt) ? 0 : totalAmt,
    total_amount: isNaN(totalAmt) ? 0 : totalAmt,
    booking_amount: isNaN(bookingAmt) ? 0 : bookingAmt,
    commission_percent: isNaN(commPercent) ? 0 : commPercent,
    total_income: isNaN(incomeAmt) ? 0 : incomeAmt,
    balance_amount: isNaN(balanceAmt) ? 0 : balanceAmt,
    notes: (r.notes || r.remarks || '').trim(),
    address: formatBusinessField(r.address, ''),
    assigned_user_id: assignedId,
    user_profiles: userProfile,
    source: r.source || (r.business_date && !r.deal_amount ? 'stl_self_performance' : 'businesses'),
    raw: r
  };
}
