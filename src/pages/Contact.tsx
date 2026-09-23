export default function Contact() {
  return (
    <div className="w-full bg-brand-off-white min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div>
          <h1 className="text-5xl md:text-7xl font-serif text-brand-deep-navy tracking-tight mb-8 leading-tight">
            LET'S TALK <br /> PROPERTY.
          </h1>
          <p className="text-xl text-brand-charcoal/70 font-light max-w-md leading-relaxed mb-16">
            Whether you're looking for a residential plot or a commercial investment, we are here to provide clear and actionable guidance.
          </p>

          <div className="space-y-8">
            <div>
              <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-2 block">
                Office
              </span>
              <p className="text-brand-deep-navy text-lg">Robertsganj, Sonbhadra<br />Uttar Pradesh</p>
            </div>
            <div>
              <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-2 block">
                Contact
              </span>
              <p className="text-brand-deep-navy text-lg">Call or WhatsApp<br />Email Enquiries</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 border border-brand-soft-grey shadow-sm">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Name</label>
              <input type="text" className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors" placeholder="Your full name" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Phone</label>
                <input type="tel" className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors" placeholder="Your phone number" />
              </div>
              <div className="space-y-2">
                <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Email</label>
                <input type="email" className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors" placeholder="Your email address" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Property / Project</label>
              <select className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors appearance-none">
                <option value="">Select a project of interest</option>
                <option value="maa-kundwasini-nagar">Maa Kundwasini Nagar</option>
                <option value="general">General Enquiry</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Message</label>
              <textarea rows={4} className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors resize-none" placeholder="How can we help you?"></textarea>
            </div>
            
            <button className="w-full mt-8 px-8 py-4 bg-brand-deep-navy text-white text-sm tracking-widest uppercase font-medium hover:bg-brand-architectural-blue transition-colors">
              Send Enquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
