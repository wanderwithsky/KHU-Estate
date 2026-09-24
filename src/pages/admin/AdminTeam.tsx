import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import HierarchyNode from '../../components/HierarchyNode';

export default function AdminTeam() {
  const { profile } = useCurrentUser();
  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHierarchy = async () => {
      setLoading(true);
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !users) {
        setLoading(false);
        return;
      }

      // Find admin
      const admin = users.find(u => u.role === 'ADMIN') || profile;

      // Build tree
      const buildTree = (user: any): any => {
        let children = users.filter(u => u.parent_user_id === user.id);
        
        // Special case: In some schemas, Team Leaders are assigned to Senior TL via senior_tl_id 
        // and Associates via assigned_tl_id or team_leader_id. 
        // We will check parent_user_id first.
        if (children.length === 0) {
          if (user.role === 'SENIOR_TL') {
            children = users.filter(u => u.senior_tl_id === user.id && u.role === 'TEAM_LEADER');
          } else if (user.role === 'TEAM_LEADER') {
            // Check if associates have parent_user_id or assigned_tl_id
            children = users.filter(u => u.parent_user_id === user.id && u.role === 'ASSOCIATE');
          }
        }

        return {
          ...user,
          children: children.map(buildTree)
        };
      };

      setTree(buildTree(admin));
      setLoading(false);
    };

    fetchHierarchy();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif text-brand-deep-navy">My Team</h2>
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
