import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../context/AuthContext';
import { formatUser } from '../utils/formatUser';
import { 
  Menu, LogOut, User, LayoutDashboard, 
  Users, Briefcase, FileText, BarChart3, Settings, Bell,
  Target, Award, CreditCard, Building, MapPin, Activity, CheckSquare
} from 'lucide-react';

type NavItem = {
  name: string;
  path: string;
  icon?: any;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const ADMIN_MENU: NavSection[] = [
  { label: 'Overview', items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'My Team', path: '/admin/team', icon: Users },
  ]},
  { label: 'Applications', items: [
      { name: 'All Applications', path: '/admin/applications', icon: FileText },
      { name: 'Pending Reviews', path: '/admin/pending-applications', icon: CheckSquare },
      { name: 'Approved', path: '/admin/approved-applications', icon: CheckSquare },
      { name: 'Declined', path: '/admin/declined-applications', icon: CheckSquare },
  ]},
  { label: 'Hierarchy', items: [
      { name: 'Users & Hierarchy', path: '/admin/users', icon: Users },
      { name: 'Senior Team Leaders', path: '/admin/senior-team-leaders', icon: User },
      { name: 'Team Leaders', path: '/admin/team-leaders', icon: User },
      { name: 'Associates', path: '/admin/associates', icon: User },
  ]},
  { label: 'Business', items: [
      { name: 'Total Business', path: '/admin/business', icon: Briefcase },
      { name: 'Leads', path: '/admin/leads', icon: Users },
      { name: 'Clients', path: '/admin/clients', icon: Users },
      { name: 'Site Visits', path: '/admin/visits', icon: MapPin },
      { name: 'Deals / Bookings', path: '/admin/deals', icon: Building },
      { name: 'Payments', path: '/admin/payments', icon: CreditCard },
      { name: 'Commissions', path: '/admin/commissions', icon: CreditCard },
  ]},
  { label: 'Finance', items: [
      { name: 'Income', path: '/admin/income', icon: BarChart3 },
      { name: 'Expenses', path: '/admin/expenses', icon: BarChart3 },
      { name: 'Revenue Reports', path: '/admin/finance-reports', icon: FileText },
  ]},
  { label: 'Performance', items: [
      { name: 'Senior TL Performance', path: '/admin/performance-stl', icon: Activity },
      { name: 'Team Leader Performance', path: '/admin/performance-tl', icon: Activity },
      { name: 'Associate Performance', path: '/admin/performance-associate', icon: Activity },
      { name: 'Targets', path: '/admin/targets', icon: Target },
      { name: 'Rewards', path: '/admin/rewards', icon: Award },
  ]},
  { label: 'Reports', items: [
      { name: 'Business Reports', path: '/admin/reports-business', icon: FileText },
      { name: 'Income Reports', path: '/admin/reports-income', icon: FileText },
      { name: 'Visit Reports', path: '/admin/reports-visits', icon: FileText },
      { name: 'Performance Reports', path: '/admin/reports-performance', icon: FileText },
  ]},
  { label: 'System', items: [
      { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      { name: 'Activity Logs', path: '/admin/audit-logs', icon: Activity },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
  ]},
];

const SENIOR_TL_MENU: NavSection[] = [
  { label: 'Overview', items: [
      { name: 'Dashboard', path: '/senior-team-leader', icon: LayoutDashboard },
      { name: 'My Team', path: '/senior-team-leader/team', icon: Users }
  ]},
  { label: 'Team', items: [
      { name: 'Associates', path: '/senior-team-leader/associates', icon: Users },
  ]},
  { label: 'Applications', items: [
      { name: 'Team Leader Apps', path: '/senior-team-leader/tl-applications', icon: FileText },
      { name: 'Associate Apps', path: '/senior-team-leader/associate-applications', icon: FileText },
  ]},
  { label: 'Performance', items: [
      { name: 'Team Performance', path: '/senior-team-leader/performance', icon: Activity },
      { name: 'Total Business', path: '/senior-team-leader/business', icon: Briefcase },
      { name: 'Total Visits', path: '/senior-team-leader/visits', icon: MapPin },
      { name: 'Rewards', path: '/senior-team-leader/rewards', icon: Award },
  ]},
  { label: 'Reports', items: [
      { name: 'Income Report', path: '/senior-team-leader/reports-income', icon: FileText },
      { name: 'Business Report', path: '/senior-team-leader/reports-business', icon: FileText },
      { name: 'Visit Report', path: '/senior-team-leader/reports-visits', icon: FileText },
  ]},
  { label: 'Profile', items: [
      { name: 'My Profile', path: '/senior-team-leader/profile', icon: User },
  ]},
  { label: 'Account', items: [
      { name: 'Notifications', path: '/senior-team-leader/notifications', icon: Bell },
      { name: 'Settings', path: '/senior-team-leader/settings', icon: Settings },
  ]},
];

