import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatCurrency } from '../../utils/formatCurrency';
import { TARGET_AMOUNT, fetchTlTargetProgress, type TlTargetProgress } from '../../utils/targetCalculation';
import { 
  Award, CheckCircle, Clock, RefreshCw, 
  Download, Briefcase, Users, TrendingUp, Sparkles, AlertCircle 
} from 'lucide-react';

export default function TeamLeaderTargets() {
  const { profile } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [targetData, setTargetData] = useState<TlTargetProgress | null>(null);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await fetchTlTargetProgress(profile.id);
      setTargetData(data);
    } catch (err) {
      console.error('Error loading TL target data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('tl_targets_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stl_self_performance' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const exportCSV = () => {
    if (!targetData) return;
    const records = targetData.allRecords;
    const headers = ['Sr. No.', 'Date', 'Source', 'Customer Name', 'Phone', 'Project', 'Area (sqft)', 'Total Amount', 'Booking Amount', 'Balance Amount', 'Remarks'];
    const csvRows = [headers.join(',')];

    records.forEach((r, idx) => {
      const isSelf = targetData.selfRecords.some(s => s.id === r.id);
      const row = [
        idx + 1,
        new Date(r.created_at).toLocaleDateString(),
        isSelf ? 'Self Business' : 'Team Business',
        `"${(r.customer_name || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.project_name || '').replace(/"/g, '""')}"`,
        r.area_sqft || 0,
        r.deal_amount || r.total_amount || 0,
        r.booking_amount || 0,
        r.balance_amount || 0,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TL_Target_Progress_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && !targetData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg w-full"></div>
        <div className="h-64 bg-gray-200 rounded-lg w-full"></div>
      </div>
    );
  }

  const isPromoted = targetData?.isPromoted;
  const isAchieved = targetData?.status === 'TARGET ACHIEVED';
  const progressPercent = targetData?.percentage || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-serif text-brand-deep-navy">Promotion Target Tracking</h1>
            <span className="text-xs bg-brand-off-white text-brand-deep-navy px-2 py-0.5 rounded border border-brand-soft-grey font-mono font-medium">
              Goal: {formatCurrency(TARGET_AMOUNT)}
            </span>
          </div>
          <p className="text-sm text-brand-charcoal/70">
            Track your combined personal and team progress towards promotion to Senior Team Leader.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={!targetData || targetData.allRecords.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-soft-grey text-brand-charcoal rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Download size={16} />
            <span>Export Breakdown</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-architectural-blue text-white rounded-md hover:bg-brand-deep-navy transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Promoted Congratulations Banner */}
      {isPromoted && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-brand-deep-navy p-8 rounded-xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
            <Award size={260} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-100 border border-white/30">
                <Sparkles size={14} /> Official Promotion Confirmed
              </div>
              <h2 className="text-3xl font-serif text-white">Congratulations! You've Been Promoted!</h2>
              <p className="text-white/80 max-w-2xl text-sm leading-relaxed">
                Dear <strong className="text-white">{targetData?.userName}</strong> ({targetData?.userCode}), you have successfully achieved the ₹50 Lakh promotion threshold and have been officially promoted from <strong className="text-white">Team Leader</strong> to <strong className="text-white">Senior Team Leader (STL)</strong> by the Management.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs text-white/90">
                {targetData?.promotionRecord?.promotion_date && (
                  <div className="bg-white/10 px-3 py-1.5 rounded-md border border-white/10">
                    <span className="text-white/60 mr-1.5">Promotion Date:</span>
                    <strong>{new Date(targetData.promotionRecord.promotion_date).toLocaleDateString()}</strong>
                  </div>
                )}
                <div className="bg-white/10 px-3 py-1.5 rounded-md border border-white/10">
                  <span className="text-white/60 mr-1.5">Achieved at Promotion:</span>
                  <strong>{formatCurrency(targetData?.promotionRecord?.achieved_amount || targetData?.totalAchieved || TARGET_AMOUNT)}</strong>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 min-w-[200px] text-center">
              <Award size={48} className="text-amber-300 mb-2 animate-bounce" />
              <div className="text-xs uppercase tracking-widest text-white/70">Current Status</div>
              <div className="text-xl font-serif font-bold text-white mt-1">Senior Team Leader</div>
            </div>
          </div>
        </div>
      )}

      {/* Target Achieved Pending Banner */}
      {!isPromoted && isAchieved && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-brand-deep-navy p-6 rounded-xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Award size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold">Target Achieved! Pending Management Promotion</h3>
              <p className="text-sm text-white/80 mt-0.5">
                Outstanding performance! You have reached {formatCurrency(targetData?.totalAchieved || 0)} (≥ ₹50 Lakh). Admin has been notified to confirm your promotion.
              </p>
            </div>
          </div>
          <span className="bg-white text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
            Eligible for Promotion
          </span>
        </div>
      )}

      {/* Main Target Card */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-soft-grey p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-charcoal/60 font-medium mb-1">
              Team Leader Target Progress
            </div>
            <div className="text-2xl font-serif text-brand-deep-navy flex items-center gap-3">
              <span>{targetData?.userName}</span>
              <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md border">
                {targetData?.userCode}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-widest">Target Status</div>
              <div className="mt-1">
                {isPromoted ? (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                    <CheckCircle size={14} /> PROMOTED
                  </span>
                ) : isAchieved ? (
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
                    <Award size={14} /> TARGET ACHIEVED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-brand-architectural-blue text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                    <Clock size={14} /> IN PROGRESS
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Key Numbers */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2">
            <div>
              <span className="text-3xl font-serif text-brand-deep-navy font-bold">
                {formatCurrency(targetData?.totalAchieved || 0)}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                achieved of {formatCurrency(TARGET_AMOUNT)} target
              </span>
            </div>
            <div className="text-sm font-semibold text-brand-architectural-blue">
              {progressPercent.toFixed(1)}% Completed
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden p-0.5 border border-gray-200">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isPromoted 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                  : isAchieved 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600' 
                    : 'bg-gradient-to-r from-brand-architectural-blue to-blue-600'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
            <span>₹0 (Starting Goal)</span>
            <span>
              {targetData && targetData.remainingAmount > 0 
                ? `${formatCurrency(targetData.remainingAmount)} remaining to reach ₹50 Lakh`
                : '₹50 Lakh target reached!'}
            </span>
            <span>{formatCurrency(TARGET_AMOUNT)}</span>
          </div>
        </div>

        {/* Breakdown Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="bg-brand-off-white/60 p-4 rounded-lg border border-brand-soft-grey">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
              <Briefcase size={14} className="text-brand-architectural-blue" />
              Self Performance
            </div>
            <div className="text-xl font-serif text-brand-deep-navy font-bold">
              {formatCurrency(targetData?.selfAmount || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {targetData?.selfRecords.length || 0} personal entries
            </div>
          </div>

          <div className="bg-brand-off-white/60 p-4 rounded-lg border border-brand-soft-grey">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
              <Users size={14} className="text-green-600" />
              Team Performance
            </div>
            <div className="text-xl font-serif text-brand-deep-navy font-bold">
              {formatCurrency(targetData?.teamAmount || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {targetData?.teamRecords.length || 0} downline Associate deals
            </div>
          </div>

          <div className="bg-brand-off-white/60 p-4 rounded-lg border border-brand-soft-grey">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
              <TrendingUp size={14} className="text-amber-600" />
              Remaining Amount
            </div>
            <div className="text-xl font-serif text-brand-deep-navy font-bold">
              {formatCurrency(targetData?.remainingAmount || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {targetData && targetData.remainingAmount === 0 ? 'Goal achieved!' : 'To qualify for promotion'}
            </div>
          </div>
        </div>
      </div>

      {/* Target Policy & Rules Note */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-5 flex items-start gap-3 text-sm text-blue-900">
        <AlertCircle size={20} className="text-brand-architectural-blue shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-brand-deep-navy">Promotion Target Calculation Rules:</div>
          <p className="text-blue-950/80 text-xs leading-relaxed">
            Eligible progress combines <strong>Self Performance</strong> (your personal sales records) and <strong>Team Performance</strong> (sales from Associates assigned directly to you). Progress is measured against the total business amount. Reaching ₹50 Lakh marks your profile as eligible for promotion; Senior Team Leader rank is officially conferred by Management.
          </p>
        </div>
      </div>

      {/* Contribution Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
          <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-architectural-blue" />
            Eligible Target Contribution Records ({targetData?.allRecords.length || 0})
          </h2>
          {targetData?.lastUpdated && (
            <span className="text-xs text-gray-500">
              Last updated: {new Date(targetData.lastUpdated).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-brand-charcoal">
              <tr>
                <th className="px-6 py-3 font-medium">Sr. No.</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Client / Customer</th>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium text-right">Business Amount</th>
                <th className="px-6 py-3 font-medium text-right">Booking Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {targetData?.allRecords.map((r, idx) => {
                const isSelf = targetData.selfRecords.some(s => s.id === r.id);
                return (
                  <tr key={r.id || idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{idx + 1}</td>
                    <td className="px-6 py-4">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {isSelf ? (
                        <span className="bg-blue-50 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-100">
                          Self Business
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-100">
                          Associate Team
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-brand-deep-navy">{r.customer_name}</td>
                    <td className="px-6 py-4 text-gray-600">{r.project_name}</td>
                    <td className="px-6 py-4 text-right font-medium text-brand-architectural-blue">
                      {formatCurrency(r.deal_amount || r.total_amount || 0)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {formatCurrency(r.booking_amount || 0)}
                    </td>
                  </tr>
                );
              })}
              {(!targetData || targetData.allRecords.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No eligible business records recorded yet. Your target progress will appear here as deals are booked.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
