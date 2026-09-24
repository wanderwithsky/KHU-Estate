import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useHeartbeat } from './hooks/useHeartbeat';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import JoinAssociate from './pages/JoinAssociate';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import SeniorTLLayout from './components/SeniorTLLayout';
import SeniorTLDashboard from './pages/senior-tl/SeniorTLDashboard';
import SeniorTLTeam from './pages/senior-tl/SeniorTLTeam';
import TeamLeaderLayout from './components/TeamLeaderLayout';
import TeamLeaderDashboard from './pages/team-leader/TeamLeaderDashboard';

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { session, profile, isInitialized } = useAuth();
  
  useHeartbeat(); // Fire heartbeat for authenticated users
  
  if (!isInitialized) {
    return <div className="p-8 text-center mt-24">Loading...</div>;
  }

  if (!session) {
    return <div className="p-8 text-center mt-24">Please <a href="/login" className="text-brand-architectural-blue underline">login</a> to view this page.</div>;
  }
  
  if (profile && !allowedRoles.includes(profile.role)) {
    return <div className="p-8 text-center mt-24 text-red-600">Access Denied: You do not have permission to view this page.</div>;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Navbar & Footer */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/maa-kundwasini-nagar" element={<ProjectDetails />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="contact" element={<Contact />} />
            <Route path="join/associate" element={<JoinAssociate />} />
          </Route>

          {/* Standalone Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes (No public Navbar/Footer) */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="applications" element={<div className="p-6">Applications Module (Coming Soon)</div>} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Protected Senior TL Routes */}
          <Route path="/senior-team-leader" element={
            <ProtectedRoute allowedRoles={['SENIOR_TL', 'ADMIN']}>
              <SeniorTLLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SeniorTLDashboard />} />
            <Route path="team" element={<SeniorTLTeam />} />
          </Route>

          {/* Protected Team Leader Routes */}
          <Route path="/team-leader" element={
            <ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
              <TeamLeaderLayout />
            </ProtectedRoute>
          }>
            <Route index element={<TeamLeaderDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
