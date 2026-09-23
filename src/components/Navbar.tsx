import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="fixed w-full z-50 bg-white border-b border-brand-soft-grey">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center h-[60px]">
        <Link to="/" className="flex items-center gap-3 relative z-50">
          {/* Replace src with actual logo file path when provided */}
          <img src="/logo.png" alt="KHU Estate Logo" className="h-[40px] w-auto object-contain" onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} />
          <span className="text-xl font-medium tracking-tight font-serif text-black">KHU ESTATE</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-10 text-sm tracking-widest font-medium uppercase text-black/80">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <Link to="/projects" className="hover:text-black transition-colors">Projects</Link>
          <Link to="/about" className="hover:text-black transition-colors">About</Link>
          <Link to="/services" className="hover:text-black transition-colors">Services</Link>
          <Link to="/contact" className="hover:text-black transition-colors">Contact</Link>
          
          <div className="relative group h-[60px] flex items-center">
            <button 
              className="bg-brand-deep-navy text-white hover:bg-brand-architectural-blue transition-colors uppercase tracking-widest cursor-pointer focus:outline-none px-6 py-2.5 text-xs font-medium rounded-md border border-transparent hover:border-brand-architectural-blue"
              aria-haspopup="true"
            >
              Join
            </button>
            {/* The Dropdown Container with a hover-safe bridge area (pt-3) */}
            <div className="absolute right-0 top-full pt-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out -translate-y-1.5 group-hover:translate-y-0">
              {/* Premium Floating Panel */}
              <div className="bg-white border border-brand-soft-grey/60 shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-lg p-2 min-w-[220px]">
                <Link 
                  to="/join/associate" 
                  className="group/link flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-brand-off-white transition-all duration-200 focus:outline-none focus:bg-brand-off-white"
                  role="menuitem"
                >
                  <span className="font-semibold text-black text-[15px] transform transition-transform duration-200 group-hover/link:translate-x-0.5">
                    Join as an Associate
                  </span>
                  <span className="text-black/40 group-hover/link:text-black transform transition-transform duration-200 group-hover/link:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="md:hidden relative z-50 p-2 -mr-2 text-brand-deep-navy focus:outline-none focus:ring-2 focus:ring-brand-architectural-blue rounded"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <div className="w-6 h-5 relative flex flex-col justify-between overflow-hidden">
            <span className={`w-full h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
            <span className={`w-full h-0.5 bg-current transition-all duration-200 ease-in-out ${isMobileMenuOpen ? 'opacity-0 translate-x-3' : 'opacity-100'}`} />
            <span className={`w-full h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-40 transition-all duration-500 ease-in-out md:hidden flex flex-col pt-[80px] px-8 pb-12 overflow-y-auto ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col space-y-8 mt-12">
          {[
            { name: 'Home', path: '/' },
            { name: 'Projects', path: '/projects' },
            { name: 'About', path: '/about' },
            { name: 'Services', path: '/services' },
            { name: 'Contact', path: '/contact' },
          ].map((item, i) => (
            <Link 
              key={item.name}
              to={item.path} 
              className={`text-3xl font-serif tracking-tight text-brand-deep-navy transform transition-all duration-500 delay-${i * 100} ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >
              {item.name}
            </Link>
          ))}
          
          <div className={`pt-8 border-t border-brand-soft-grey transform transition-all duration-700 delay-500 ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <span className="text-xs tracking-widest uppercase text-brand-charcoal/60 mb-4 block">Careers</span>
            <Link 
              to="/join/associate"
              className="inline-flex items-center justify-between w-full bg-brand-deep-navy text-white px-6 py-4 rounded-md uppercase tracking-widest text-sm font-medium active:bg-brand-architectural-blue transition-colors"
            >
              <span>Join as an Associate</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
