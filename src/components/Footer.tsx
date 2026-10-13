import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-3xl font-serif tracking-tight mb-4">KHU DEVELOPERS</h2>
          <p className="text-brand-soft-grey text-sm max-w-sm">
            K.H.U. DEVELOPERS PRIVATE LIMITED
          </p>
          <p className="mt-4 text-brand-soft-grey text-sm max-w-sm">
            Thoughtfully planned spaces for living, investing, and building what comes next.
          </p>

          <div className="mt-8 pt-6 border-t border-white/10 max-w-md">
            <p className="text-xs uppercase tracking-widest text-brand-gold font-medium mb-2">Direct Phone Enquiries</p>
            <a 
              href="tel:+916394247451" 
              className="inline-flex items-center gap-3 text-white hover:text-brand-gold transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-deep-navy transition-all">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-2xl font-serif font-semibold tracking-wide text-white group-hover:text-brand-gold transition-colors">
                  6394247451
                </span>
                <span className="block text-xs text-brand-soft-grey">
                  Click to Call • Mon–Sun 9:00 AM – 7:00 PM
                </span>
              </div>
            </a>
          </div>
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
