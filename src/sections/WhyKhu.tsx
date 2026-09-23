export default function WhyKhu() {
  const reasons = [
    {
      number: "01",
      title: "LOCAL KNOWLEDGE",
      desc: "Deep understanding of the region's property landscape, ensuring informed decisions.",
    },
    {
      number: "02",
      title: "CLEAR PROPERTY INFORMATION",
      desc: "Transparent details on dimensions, pricing, and project infrastructure from the start.",
    },
    {
      number: "03",
      title: "PERSONAL GUIDANCE",
      desc: "A consultative approach tailored to your specific investment or residential goals.",
    },
    {
      number: "04",
      title: "LONG-TERM RELATIONSHIPS",
      desc: "We build enduring partnerships that extend far beyond a single property transaction.",
    }
  ];

  return (
    <section className="py-32 bg-brand-deep-navy text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-24">
          <h2 className="text-4xl md:text-5xl font-serif tracking-tight mb-6">THE KHU APPROACH.</h2>
          <div className="w-24 h-px bg-brand-architectural-blue"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {reasons.map((reason) => (
            <div key={reason.number} className="group cursor-pointer">
              <span className="text-brand-architectural-blue text-sm tracking-widest font-bold mb-8 block">
                {reason.number}
              </span>
              <h3 className="text-xl font-medium tracking-wide mb-6 group-hover:text-brand-light-blue transition-colors">
                {reason.title}
              </h3>
              <p className="text-brand-soft-grey font-light text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0 transform">
                {reason.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
