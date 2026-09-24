import { useCurrentUser } from '../hooks/useCurrentUser';
import { formatUser } from '../utils/formatUser';
import CopyCode from './CopyCode';
import { User, Mail, Phone, Calendar } from 'lucide-react';

export default function Profile() {
  const { profile } = useCurrentUser();

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-brand-deep-navy mb-1">My Profile</h2>
        <p className="text-sm text-brand-charcoal/70">View your personal information and system identity.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-brand-off-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-3xl font-serif">
              {profile.full_name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-brand-deep-navy text-2xl mb-1">{formatUser(profile.user_code, profile.full_name)}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-mono text-brand-charcoal/70 uppercase tracking-wider">{profile.role.replace(/_/g, ' ')}</span>
                <span className={`px-2.5 py-1 inline-flex text-xs uppercase tracking-wider font-medium rounded-full ${
                  profile.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <span className="text-sm font-medium text-brand-deep-navy">{profile.user_code || 'No Code'}</span>
            <CopyCode code={profile.user_code} />
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="flex items-start gap-3">
              <User size={18} className="text-brand-charcoal/40 mt-1" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Full Name</p>
                <p className="text-base font-medium text-brand-deep-navy">{profile.full_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={18} className="text-brand-charcoal/40 mt-1" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Email Address</p>
                <p className="text-base font-medium text-brand-deep-navy">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={18} className="text-brand-charcoal/40 mt-1" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Mobile Number</p>
                <p className="text-base font-medium text-brand-deep-navy">{profile.mobile || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-brand-charcoal/40 mt-1" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Joined Date</p>
                <p className="text-base font-medium text-brand-deep-navy">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
