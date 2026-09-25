import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const servicesList = [
  { id: 'service-01', number: '01', title: 'Property', fullName: 'Property & Plot Discovery' },
  { id: 'service-02', number: '02', title: 'Location', fullName: 'Location & Site Experience' },
  { id: 'service-03', number: '03', title: 'Site Visits', fullName: 'See the Property for Yourself' },
  { id: 'service-04', number: '04', title: 'Guidance', fullName: 'Property Guidance' },
  { id: 'service-05', number: '05', title: 'Planning', fullName: 'Development & Planning' },
  { id: 'service-06', number: '06', title: 'Connect', fullName: 'Connecting People with Opportunity' },
];

export default function Services() {
  const [activeSection, setActiveSection] = useState('service-01');

  useEffect(() => {
    const handleScroll = () => {
      const sections = servicesList.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(servicesList[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full bg-brand-warm-white text-brand-charcoal min-h-screen font-sans overflow-hidden">
      
      {/* Sticky Service Navigation */}
      <div className="hidden lg:block fixed left-12 top-1/2 -translate-y-1/2 z-50">
        <div className="flex flex-col gap-6">
          {servicesList.map((service) => (
            <button 
              key={service.id}
              onClick={() => scrollToSection(service.id)}
              className="flex items-center gap-4 group"
            >
              <span className={`text-[10px] font-bold tracking-[0.2em] transition-colors duration-300 ${
                activeSection === service.id ? 'text-brand-gold' : 'text-brand-charcoal/30 group-hover:text-brand-charcoal/50'
              }`}>
                {service.number}
              </span>
              <span className={`text-xs uppercase tracking-widest transition-all duration-300 origin-left ${
                activeSection === service.id 
                  ? 'text-brand-deep-navy opacity-100 scale-100' 
                  : 'text-brand-deep-navy opacity-0 scale-90 group-hover:opacity-40'
              }`}>
                {service.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Service Navigation */}
      <div className="lg:hidden sticky top-[60px] z-50 bg-white/90 backdrop-blur-md border-b border-brand-charcoal/10 overflow-x-auto scrollbar-hide py-3 px-6">
        <div className="flex gap-6">
          {servicesList.map((service) => (
            <button 
              key={service.id}
              onClick={() => scrollToSection(service.id)}
              className={`flex-none text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${
                activeSection === service.id ? 'text-brand-deep-navy border-b-2 border-brand-gold pb-1' : 'text-brand-charcoal/50'
              }`}
            >
              {service.number} {service.title}
            </button>
          ))}
        </div>
      </div>

      {/* 01. SERVICES HERO */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-brand-deep-navy text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/services/services_hero_1790313568637.jpg" 
            alt="KHU Developers Services Hero" 
            className="w-full h-full object-cover opacity-50 scale-105 transform-gpu"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-deep-navy via-brand-deep-navy/40 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12 flex flex-col items-start mt-20">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl"
          >
            <motion.p variants={fadeIn} className="text-brand-gold text-xs md:text-sm tracking-[0.2em] uppercase font-bold mb-6">
              WHAT WE DO
            </motion.p>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight mb-8">
              More Than Property.<br />
              <span className="text-brand-warm-white/90">A Better Way to Find Your Place.</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-white/80 text-lg md:text-xl font-light leading-relaxed max-w-2xl border-l-2 border-brand-gold pl-6">
              From discovering the right opportunity to understanding the place around it, KHU Developers brings a more thoughtful approach to real estate.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 02. SERVICE STORY INTRO */}
      <section className="py-24 md:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center"
          >
            <div>
              <motion.span variants={fadeIn} className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-6 block">
                OUR APPROACH
              </motion.span>
              <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy leading-tight mb-8">
                From Land to Opportunity
              </motion.h2>
              <motion.p variants={fadeIn} className="text-brand-charcoal/70 text-lg md:text-xl leading-relaxed font-light">
                Real estate is not only about a piece of land. It is about location, planning, access, people and the possibilities that come with a well-considered property decision.
              </motion.p>
            </div>
            <motion.div variants={fadeIn} className="relative aspect-[4/5] md:aspect-square overflow-hidden bg-brand-soft-grey">
              <img 
                src="/images/services/proj2_nature_city_1790312995384.jpg" 
                alt="From Land to Opportunity" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 03. SERVICES LIST (Alternating layout) */}
      <div className="bg-brand-warm-white">
        
        {/* SERVICE 01 */}
        <section id="service-01" className="py-24 md:py-40 relative">
          <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="lg:col-span-7 relative aspect-[4/5] lg:aspect-[4/3] overflow-hidden group"
              >
                <img src="/images/services/service_01_1790313580623.jpg" alt="Find the Right Property Opportunity" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
                <div className="absolute top-6 left-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-brand-deep-navy shadow-sm w-fit">LOCATION</span>
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-brand-deep-navy shadow-sm w-fit">PROPERTY</span>
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-brand-deep-navy shadow-sm w-fit">OPPORTUNITY</span>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5 flex flex-col"
              >
                <span className="text-4xl md:text-6xl font-serif text-brand-gold/30 mb-4 block">01</span>
                <h3 className="text-3xl md:text-5xl font-serif text-brand-deep-navy mb-6 leading-tight">Find the Right Property Opportunity</h3>
                <p className="text-lg text-brand-charcoal/70 font-light leading-relaxed mb-10">
                  Explore plotted and property opportunities across the locations represented by KHU Developers.
                </p>
                <Link to="/projects" className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue transition-colors self-start">
                  <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">EXPLORE PROJECTS</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SERVICE 02 */}
        <section id="service-02" className="py-24 md:py-40 relative bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5 flex flex-col order-2 lg:order-1"
              >
                <span className="text-4xl md:text-6xl font-serif text-brand-gold/30 mb-4 block">02</span>
                <h3 className="text-3xl md:text-5xl font-serif text-brand-deep-navy mb-6 leading-tight">Understand the Place Before You Decide</h3>
                <p className="text-lg text-brand-charcoal/70 font-light leading-relaxed mb-10">
                  Location shapes the experience of a property. Explore the surroundings, access, development context and character of each location.
                </p>
                <Link to="/projects" className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue transition-colors self-start">
                  <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">EXPLORE LOCATIONS</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="lg:col-span-7 relative aspect-[4/5] lg:aspect-[4/3] overflow-hidden group order-1 lg:order-2"
              >
                <img src="/images/services/service_02_1790313594571.jpg" alt="Understand the Place Before You Decide" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
                <motion.div 
                  initial={{ width: 0 }} whileInView={{ width: '40%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.5 }}
                  className="absolute bottom-1/4 left-1/4 h-[2px] bg-brand-gold shadow-[0_0_10px_rgba(201,162,109,0.8)] z-10"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* SERVICE 03 */}
        <section id="service-03" className="py-24 md:py-40 relative">
          <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="lg:col-span-7 relative aspect-[4/5] lg:aspect-[4/3] overflow-hidden group"
              >
                <img src="/images/services/proj4_vikas_nagar_1790313019947.jpg" alt="See the Property for Yourself" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
                <motion.div 
                  initial={{ y: -20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.8 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <MapPin size={48} className="text-brand-gold drop-shadow-xl animate-bounce" />
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5 flex flex-col"
              >
                <span className="text-4xl md:text-6xl font-serif text-brand-gold/30 mb-4 block">03</span>
                <h3 className="text-3xl md:text-5xl font-serif text-brand-deep-navy mb-6 leading-tight">See the Property for Yourself</h3>
                <p className="text-lg text-brand-charcoal/70 font-light leading-relaxed mb-10">
                  A real place is best understood in person. Make site visits and experience the location beyond the screen.
                </p>
                <Link to="/contact" className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue transition-colors self-start">
                  <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">PLAN A VISIT</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SERVICE 04 */}
        <section id="service-04" className="py-24 md:py-40 relative bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5 flex flex-col order-2 lg:order-1"
              >
                <span className="text-4xl md:text-6xl font-serif text-brand-gold/30 mb-4 block">04</span>
                <h3 className="text-3xl md:text-5xl font-serif text-brand-deep-navy mb-6 leading-tight">Make Your Property Journey Clearer</h3>
                <p className="text-lg text-brand-charcoal/70 font-light leading-relaxed mb-10">
                  From understanding the property opportunity to navigating the next steps, our approach is centered around clear communication and informed decisions.
                </p>
                <Link to="/contact" className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue transition-colors self-start">
                  <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">GET IN TOUCH</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="lg:col-span-7 relative aspect-[4/5] lg:aspect-[4/3] overflow-hidden group order-1 lg:order-2"
              >
                <img src="/images/services/proj5_kailashpuri_1790313033333.jpg" alt="Make Your Property Journey Clearer" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* SERVICE 05 */}
        <section id="service-05" className="py-24 md:py-40 relative">
          <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="lg:col-span-7 relative aspect-[4/5] lg:aspect-[4/3] overflow-hidden group"
              >
                <img src="/images/services/proj8_maa_kundvasini_1790313095169.jpg" alt="Thoughtful Planning. Real Places." className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
                <motion.div 
                  initial={{ height: 0 }} whileInView={{ height: '60%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.5 }}
                  className="absolute bottom-1/4 right-1/4 w-[2px] bg-brand-gold/80 z-10"
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5 flex flex-col"
              >
                <span className="text-4xl md:text-6xl font-serif text-brand-gold/30 mb-4 block">05</span>
                <h3 className="text-3xl md:text-5xl font-serif text-brand-deep-navy mb-6 leading-tight">Thoughtful Planning. Real Places.</h3>
                <p className="text-lg text-brand-charcoal/70 font-light leading-relaxed mb-10">
                  Plotted development becomes more meaningful when land, access, surroundings and usability are considered together.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SERVICE 06 */}
        <section id="service-06" className="py-24 md:py-40 relative bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5 flex flex-col order-2 lg:order-1"
              >
                <span className="text-4xl md:text-6xl font-serif text-brand-gold/30 mb-4 block">06</span>
                <h3 className="text-3xl md:text-5xl font-serif text-brand-deep-navy mb-6 leading-tight">A More Human Real Estate Experience</h3>
                <p className="text-lg text-brand-charcoal/70 font-light leading-relaxed mb-10">
                  Whether you're exploring your first plot or looking for the next opportunity, the journey should feel clear, personal and connected to the place itself.
                </p>
                <Link to="/contact" className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue transition-colors self-start">
                  <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">TALK TO US</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="lg:col-span-7 relative aspect-[4/5] lg:aspect-[4/3] overflow-hidden group order-1 lg:order-2"
              >
                <img src="/images/services/proj3_laxmi_nagar_1790313007853.jpg" alt="A More Human Real Estate Experience" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
              </motion.div>
            </div>
          </div>
        </section>

      </div>

      {/* 18. PREMIUM "AT A GLANCE" SECTION */}
      <section className="py-32 bg-brand-soft-grey overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12 text-center md:text-left">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy mb-16 md:mb-24"
          >
            One Journey.<br />
            Multiple Touchpoints.
          </motion.h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-brand-charcoal/20 -translate-y-1/2 z-0" />
            
            {['Discover', 'Explore', 'Visit', 'Understand', 'Connect'].map((step, idx) => (
              <motion.div 
                key={step}
                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.15, duration: 0.5 }}
                className="relative z-10 flex flex-col items-center gap-4 bg-brand-soft-grey p-4"
              >
                <div className="w-4 h-4 rounded-full bg-brand-deep-navy border-4 border-brand-soft-grey outline outline-1 outline-brand-deep-navy/30" />
                <span className="text-sm font-bold tracking-widest uppercase text-brand-deep-navy">{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 19. WHY OUR APPROACH */}
      <section className="py-32 bg-brand-deep-navy text-white">
        <div className="max-w-7xl mx-auto px-6 lg:pl-48 lg:pr-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-gold mb-20"
          >
            Real Estate Deserves More Thought.
          </motion.h2>

          <div className="flex flex-col gap-12 lg:gap-16">
            {[
              { title: 'Location', desc: 'Sourcing opportunities where growth and connectivity intersect.' },
              { title: 'Planning', desc: 'Creating plotted layouts designed for real, usable community living.' },
              { title: 'Clarity', desc: 'Providing transparent information throughout the property journey.' },
              { title: 'Connection', desc: 'Building relationships that last long after the site visit is over.' }
            ].map((principle, idx) => (
              <motion.div 
                key={principle.title}
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="flex flex-col md:flex-row md:items-end gap-4 md:gap-12 border-b border-white/10 pb-8 group"
              >
                <h3 className="text-3xl md:text-5xl font-serif w-full md:w-1/3 group-hover:text-brand-gold transition-colors">{principle.title}</h3>
                <p className="text-lg md:text-xl font-light text-white/70 w-full md:w-2/3 pb-1 md:pb-2">{principle.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 20. FINAL CTA */}
      <section className="relative py-32 md:py-48 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/services/projects_hero_1790312969807.jpg" 
            alt="Ready to Explore What's Possible?" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-brand-deep-navy/70" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-white">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-5xl md:text-7xl font-serif mb-8 leading-tight"
          >
            Ready to Explore What's Possible?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl font-light text-white/80 mb-12"
          >
            Explore our projects or speak with the KHU Developers team.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <Link 
              to="/projects" 
              className="px-8 py-4 bg-white text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:bg-brand-architectural-blue hover:text-white transition-colors"
            >
              EXPLORE PROJECTS &rarr;
            </Link>
            <Link 
              to="/contact" 
              className="px-8 py-4 border border-white text-white text-sm tracking-widest uppercase font-bold hover:bg-white/10 transition-colors"
            >
              GET IN TOUCH &rarr;
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
