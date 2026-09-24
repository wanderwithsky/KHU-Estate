import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import HierarchyNode from '../../components/HierarchyNode';
import { formatUser } from '../../utils/formatUser';

export default function TeamLeaderTeam() {
  const { profile } = useCurrentUser();
  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seniorTl, setSeniorTl] = useState<any>(null);

  useEffect(() => {
    const fetchHierarchy = async () => {
      setLoading(true);
      // RLS limits fetching downline
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !users || !profile) {
        setLoading(false);
        return;
      }

      const buildTree = (user: any): any => {
        let children = users.filter(u => u.parent_user_id === user.id);
        if (children.length === 0) {
          if (user.role === 'TEAM_LEADER') {
            children = users.filter(u => u.parent_user_id === user.id && u.role === 'ASSOCIATE');
          }
        }
        return {
          ...user,
          children: children.map(buildTree)
        };
      };

      const root = users.find(u => u.id === profile.id);
      if (root) {
        setTree(buildTree(root));
      }

      // Fetch reports to (Senior TL)
      if (profile.senior_tl_id || profile.parent_user_id) {
        // Normally, we'd fetch this. We can use RPC or Edge Function if RLS prevents reading upward.
        // Assuming RLS allows upward reading of parent, or we can just fetch it directly.
        const parentId = profile.senior_tl_id || profile.parent_user_id;
        const { data: pData } = await supabase.from('user_profiles').select('*').eq('id', parentId).single();
        if (pData) {
          setSeniorTl(pData);
        }
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
            You are: <span className="font-medium text-brand-architectural-blue">{formatUser(profile?.user_code, profile?.full_name)}</span> <br/>
            Reports To: <span className="font-medium">{seniorTl ? formatUser(seniorTl.user_code, seniorTl.full_name) : 'Admin'}</span>
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
