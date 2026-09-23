import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-3xl font-serif tracking-tight mb-4">KHU ESTATE</h2>
          <p className="text-brand-soft-grey text-sm max-w-sm">
            K.H.U. DEVELOPERS PRIVATE LIMITED
          </p>
          <p className="mt-6 text-brand-soft-grey text-sm max-w-sm">
            Thoughtfully planned spaces for living, investing, and building what comes next.
          </p>
        </div>
        
        <div>
          <h3 className="text-sm uppercase tracking-widest text-brand-soft-grey mb-6">Navigation</h3>
          <ul className="space-y-4">
            <li><Link to="/" className="hover:text-white transition-colors text-sm">Home</Link></li>
            <li><Link to="/projects" className="hover:text-white transition-colors text-sm">Projects</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors text-sm">About</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors text-sm">Services</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors text-sm">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-widest text-brand-soft-grey mb-6">Join Us</h3>
          <ul className="space-y-4 mb-8">
            <li><Link to="/join/associate" className="hover:text-white transition-colors text-sm">Join as Associate</Link></li>
          </ul>

          <h3 className="text-sm uppercase tracking-widest text-brand-soft-grey mb-6">Social</h3>
          <ul className="flex space-x-6">
            <li><a href="#" className="hover:text-white transition-colors text-sm">Instagram</a></li>
            <li><a href="#" className="hover:text-white transition-colors text-sm">Facebook</a></li>
            <li><a href="#" className="hover:text-white transition-colors text-sm">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-24 pt-8 border-t border-white/10 text-xs text-brand-soft-grey flex justify-between">
        <p>&copy; {new Date().getFullYear()} K.H.U. Developers Private Limited. All rights reserved.</p>
        <p>Premium Real Estate</p>
      </div>
    </footer>
  );
}
