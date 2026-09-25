import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-brand-warm-white">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-deep-navy text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-serif tracking-tight">KHU DEVELOPERS</h2>
          <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin" className="block px-4 py-2 rounded hover:bg-white/10 text-sm font-medium transition-colors">Dashboard</Link>
          <Link to="/admin/applications" className="block px-4 py-2 rounded hover:bg-white/10 text-sm font-medium transition-colors">Applications</Link>
          <Link to="/admin/users" className="block px-4 py-2 rounded hover:bg-white/10 text-sm font-medium transition-colors">Users & Hierarchy</Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium">{profile?.full_name}</p>
            <p className="text-xs text-white/50">{profile?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded hover:bg-white/10 text-sm font-medium transition-colors text-red-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white border-b border-brand-soft-grey p-6 flex justify-between items-center shadow-sm">
          <h1 className="text-xl font-serif text-brand-deep-navy">Overview</h1>
        </header>
        <div className="p-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
