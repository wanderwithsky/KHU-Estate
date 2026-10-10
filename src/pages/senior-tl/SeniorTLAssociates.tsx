import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatUser } from '../../utils/formatUser';
import { Users, AlertCircle } from 'lucide-react';

export default function SeniorTLAssociates() {
  const { profile } = useCurrentUser();
  const [associates, setAssociates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile?.id) return;
    
    async function fetchAssociates() {
      setLoading(true);
      setError('');
      try {
        // Fetch Associates under this STL
        const { data: teamData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*, parent:parent_user_id(full_name, user_code)')
          .eq('senior_tl_id', profile!.id)
          .eq('role', 'ASSOCIATE')
          .order('created_at', { ascending: false });
          
        if (profileError) throw profileError;

        const associatesList = (teamData || []).map(member => ({
          ...member,
          totalBusiness: 0
        }));

        // Fetch businesses to calculate totals
        if (associatesList.length > 0) {
          const associateIds = associatesList.map(a => a.id);
          const { data: businessesData, error: bizError } = await supabase
            .from('businesses')
            .select('associate_id, deal_amount, total_amount')
            .in('associate_id', associateIds)
            .eq('stl_id', profile!.id);
            
          if (!bizError && businessesData) {
            businessesData.forEach(biz => {
              const amount = biz.deal_amount || biz.total_amount || 0;
              const assoc = associatesList.find(a => a.id === biz.associate_id);
              if (assoc) {
                assoc.totalBusiness += amount;
              }
            });
          }
        }
        
        setAssociates(associatesList);
      } catch (err: any) {
        console.error('Error fetching associates:', err);
        setError('Failed to load associates. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchAssociates();
  }, [profile]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif text-brand-deep-navy">My Associates</h2>
          <p className="text-sm text-brand-charcoal/70">View and manage all Associates in your hierarchy.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex justify-between items-center">
          <h2 className="text-lg font-serif text-brand-deep-navy flex items-center gap-2">
            Associates Directory
            {associates.length > 0 && (
              <span className="bg-brand-charcoal/10 text-brand-charcoal text-xs px-2 py-0.5 rounded-full font-medium">
                {associates.length}
              </span>
            )}
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-brand-charcoal/60">Loading associates...</div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center justify-center text-red-600">
            <AlertCircle size={32} className="mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-brand-charcoal text-[10px] uppercase tracking-wider bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Associate</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Assigned TL</th>
                  <th className="px-6 py-4 font-medium text-right">Current Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {associates.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-charcoal/10 text-brand-charcoal flex items-center justify-center font-medium">
                          {assoc.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-brand-deep-navy">{formatUser(assoc.user_code, assoc.full_name)}</div>
                          <div className="text-xs text-brand-charcoal/60">{assoc.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full ${
                        assoc.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assoc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-brand-charcoal">
                      {assoc.user_code}
                    </td>
                    <td className="px-6 py-4">
                      {assoc.parent ? (
                        <div className="font-medium text-brand-deep-navy">
                          {formatUser(assoc.parent.user_code, assoc.parent.full_name)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Direct</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-brand-architectural-blue">
                      ₹{assoc.totalBusiness?.toLocaleString('en-IN') || 0}
                    </td>
                  </tr>
                ))}
                {associates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-charcoal/60">
                      <Users size={48} className="mx-auto text-brand-charcoal/20 mb-4" />
                      <p className="text-lg font-medium text-brand-deep-navy">No Associates assigned to your team yet.</p>
                      <p className="mt-1">When Associates join your hierarchy, they will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
