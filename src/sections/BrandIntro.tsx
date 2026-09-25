export default function BrandIntro() {
  return (
    <section className="py-32 px-6 lg:px-12 max-w-7xl mx-auto bg-brand-off-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div>
          <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-6 block">
            KHU DEVELOPERS
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-brand-deep-navy leading-tight mb-8">
            Property should be more than an address. It should be a decision you feel confident about.
          </h2>
          <p className="text-brand-charcoal/70 text-lg leading-relaxed max-w-lg font-light">
            KHU Developers connects people with thoughtfully selected real estate opportunities while keeping the property journey clear, transparent, and personal.
          </p>
        </div>
        <div className="relative h-[600px] w-full bg-brand-soft-grey overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
            alt="Architectural Details" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
