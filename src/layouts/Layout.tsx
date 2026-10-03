import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import PWAUpdatePrompt from '../components/PWAUpdatePrompt';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-brand-architectural-blue selection:text-white">
      <PWAInstallPrompt />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <PWAUpdatePrompt />
    </div>
  );
}
