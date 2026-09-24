import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileJoinOpen, setIsMobileJoinOpen] = useState(false);
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
            {/* The Dropdown Container with a hover-safe bridge area (pt-2) */}
            <div className="absolute right-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 ease-out -translate-y-2 group-hover:translate-y-0">
              {/* Premium Floating Panel */}
              <div className="bg-white/95 backdrop-blur-md border border-brand-charcoal/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-xl p-2.5 min-w-[260px] flex flex-col gap-1">
                
                <Link 
                  to="/join/associate" 
                  className="group/link flex items-center px-4 py-3 rounded-lg hover:bg-brand-off-white transition-all duration-200 focus:outline-none"
                  role="menuitem"
                >
                  <span className="font-medium text-brand-deep-navy text-[15px] transform transition-transform duration-300 group-hover/link:translate-x-1.5">
                    As a Associate
                  </span>
                </Link>

                <Link 
                  to="/join/team-leader" 
                  className="group/link flex items-center px-4 py-3 rounded-lg hover:bg-brand-off-white transition-all duration-200 focus:outline-none"
                  role="menuitem"
                >
                  <span className="font-medium text-brand-deep-navy text-[15px] transform transition-transform duration-300 group-hover/link:translate-x-1.5">
                    As a Team Leader
                  </span>
                </Link>

                <Link 
                  to="/join/senior-team-leader" 
                  className="group/link flex items-center px-4 py-3 rounded-lg hover:bg-brand-off-white transition-all duration-200 focus:outline-none"
                  role="menuitem"
                >
                  <span className="font-medium text-brand-deep-navy text-[15px] transform transition-transform duration-300 group-hover/link:translate-x-1.5">
                    As a Senior Team Leader
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
            <button 
              onClick={() => setIsMobileJoinOpen(!isMobileJoinOpen)}
              className="flex items-center justify-between w-full bg-brand-deep-navy text-white px-6 py-4 rounded-md uppercase tracking-widest text-sm font-medium transition-colors focus:outline-none"
            >
              <span>Join</span>
              <span className={`transform transition-transform duration-300 ${isMobileJoinOpen ? 'rotate-180' : ''}`}>↓</span>
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileJoinOpen ? 'max-h-64 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}`}>
              <div className="bg-brand-off-white/80 backdrop-blur-md rounded-lg p-2 flex flex-col gap-1 border border-brand-charcoal/10 shadow-sm">
                <Link 
                  to="/join/associate"
                  className="block px-4 py-3 rounded-md text-brand-deep-navy text-[15px] font-medium active:bg-brand-soft-grey transition-colors"
                >
                  As a Associate
                </Link>
                <Link 
                  to="/join/team-leader"
                  className="block px-4 py-3 rounded-md text-brand-deep-navy text-[15px] font-medium active:bg-brand-soft-grey transition-colors"
                >
                  As a Team Leader
                </Link>
                <Link 
                  to="/join/senior-team-leader"
                  className="block px-4 py-3 rounded-md text-brand-deep-navy text-[15px] font-medium active:bg-brand-soft-grey transition-colors"
                >
                  As a Senior Team Leader
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
