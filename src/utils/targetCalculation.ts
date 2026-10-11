import { supabase } from '../lib/supabase';
import { mapBusinessRecord } from './businessMapping';

export const TARGET_AMOUNT = 5000000; // ₹50 Lakh

export interface TlTargetProgress {
  userId: string;
  userName: string;
  userCode: string;
  role: string;
  targetAmount: number;
  selfAmount: number;
  teamAmount: number;
  totalAchieved: number;
  remainingAmount: number;
  percentage: number;
  status: 'IN PROGRESS' | 'TARGET ACHIEVED' | 'PROMOTED';
  isPromoted: boolean;
  promotionRecord?: any;
  lastUpdated?: string;
  selfRecords: any[];
  teamRecords: any[];
  allRecords: any[];
}

/**
 * Fetch and calculate ₹50 Lakh target progress for a specific Team Leader or Promoted STL.
 */
export async function fetchTlTargetProgress(userId: string): Promise<TlTargetProgress | null> {
  try {
    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('id, user_code, full_name, role, status, created_at')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) return null;

    // 2. Fetch promotion record if any
    const { data: promData } = await supabase
      .from('promotions')
      .select('*')
      .eq('user_id', userId)
      .order('promotion_date', { ascending: false })
      .limit(1);

    const promotionRecord = promData && promData.length > 0 ? promData[0] : null;

    // 3. Fetch downline associates
    const { data: associates } = await supabase
      .from('user_profiles')
      .select('id, user_code, full_name, role')
      .eq('parent_user_id', userId)
      .eq('role', 'ASSOCIATE');

    const assocList = associates || [];
    const assocIds = assocList.map(a => a.id);

    // 4. Fetch Self Business from stl_self_performance
    const { data: selfPerfData } = await supabase
      .from('stl_self_performance')
      .select('*')
      .eq('stl_id', userId)
      .order('created_at', { ascending: false });

    // 5. Fetch business from businesses table (both self and downline)
    const allMemberIds = [userId, ...assocIds];
    const { data: bizData } = await supabase
      .from('businesses')
      .select(`
        *,
        client:client_id(name, phone, client_number),
        project:project_id(name),
        assigned_user:assigned_user_id(id, user_code, full_name, role),
        user_profiles:associate_id(id, user_code, full_name, role)
      `)
      .or(`associate_id.in.(${allMemberIds.join(',')}),assigned_user_id.in.(${allMemberIds.join(',')}),tl_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    const profileMap = new Map<string, any>([
      [userId, profile],
      ...assocList.map(a => [a.id, a] as [string, any])
    ]);

    // Separate self business vs team business
    const selfBizList: any[] = [];
    const teamBizList: any[] = [];
    const seenBizIds = new Set<string>();

    // Self performance from stl_self_performance
    (selfPerfData || []).forEach((r: any) => {
      seenBizIds.add(r.id);
      selfBizList.push(mapBusinessRecord({
        ...r,
        created_at: r.created_at || r.business_date,
        deal_amount: r.total_amount,
        notes: r.remarks,
        assigned_user_id: r.stl_id,
        source: 'stl_self_performance'
      }, profile));
    });

    // Businesses from businesses table
    (bizData || []).forEach((r: any) => {
      if (seenBizIds.has(r.id)) return;
      seenBizIds.add(r.id);

      const isSelf = (r.assigned_user_id === userId || r.associate_id === userId);
      const assignedId = r.assigned_user_id || r.associate_id;
      const mapped = mapBusinessRecord(r, profileMap.get(assignedId));

      if (isSelf) {
        selfBizList.push(mapped);
      } else {
        teamBizList.push(mapped);
      }
    });

    const selfAmount = selfBizList.reduce(
      (sum, r) => sum + (r.deal_amount || r.total_amount || 0), 0
    );
    const teamAmount = teamBizList.reduce(
      (sum, r) => sum + (r.deal_amount || r.total_amount || 0), 0
    );
    const totalAchieved = selfAmount + teamAmount;

    const remainingAmount = Math.max(TARGET_AMOUNT - totalAchieved, 0);
    const percentage = Math.min((totalAchieved / TARGET_AMOUNT) * 100, 100);

    let status: 'IN PROGRESS' | 'TARGET ACHIEVED' | 'PROMOTED' = 'IN PROGRESS';
    const isPromoted = Boolean(promotionRecord || profile.role === 'SENIOR_TL');

    if (isPromoted) {
      status = 'PROMOTED';
    } else if (totalAchieved >= TARGET_AMOUNT) {
      status = 'TARGET ACHIEVED';
    }

    const allRecords = [...selfBizList, ...teamBizList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const latestDate = allRecords.length > 0 ? allRecords[0].created_at : undefined;

    return {
      userId: profile.id,
      userName: profile.full_name,
      userCode: profile.user_code,
      role: profile.role,
      targetAmount: TARGET_AMOUNT,
      selfAmount,
      teamAmount,
      totalAchieved,
      remainingAmount,
      percentage,
      status,
      isPromoted,
      promotionRecord,
      lastUpdated: latestDate,
      selfRecords: selfBizList,
      teamRecords: teamBizList,
      allRecords
    };
  } catch (err) {
    console.error('Error calculating TL target progress:', err);
    return null;
  }
}
