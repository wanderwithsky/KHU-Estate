import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <div className="p-8 text-center mt-24">Please <a href="/login" className="text-brand-architectural-blue underline">login</a> to view this page.</div>;
  }
  
  if (user && !allowedRoles.includes(user.role)) {
    return <div className="p-8 text-center mt-24">Access Denied</div>;
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
            <Route path="users" element={<div className="p-6">Users & Hierarchy Module (Coming Soon)</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
