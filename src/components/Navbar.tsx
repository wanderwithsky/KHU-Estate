import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone } from 'lucide-react';

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
    <nav className="fixed w-full z-50 bg-white border-b border-brand-soft-grey shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex justify-between items-center h-[60px]">
        <Link to="/" className="flex items-center gap-3 relative z-50 shrink-0">
          {/* Replace src with actual logo file path when provided */}
          <img src="/logo.png" alt="KHU Developers Logo" className="h-[38px] w-auto object-contain" onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} />
          <span className="text-lg md:text-xl font-medium tracking-tight font-serif text-black">KHU DEVELOPERS</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-xs xl:text-sm tracking-widest font-medium uppercase text-black/80">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <Link to="/projects" className="hover:text-black transition-colors">Projects</Link>
          <Link to="/about" className="hover:text-black transition-colors">About</Link>
          <Link to="/services" className="hover:text-black transition-colors">Services</Link>
          <Link to="/contact" className="hover:text-black transition-colors">Contact</Link>
          <Link to="/login" className="hover:text-black transition-colors">Login</Link>
          
          <div className="relative group h-[60px] flex items-center">
            <button 
              className="bg-brand-deep-navy text-white hover:bg-brand-architectural-blue transition-colors uppercase tracking-widest cursor-pointer focus:outline-none px-4 py-2 text-xs font-medium rounded-md border border-transparent hover:border-brand-architectural-blue"
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

          {/* Prominent Header Call Button */}
          <a
            href="tel:+916394247451"
            className="flex items-center gap-2 bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-deep-navy px-3.5 py-2 rounded-full border border-brand-gold/40 text-xs font-bold tracking-wider transition-all duration-200 hover:scale-105"
            aria-label="Call KHU Developers at 6394247451"
          >
            <Phone size={14} className="text-brand-deep-navy fill-brand-deep-navy/20" />
            <span>6394247451</span>
          </a>
        </div>

        {/* Right side for mobile/tablet: Quick Call + Hamburger */}
        <div className="flex items-center gap-3 lg:hidden">
          <a
            href="tel:+916394247451"
            className="flex items-center gap-1.5 bg-brand-gold/15 active:bg-brand-gold/30 text-brand-deep-navy px-2.5 py-1.5 rounded-full border border-brand-gold/40 text-xs font-bold transition-transform"
            aria-label="Call Now at 6394247451"
          >
            <Phone size={13} className="text-brand-deep-navy fill-brand-deep-navy/20" />
            <span className="text-[11px] sm:text-xs">6394247451</span>
          </a>

          {/* Mobile Hamburger Button */}
          <button 
            className="relative z-50 p-2 -mr-2 text-brand-deep-navy focus:outline-none focus:ring-2 focus:ring-brand-architectural-blue rounded"
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
            { name: 'Login', path: '/login' },
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

          {/* Mobile Drawer Call CTA */}
          <div className="pt-6 border-t border-brand-soft-grey">
            <span className="text-xs tracking-widest uppercase text-brand-charcoal/60 mb-3 block">Direct Contact</span>
            <a
              href="tel:+916394247451"
              className="flex items-center justify-center gap-3 w-full bg-brand-gold text-brand-deep-navy px-6 py-4 rounded-md uppercase tracking-widest text-sm font-bold shadow-md hover:bg-brand-architectural-blue hover:text-white transition-colors"
            >
              <Phone size={18} />
              <span>Call Now: 6394247451</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
