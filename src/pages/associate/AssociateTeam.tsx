import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatUser } from '../../utils/formatUser';
import HierarchyNode from '../../components/HierarchyNode';

export default function AssociateTeam() {
  const { profile } = useCurrentUser();
  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHierarchy = async () => {
      setLoading(true);
      
      let tl = null;
      let stl = null;

      if (profile?.parent_user_id) {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', profile.parent_user_id).single();
        tl = data;
      }

      if (profile?.senior_tl_id || tl?.parent_user_id) {
        const targetId = profile?.senior_tl_id || tl?.parent_user_id;
        if (targetId) {
          const { data } = await supabase.from('user_profiles').select('*').eq('id', targetId).single();
          stl = data;
        }
      }

      // Build the upward tree manually
      const meNode = { ...profile, children: [] };
      
      if (tl) {
        const tlNode = { ...tl, children: [meNode] };
        if (stl) {
          setTree({ ...stl, children: [tlNode] });
        } else {
          setTree(tlNode);
        }
      } else if (stl) {
        setTree({ ...stl, children: [meNode] });
      } else {
        setTree(meNode);
      }

      setLoading(false);
    };

    if (profile) {
      fetchHierarchy();
    }
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif text-brand-deep-navy">My Team</h2>
          <p className="text-sm text-brand-charcoal/70 mt-1">
            You are: <span className="font-medium text-brand-architectural-blue">{formatUser(profile?.user_code, profile?.full_name)}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey p-8 overflow-x-auto">
        <div className="min-w-max">
          {loading ? (
            <div className="text-brand-charcoal/60 p-4">Loading hierarchy...</div>
          ) : tree ? (
            <HierarchyNode user={tree} isRoot={true} />
          ) : (
            <div className="text-brand-charcoal/60 p-4">No hierarchy found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
