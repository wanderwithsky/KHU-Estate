import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { projects } from '../data/projects';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function Projects() {
  return (
    <div className="w-full bg-brand-warm-white text-brand-charcoal min-h-screen overflow-hidden">
      
      {/* 01. HEADER SECTION */}
      <section className="pt-40 pb-16 md:pt-48 md:pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl"
        >
          <motion.p variants={fadeIn} className="text-brand-charcoal/50 text-xs md:text-sm tracking-[0.2em] uppercase font-medium mb-6">
            Portfolio
          </motion.p>
          <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-serif text-brand-deep-navy leading-[1.1] tracking-tight mb-8">
            Select Plotted <br />
            Developments.
          </motion.h1>
          <motion.p variants={fadeIn} className="text-brand-charcoal/80 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Discover our meticulously planned residential and commercial plot developments across Robertsganj, Ghorawal, and Sonbhadra.
          </motion.p>
        </motion.div>
      </section>

      {/* 02. PROMO BANNER */}
      <section className="bg-brand-architectural-blue text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between border-y border-white/20 py-8">
            <div className="w-full md:w-2/3">
              <h2 className="text-2xl md:text-3xl font-serif mb-3">Special Offer for Government & Industrial Employees</h2>
              <p className="text-white/80 font-light text-lg">
                Exclusive discounts and easy monthly EMIs available on all residential plots. Immediate registry and possession.
              </p>
            </div>
            <div className="w-full md:w-1/3 flex md:justify-end">
              <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-architectural-blue text-sm tracking-widest uppercase font-medium hover:bg-brand-deep-navy hover:text-white transition-colors">
                Enquire Now
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 03. PROJECTS LIST */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-32">
          {projects.map((project, index) => (
            <motion.div 
              key={project.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className={`grid grid-cols-1 xl:grid-cols-12 gap-12 lg:gap-20 items-center`}
            >
              <motion.div 
                variants={fadeIn}
                className={`w-full xl:col-span-7 relative aspect-[4/3] md:aspect-[16/9] xl:aspect-[4/3] overflow-hidden ${index % 2 !== 0 ? 'xl:order-2' : ''}`}
              >
                <img 
                  src={project.coverImage} 
                  alt={project.name} 
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[1.5s] ease-out"
                />
                
                {/* Special Offer Badge if available */}
                {project.offer && (
                  <div className="absolute top-6 right-6 bg-brand-deep-navy text-white px-4 py-2 text-xs tracking-widest uppercase font-bold shadow-xl">
                    {project.offer.details}
                  </div>
                )}
              </motion.div>
              
              <motion.div 
                variants={fadeIn}
                className={`w-full xl:col-span-5 flex flex-col ${index % 2 !== 0 ? 'xl:order-1' : ''}`}
              >
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-charcoal/10">
                  <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold">
                    {project.type}
                  </span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-serif text-brand-deep-navy mb-6 leading-tight">
                  {project.name}
                </h2>
                
                <div className="flex items-start gap-2 mb-8 text-brand-charcoal/70">
                  <MapPin size={18} className="mt-1 flex-shrink-0" />
                  <p className="text-sm tracking-wide font-medium leading-relaxed">
                    {project.location}
                  </p>
                </div>
                
                <p className="text-lg text-brand-charcoal/80 font-light leading-relaxed mb-10">
                  {project.description}
                </p>

                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && (
                  <div className="mb-12">
                    <p className="text-xs tracking-[0.15em] uppercase text-brand-charcoal/50 font-bold mb-4">Key Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {project.amenities.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="text-xs font-medium px-3 py-1.5 bg-white border border-brand-charcoal/10 text-brand-charcoal/80">
                          {amenity}
                        </span>
                      ))}
                      {project.amenities.length > 4 && (
                        <span className="text-xs font-medium px-3 py-1.5 bg-brand-charcoal/5 text-brand-charcoal/80">
                          +{project.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Link 
                  to={`/projects/${project.id}`} 
                  className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-medium hover:text-brand-architectural-blue transition-colors self-start"
                >
                  <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">
                    Explore Project
                  </span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 04. BOTTOM CTA */}
      <section className="py-24 bg-white text-center border-t border-brand-charcoal/10">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-serif text-brand-deep-navy mb-6">Ready to Invest?</h2>
          <p className="text-brand-charcoal/70 font-light text-lg mb-10">
            Contact us today for site visits, EMI details, and immediate registry options across all our Sonbhadra locations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="px-8 py-4 bg-brand-deep-navy text-white text-sm tracking-widest uppercase font-medium hover:bg-brand-architectural-blue transition-colors">
              Contact Sales Team
            </Link>
            <a href="tel:+919580333973" className="px-8 py-4 border border-brand-charcoal/20 text-brand-deep-navy text-sm tracking-widest uppercase font-medium hover:bg-brand-charcoal/5 transition-colors">
              Call +91 95803 33973
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
