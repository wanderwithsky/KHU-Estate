import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="fixed w-full z-50 bg-white border-b border-brand-soft-grey">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center h-[60px]">
        <Link to="/" className="flex items-center gap-3">
          {/* Replace src with actual logo file path when provided */}
          <img src="/logo.png" alt="KHU Estate Logo" className="h-[40px] w-auto object-contain" onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} />
          <span className="text-xl font-medium tracking-tight font-serif text-black">KHU ESTATE</span>
        </Link>
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
      </div>
    </nav>
  );
}
