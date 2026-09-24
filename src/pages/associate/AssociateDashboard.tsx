import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatUser } from '../../utils/formatUser';
import { Briefcase, BarChart3, MapPin, Award, User, Phone, Mail, ShieldAlert } from 'lucide-react';

export default function AssociateDashboard() {
  const { profile } = useCurrentUser();
  const [teamLeader, setTeamLeader] = useState<any>(null);
  const [seniorTL, setSeniorTL] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mocking stats since there's no backend for these yet
  const stats = {
    totalBusiness: 0,
    income: 0,
    totalVisits: 0,
    rewards: 0
  };

  useEffect(() => {
    async function fetchHierarchy() {
      if (!profile) return;

      try {
        if (profile.parent_user_id) {
          const { data: tlData } = await supabase
            .from('user_profiles')
            .select('user_code, full_name')
            .eq('id', profile.parent_user_id)
            .single();
          if (tlData) setTeamLeader(tlData);
        }

        if (profile.senior_tl_id) {
          const { data: stlData } = await supabase
            .from('user_profiles')
            .select('user_code, full_name')
            .eq('id', profile.senior_tl_id)
            .single();
          if (stlData) setSeniorTL(stlData);
        }
      } catch (err) {
        console.error('Error fetching hierarchy', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHierarchy();
  }, [profile]);

  if (!profile) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const KpiCard = ({ title, value, icon: Icon, colorClass, emptyState }: any) => (
    <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg flex items-center justify-between group hover:shadow-md transition-shadow duration-300">
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">{title}</h3>
        {value === 0 ? (
          <p className="text-sm font-sans text-brand-charcoal/60 italic">{emptyState}</p>
        ) : (
          <p className="text-2xl font-serif text-brand-deep-navy">{value}</p>
        )}
      </div>
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={colorClass} size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-brand-deep-navy mb-1">{getGreeting()}, {formatUser(profile.user_code, profile.full_name)}</h2>
        <p className="text-sm text-brand-charcoal/70">Here's your KHU Estate performance overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Business" value={stats.totalBusiness} emptyState="No business generated yet." icon={Briefcase} colorClass="text-indigo-600" />
        <KpiCard title="Income" value={stats.income} emptyState="No income records available yet." icon={BarChart3} colorClass="text-green-600" />
        <KpiCard title="Total Visits" value={stats.totalVisits} emptyState="No visits scheduled yet." icon={MapPin} colorClass="text-purple-600" />
        <KpiCard title="Rewards" value={stats.rewards} emptyState="No rewards available yet." icon={Award} colorClass="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        
        {/* My Profile */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex items-center gap-2">
            <User size={18} className="text-brand-architectural-blue" />
            <h3 className="font-serif text-brand-deep-navy text-lg">My Profile</h3>
          </div>
          <div className="p-6 flex-1 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-2xl font-serif">
                {profile.full_name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-brand-deep-navy text-lg">{formatUser(profile.user_code, profile.full_name)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-brand-charcoal/40 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Email</p>
                  <p className="text-sm font-medium text-brand-deep-navy">{profile.email}</p>
                </div>
              </div>
              
              {profile.mobile && (
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-brand-charcoal/40 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Mobile</p>
                    <p className="text-sm font-medium text-brand-deep-navy">{profile.mobile}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <ShieldAlert size={16} className="text-brand-charcoal/40 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Account Status</p>
                  <span className={`px-2 py-1 inline-flex text-[10px] uppercase tracking-wider font-medium rounded-full ${
                    profile.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchy / My Team */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-soft-grey overflow-hidden h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-brand-off-white flex items-center gap-2">
            <Award size={18} className="text-brand-architectural-blue" />
            <h3 className="font-serif text-brand-deep-navy text-lg">My Hierarchy</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="animate-pulse flex flex-col items-center gap-4 py-8">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-brand-architectural-blue/20 before:via-brand-primary/20 before:to-transparent space-y-8 pl-1">
                
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-architectural-blue/10 text-brand-architectural-blue flex items-center justify-center z-10 ring-4 ring-white shadow-sm shrink-0 font-medium">
                    {seniorTL ? seniorTL.full_name.charAt(0) : '?'}
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Senior Team Leader</p>
                    {seniorTL ? (
                      <>
                        <p className="font-medium text-brand-deep-navy text-base">{formatUser(seniorTL.user_code, seniorTL.full_name)}</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-brand-charcoal italic">Not Assigned</p>
                    )}
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center z-10 ring-4 ring-white shadow-sm shrink-0 font-medium">
                    {teamLeader ? teamLeader.full_name.charAt(0) : '?'}
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1 font-medium">Team Leader</p>
                    {teamLeader ? (
                      <>
                        <p className="font-medium text-brand-deep-navy text-base">{formatUser(teamLeader.user_code, teamLeader.full_name)}</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-brand-charcoal italic">Not Assigned</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
