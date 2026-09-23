export default function Services() {
  const services = [
    {
      title: "RESIDENTIAL PROPERTIES",
      desc: "Carefully selected plots and planned developments designed for living and community building.",
      img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      title: "COMMERCIAL PROPERTIES",
      desc: "Strategic spaces positioned for business growth, accessibility, and high footfall potential.",
      img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      title: "PLOT INVESTMENTS",
      desc: "Clear, verified land opportunities for long-term value appreciation and portfolio building.",
      img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      title: "PROPERTY CONSULTATION",
      desc: "Expert guidance to help you navigate property decisions with confidence and clarity.",
      img: "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    }
  ];

  return (
    <div className="w-full bg-brand-off-white min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-20">
        <h1 className="text-5xl md:text-7xl font-serif text-brand-deep-navy tracking-tight mb-6">
          EXPERTISE.
        </h1>
        <div className="w-24 h-px bg-brand-architectural-blue"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-2">
        {services.map((service, index) => (
          <div key={index} className="group relative w-full h-[300px] md:h-[400px] overflow-hidden bg-brand-deep-navy cursor-pointer">
            <div className="absolute inset-0 z-10 bg-brand-deep-navy/80 group-hover:bg-brand-deep-navy/40 transition-colors duration-700" />
            <img 
              src={service.img} 
              alt={service.title}
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 md:px-24">
              <span className="text-brand-architectural-blue text-sm tracking-widest font-bold mb-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                0{index + 1}
              </span>
              <h2 className="text-3xl md:text-5xl font-serif text-white mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                {service.title}
              </h2>
              <p className="text-white/80 font-light max-w-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-150">
                {service.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
