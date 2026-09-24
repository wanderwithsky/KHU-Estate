import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useHeartbeat } from './hooks/useHeartbeat';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import JoinTeam from './pages/JoinTeam';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';

// Dashboards
import DashboardLayout from './components/DashboardLayout';
import FeatureShell from './components/FeatureShell';

// Admin
import AdminDashboard from './pages/AdminDashboard';
import AdminApplications from './pages/admin/AdminApplications';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTeam from './pages/admin/AdminTeam';

// Senior TL
import SeniorTLDashboard from './pages/senior-tl/SeniorTLDashboard';
import SeniorTLTeam from './pages/senior-tl/SeniorTLTeam';

// Team Leader
import TeamLeaderDashboard from './pages/team-leader/TeamLeaderDashboard';
import TeamLeaderTeam from './pages/team-leader/TeamLeaderTeam';

// Shared
import Profile from './components/Profile';

// Associate
import AssociateDashboard from './pages/associate/AssociateDashboard';
import AssociateTeam from './pages/associate/AssociateTeam';

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
            <Route path="join/associate" element={<JoinTeam />} />
            <Route path="join/team-leader" element={<JoinTeam />} />
            <Route path="join/senior-team-leader" element={<JoinTeam />} />
          </Route>

          {/* Standalone Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            {/* Applications */}
            <Route path="applications" element={<AdminApplications />} />
            <Route path="pending-applications" element={<FeatureShell title="Pending Applications" />} />
            <Route path="approved-applications" element={<FeatureShell title="Approved Applications" />} />
            <Route path="declined-applications" element={<FeatureShell title="Declined Applications" />} />
            {/* Hierarchy */}
            <Route path="users" element={<AdminUsers />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="senior-team-leaders" element={<FeatureShell title="Senior Team Leaders" />} />
            <Route path="team-leaders" element={<FeatureShell title="Team Leaders" />} />
            <Route path="associates" element={<FeatureShell title="Associates" />} />
            {/* Business */}
            <Route path="business" element={<FeatureShell title="Total Business" />} />
            <Route path="leads" element={<FeatureShell title="Leads" />} />
            <Route path="clients" element={<FeatureShell title="Clients" />} />
            <Route path="visits" element={<FeatureShell title="Site Visits" />} />
            <Route path="deals" element={<FeatureShell title="Deals / Bookings" />} />
            <Route path="payments" element={<FeatureShell title="Payments" />} />
            <Route path="commissions" element={<FeatureShell title="Commissions" />} />
            {/* Finance */}
            <Route path="income" element={<FeatureShell title="Income" />} />
            <Route path="expenses" element={<FeatureShell title="Expenses" />} />
            <Route path="finance-reports" element={<FeatureShell title="Revenue Reports" />} />
            {/* Performance */}
            <Route path="performance-stl" element={<FeatureShell title="Senior TL Performance" />} />
            <Route path="performance-tl" element={<FeatureShell title="Team Leader Performance" />} />
            <Route path="performance-associate" element={<FeatureShell title="Associate Performance" />} />
            <Route path="targets" element={<FeatureShell title="Targets" />} />
            <Route path="rewards" element={<FeatureShell title="Rewards" />} />
            {/* Reports */}
            <Route path="reports-business" element={<FeatureShell title="Business Reports" />} />
            <Route path="reports-income" element={<FeatureShell title="Income Reports" />} />
            <Route path="reports-visits" element={<FeatureShell title="Visit Reports" />} />
            <Route path="reports-performance" element={<FeatureShell title="Performance Reports" />} />
            {/* System */}
            <Route path="notifications" element={<FeatureShell title="Notifications" />} />
            <Route path="audit-logs" element={<FeatureShell title="Activity Logs" />} />
            <Route path="settings" element={<FeatureShell title="Settings" />} />
          </Route>

          {/* Protected Senior TL Routes */}
          <Route path="/senior-team-leader" element={
            <ProtectedRoute allowedRoles={['SENIOR_TL', 'ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SeniorTLDashboard />} />
            <Route path="team" element={<SeniorTLTeam />} />
            <Route path="associates" element={<FeatureShell title="My Associates" />} />
            
            <Route path="tl-applications" element={<FeatureShell title="Team Leader Apps" />} />
            <Route path="associate-applications" element={<FeatureShell title="Associate Apps" />} />
            
            <Route path="performance" element={<FeatureShell title="Team Performance" />} />
            <Route path="business" element={<FeatureShell title="Total Business" />} />
            <Route path="visits" element={<FeatureShell title="Total Visits" />} />
            <Route path="rewards" element={<FeatureShell title="Rewards" />} />
            
            <Route path="reports-income" element={<FeatureShell title="Income Report" />} />
            <Route path="reports-business" element={<FeatureShell title="Business Report" />} />
            <Route path="reports-visits" element={<FeatureShell title="Visit Report" />} />
            
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<FeatureShell title="Notifications" />} />
            <Route path="settings" element={<FeatureShell title="Settings" />} />
          </Route>

          <Route path="/team-leader" element={
            <ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<TeamLeaderDashboard />} />
            <Route path="team" element={<TeamLeaderTeam />} />
            <Route path="applications" element={<FeatureShell title="Associate Applications" />} />
            
            <Route path="leads" element={<FeatureShell title="Leads" />} />
            <Route path="clients" element={<FeatureShell title="Clients" />} />
            <Route path="business" element={<FeatureShell title="Total Business" />} />
            <Route path="deals" element={<FeatureShell title="Deals / Bookings" />} />
            
            <Route path="plot-visits" element={<FeatureShell title="Plot Visits" />} />
            <Route path="visits" element={<FeatureShell title="Total Visits" />} />
            
            <Route path="targets" element={<FeatureShell title="Targets" />} />
            <Route path="rewards" element={<FeatureShell title="Rewards" />} />
            
            <Route path="reports-income" element={<FeatureShell title="Income Report" />} />
            <Route path="reports-business" element={<FeatureShell title="Business Report" />} />
            <Route path="reports-visits" element={<FeatureShell title="Visit Report" />} />
            
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<FeatureShell title="Notifications" />} />
            <Route path="settings" element={<FeatureShell title="Settings" />} />
          </Route>

          <Route path="/associate" element={
            <ProtectedRoute allowedRoles={['ASSOCIATE', 'ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AssociateDashboard />} />
            <Route path="team" element={<AssociateTeam />} />
            <Route path="profile" element={<Profile />} />
            <Route path="income" element={<FeatureShell title="Income Report" />} />
            <Route path="business" element={<FeatureShell title="Total Business" />} />
            <Route path="rewards" element={<FeatureShell title="Rewards" />} />
            <Route path="visits" element={<FeatureShell title="Plot Visits" />} />
            <Route path="my-visits" element={<FeatureShell title="My Visits" />} />
            <Route path="my-business" element={<FeatureShell title="My Business" />} />
            <Route path="notifications" element={<FeatureShell title="Notifications" />} />
            <Route path="settings" element={<FeatureShell title="Settings" />} />
          </Route>
          
          {/* Catch all to redirect to home or 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
