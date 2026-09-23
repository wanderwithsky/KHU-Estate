export default function About() {
  return (
    <div className="w-full bg-brand-off-white min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-20 text-center">
        <h1 className="text-5xl md:text-7xl font-serif text-brand-deep-navy tracking-tight mb-8">
          A VISION FOR BETTER SPACES.
        </h1>
        <p className="text-xl text-brand-charcoal/70 font-light max-w-3xl mx-auto leading-relaxed">
          KHU Estate connects people with thoughtfully selected real estate opportunities while keeping the property journey clear, transparent, and personal.
        </p>
      </div>

      <div className="w-full h-[60vh] relative mb-32 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Architecture" 
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[15s]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div>
            <h2 className="text-3xl font-serif text-brand-deep-navy mb-6">DEVELOPER IDENTITY</h2>
            <div className="w-12 h-px bg-brand-architectural-blue mb-8"></div>
            <p className="text-brand-charcoal font-light leading-relaxed mb-6">
              K.H.U. Developers Private Limited was established with a singular focus: to create well-planned, accessible, and transparent property investments.
            </p>
            <p className="text-brand-charcoal font-light leading-relaxed">
              We focus on land development, residential enclaves, and commercial spaces that provide true long-term value for our clients.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-serif text-brand-deep-navy mb-6">OUR PHILOSOPHY</h2>
            <div className="w-12 h-px bg-brand-architectural-blue mb-8"></div>
            <p className="text-brand-charcoal font-light leading-relaxed mb-6">
              Real estate shouldn't be complicated. We believe in providing clear information, supported by detailed planning, and backed by long-term relationships.
            </p>
            <ul className="space-y-4 font-light text-brand-charcoal">
              <li className="flex items-center"><span className="w-1.5 h-1.5 bg-brand-architectural-blue rounded-full mr-4"></span> Clear Property Information</li>
              <li className="flex items-center"><span className="w-1.5 h-1.5 bg-brand-architectural-blue rounded-full mr-4"></span> Long-Term Value Creation</li>
              <li className="flex items-center"><span className="w-1.5 h-1.5 bg-brand-architectural-blue rounded-full mr-4"></span> Dedicated Client Support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
