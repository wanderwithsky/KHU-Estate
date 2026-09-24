import { Users, User, Shield, Briefcase } from 'lucide-react';
import { formatUser } from '../utils/formatUser';
import CopyCode from './CopyCode';

interface HierarchyNodeProps {
  user: {
    id: string;
    user_code: string;
    full_name: string;
    role: string;
    status: string;
    children?: any[];
  };
  isRoot?: boolean;
}

export default function HierarchyNode({ user, isRoot = false }: HierarchyNodeProps) {
  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'ADMIN': return <Shield size={16} className="text-red-500" />;
      case 'SENIOR_TL': return <Briefcase size={16} className="text-brand-gold" />;
      case 'TEAM_LEADER': return <Users size={16} className="text-brand-architectural-blue" />;
      case 'ASSOCIATE': return <User size={16} className="text-gray-500" />;
      default: return <User size={16} />;
    }
  };

  return (
    <div className="relative">
      {!isRoot && (
        <div className="absolute top-0 left-0 w-8 h-px bg-brand-soft-grey -ml-8 mt-8"></div>
      )}
      
      <div className={`
        relative z-10 bg-white border border-brand-soft-grey rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow
        ${isRoot ? 'mb-8 border-t-4 border-t-brand-primary' : 'mb-4 ml-8'}
        max-w-md
      `}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-off-white flex items-center justify-center shrink-0">
              {getRoleIcon(user.role)}
            </div>
            <div>
              <div className="font-medium text-brand-deep-navy text-sm md:text-base">
                {formatUser(user.user_code, user.full_name)}
              </div>
              <div className="text-xs text-brand-charcoal/70 flex items-center gap-2 mt-1">
                <span>{user.role.replace('_', ' ')}</span>
                <span>•</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>
          <CopyCode code={user.user_code} />
        </div>
      </div>

      {user.children && user.children.length > 0 && (
        <div className={`relative ${!isRoot ? 'ml-8' : ''}`}>
          <div className="absolute top-0 bottom-8 left-0 w-px bg-brand-soft-grey"></div>
          {user.children.map((child) => (
            <HierarchyNode key={child.id} user={child} />
          ))}
        </div>
      )}
    </div>
  );
}