const TEAM_LEADER_MENU: NavSection[] = [
  { label: 'Overview', items: [
      { name: 'Dashboard', path: '/team-leader', icon: LayoutDashboard },
      { name: 'My Team', path: '/team-leader/team', icon: Users },
  ]},
  { label: 'Associates', items: [
      { name: 'Associate Applications', path: '/team-leader/applications', icon: FileText },
  ]},
  { label: 'Business', items: [
      { name: 'Leads', path: '/team-leader/leads', icon: Users },
      { name: 'Clients', path: '/team-leader/clients', icon: Users },
      { name: 'Total Business', path: '/team-leader/business', icon: Briefcase },
      { name: 'Deals / Bookings', path: '/team-leader/deals', icon: Building },
  ]},
  { label: 'Visits', items: [
      { name: 'Plot Visits', path: '/team-leader/plot-visits', icon: MapPin },
      { name: 'Total Visits', path: '/team-leader/visits', icon: MapPin },
  ]},
  { label: 'Performance', items: [
      { name: 'Targets', path: '/team-leader/targets', icon: Target },
      { name: 'Rewards', path: '/team-leader/rewards', icon: Award },
  ]},
  { label: 'Reports', items: [
      { name: 'Income Report', path: '/team-leader/reports-income', icon: FileText },
      { name: 'Business Report', path: '/team-leader/reports-business', icon: FileText },
      { name: 'Visit Report', path: '/team-leader/reports-visits', icon: FileText },
  ]},
  { label: 'Profile', items: [
      { name: 'My Profile', path: '/team-leader/profile', icon: User },
  ]},
  { label: 'Account', items: [
      { name: 'Notifications', path: '/team-leader/notifications', icon: Bell },
      { name: 'Settings', path: '/team-leader/settings', icon: Settings },
  ]},
];

const ASSOCIATE_MENU: NavSection[] = [
  { label: 'Overview', items: [
      { name: 'Dashboard', path: '/associate', icon: LayoutDashboard },
      { name: 'My Team', path: '/associate/team', icon: Users }
  ]},
  { label: 'My Account', items: [
      { name: 'My Profile', path: '/associate/profile', icon: User },
  ]},
  { label: 'Performance', items: [
      { name: 'Income Report', path: '/associate/income', icon: BarChart3 },
      { name: 'Total Business', path: '/associate/business', icon: Briefcase },
      { name: 'Rewards', path: '/associate/rewards', icon: Award },
      { name: 'Plot Visits', path: '/associate/visits', icon: MapPin },
  ]},
  { label: 'Activity', items: [
      { name: 'My Visits', path: '/associate/my-visits', icon: MapPin },
      { name: 'My Business', path: '/associate/my-business', icon: Briefcase },
      { name: 'Notifications', path: '/associate/notifications', icon: Bell },
  ]},
  { label: 'Account', items: [
      { name: 'Settings', path: '/associate/settings', icon: Settings },
  ]},
];

export default function DashboardLayout() {
  const { profile } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!profile) return null;

  let menuConfig: NavSection[] = [];
  let roleTitle = '';

  switch (profile.role) {
    case 'ADMIN':
      menuConfig = ADMIN_MENU;
      roleTitle = 'ADMIN PORTAL';
      break;
    case 'SENIOR_TL':
      menuConfig = SENIOR_TL_MENU;
      roleTitle = 'SENIOR TL PORTAL';
      break;
    case 'TEAM_LEADER':
      menuConfig = TEAM_LEADER_MENU;
      roleTitle = 'TEAM LEADER PORTAL';
      break;
    case 'ASSOCIATE':
      menuConfig = ASSOCIATE_MENU;
      roleTitle = 'ASSOCIATE PORTAL';
      break;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-brand-deep-navy text-white/90">
      <div className="p-6 pb-2">
        <h2 className="text-xl font-serif tracking-widest text-white">KHU DEVELOPERS</h2>
        <p className="text-[10px] text-brand-gold uppercase tracking-[0.2em] mt-1 font-medium">{roleTitle}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-white/10">
        {menuConfig.map((section, sIndex) => (
          <div key={sIndex} className="mb-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-medium mb-3 px-2">
              {section.label}
            </h3>
            <div className="space-y-1">
              {section.items.map((item, iIndex) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon || FileText;
                return (
                  <Link
                    key={iIndex}
                    to={item.path}
                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/10 text-white font-medium shadow-inner' 
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-brand-gold' : 'opacity-70'} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-xs font-medium">
            {profile.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{formatUser(profile.user_code, profile.full_name)}</p>
            <p className="text-[10px] text-brand-gold truncate uppercase tracking-wider">{profile.role.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded text-xs font-medium text-red-300 hover:bg-red-500/10 transition-colors border border-red-500/20"
        >
          <LogOut size={14} />
          SECURE LOGOUT
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-brand-warm-white overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-full shadow-2xl z-20 shrink-0 relative">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Header (Mobile & Desktop) */}
        <header className="h-16 bg-white border-b border-brand-soft-grey shadow-sm flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-brand-charcoal hover:bg-brand-off-white rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-serif text-brand-deep-navy hidden lg:block tracking-tight">
              {menuConfig.flatMap(s => s.items).find(i => i.path === location.pathname)?.name || 'Dashboard'}
            </h1>
            <h1 className="text-lg font-serif text-brand-deep-navy lg:hidden">
              KHU DEVELOPERS
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              System Active
            </span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-brand-warm-white/50 relative">
          <div className="absolute inset-0 p-4 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
