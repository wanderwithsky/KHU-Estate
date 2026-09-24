import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function About() {
  return (
    <div className="w-full min-h-screen bg-brand-warm-white text-brand-charcoal overflow-hidden">
      
      {/* 01. HERO SECTION */}
      <section className="relative w-full h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            src="/images/about/hero_about.jpg" 
            alt="Aerial view of a semi-urban Indian plotted development transitioning into agricultural land" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-deep-navy/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-deep-navy/80 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 md:px-12 pt-20">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl"
          >
            <motion.p variants={fadeIn} className="text-white/80 text-xs md:text-sm tracking-[0.2em] uppercase font-medium mb-6">
              About KHU Estate
            </motion.p>
            <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-[1.1] mb-8">
              Building Spaces.<br />
              Creating Possibilities.
            </motion.h1>
            <motion.p variants={fadeIn} className="text-white/90 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
              KHU Developers is a real-estate company based in Robertsganj, Sonbhadra, Uttar Pradesh, with a focus on creating thoughtfully planned property opportunities and development-led real-estate experiences.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 02. OUR STORY */}
      <section className="py-24 md:py-32 bg-brand-warm-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="w-full lg:w-1/2"
            >
              <motion.p variants={fadeIn} className="text-brand-charcoal/50 text-xs tracking-[0.2em] uppercase font-medium mb-6">
                Our Story
              </motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-serif text-brand-deep-navy leading-[1.2] mb-8">
                Rooted in the Land.<br />
                Designed for What Comes Next.
              </motion.h2>
              <motion.p variants={fadeIn} className="text-brand-charcoal/80 text-lg leading-relaxed mb-6 font-light">
                KHU Developers Private Limited is an Indian real-estate company incorporated in 2019 and based in Robertsganj, Sonbhadra, Uttar Pradesh. Our work is grounded in the real-world relationship between land, people and places — with a focus on creating property opportunities through thoughtful planning and development.
              </motion.p>
              <motion.p variants={fadeIn} className="text-brand-charcoal/80 text-lg leading-relaxed font-light">
                From the character of the land to the needs of the people who will use it, every development begins with understanding the place first.
              </motion.p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="w-full lg:w-1/2"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img 
                  src="/images/about/story_surveyors.jpg" 
                  alt="Indian property professionals surveying a plotted development" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 03. COMPANY FACTS */}
      <section className="py-16 bg-white border-y border-brand-charcoal/10">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-brand-charcoal/10"
          >
            {[
              { title: 'Founded', value: '2019' },
              { title: 'Sonbhadra, UP', value: 'Robertsganj' },
              { title: 'CIN', value: 'U70100UP2019PTC119392' },
              { title: 'Company Type', value: 'Private Limited' },
              { title: 'Current Status', value: 'Active' },
            ].map((fact, index) => (
              <motion.div key={index} variants={fadeIn} className="pt-6 md:pt-0 md:px-6 flex flex-col justify-center text-center">
                <h3 className="text-xl md:text-2xl font-serif text-brand-deep-navy mb-2">{fact.value}</h3>
                <p className="text-xs tracking-wider uppercase text-brand-charcoal/50 font-medium">{fact.title}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 04. WHAT WE DO */}
      <section className="py-24 md:py-32 bg-brand-warm-white">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-3xl mb-16 md:mb-24"
          >
            <motion.p variants={fadeIn} className="text-brand-charcoal/50 text-xs tracking-[0.2em] uppercase font-medium mb-6">
              What We Do
            </motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-serif text-brand-deep-navy leading-[1.2]">
              From Land to Opportunity
            </motion.h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16"
          >
            {[
              { num: '01', title: 'Land & Property', desc: 'Creating opportunities around land and property with a focus on location, usability and long-term potential.' },
              { num: '02', title: 'Planned Development', desc: 'Approaching plotted development with attention to layout, access, surroundings and practical planning.' },
              { num: '03', title: 'Real Estate Opportunities', desc: 'Connecting people with property opportunities across emerging and developing environments.' }
            ].map((block, index) => (
              <motion.div key={index} variants={fadeIn} className="flex flex-col">
                <span className="text-sm font-serif text-brand-architectural-blue mb-4 border-b border-brand-charcoal/10 pb-4">{block.num}</span>
                <h3 className="text-xl font-medium text-brand-deep-navy mb-4">{block.title}</h3>
                <p className="text-brand-charcoal/70 font-light leading-relaxed">{block.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 05. EDITORIAL IMAGE GRID */}
      <section className="pb-24 md:pb-32 bg-brand-warm-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="aspect-[4/5] lg:col-span-1 overflow-hidden"
            >
              <img src="/images/about/grid_aerial.jpg" alt="Aerial plotted land with agricultural surroundings" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="aspect-[4/5] lg:col-span-1 overflow-hidden"
            >
              <img src="/images/about/grid_family.jpg" alt="Indian family viewing a plot with a real-estate professional" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="aspect-[4/5] lg:col-span-1 overflow-hidden md:col-span-2 lg:col-span-1"
            >
              <img src="/images/about/grid_development.jpg" alt="Indian low-rise residential development with landscaped road" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="aspect-[4/5] lg:col-span-2 lg:aspect-[16/9] overflow-hidden"
            >
              <img src="/images/about/grid_surveyor_golden.jpg" alt="Surveyor standing on a plotted site during golden hour" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="aspect-[4/5] lg:col-span-1 overflow-hidden"
            >
              <img src="/images/about/grid_modern_home.jpg" alt="Modern Indian home emerging within a semi-urban landscape" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 06. OUR APPROACH */}
      <section className="py-24 md:py-32 bg-brand-deep-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/images/about/grid_aerial.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col lg:flex-row gap-16 lg:gap-24"
          >
            <div className="w-full lg:w-1/2">
              <motion.p variants={fadeIn} className="text-white/50 text-xs tracking-[0.2em] uppercase font-medium mb-6">
                Our Approach
              </motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-serif leading-[1.2]">
                Understand the Land.<br />
                Respect the Place.<br />
                Plan for the Future.
              </motion.h2>
            </div>
            
            <div className="w-full lg:w-1/2 flex flex-col gap-12">
              {[
                { title: 'Location', desc: 'Every property begins with understanding where it sits and how people connect to it.' },
                { title: 'Planning', desc: 'Thoughtful planning transforms land into a more usable and meaningful environment.' },
                { title: 'Long-Term Thinking', desc: 'Real estate is more than a transaction. It is about creating places that remain relevant over time.' }
              ].map((principle, index) => (
                <motion.div key={index} variants={fadeIn} className="border-t border-white/10 pt-6">
                  <h3 className="text-sm tracking-[0.15em] uppercase text-brand-soft-grey mb-3 font-medium">{principle.title}</h3>
                  <p className="text-white/70 font-light leading-relaxed text-lg">{principle.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 07. WHY KHU ESTATE */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-3xl mb-16"
          >
            <motion.p variants={fadeIn} className="text-brand-charcoal/50 text-xs tracking-[0.2em] uppercase font-medium mb-6">
              Why KHU Estate
            </motion.p>
            <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-serif text-brand-deep-navy leading-[1.2]">
              A Local Perspective on Real Estate.
            </motion.h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12"
          >
            {[
              { num: '01', title: 'Local Understanding', desc: 'Deep roots in the communities and landscapes we operate within.' },
              { num: '02', title: 'Thoughtful Planning', desc: 'Approaching every parcel of land with care and long-term vision.' },
              { num: '03', title: 'Transparent Communication', desc: 'Clear, straightforward engagement at every step of the property journey.' },
              { num: '04', title: 'Long-Term Perspective', desc: 'Creating value that extends far beyond the initial development phase.' }
            ].map((item, index) => (
              <motion.div key={index} variants={fadeIn} className="flex flex-col group">
                <div className="text-3xl font-serif text-brand-charcoal/20 mb-4 group-hover:text-brand-architectural-blue transition-colors duration-500">{item.num}</div>
                <h3 className="text-lg font-medium text-brand-deep-navy mb-3">{item.title}</h3>
                <p className="text-brand-charcoal/70 font-light leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 08. HUMAN ELEMENT */}
      <section className="py-24 md:py-32 bg-brand-warm-white overflow-hidden">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col-reverse lg:flex-row gap-16 lg:gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="w-full lg:w-7/12"
            >
              <div className="aspect-[16/9] lg:aspect-[4/3] overflow-hidden">
                <img 
                  src="/images/about/human_element_family.jpg" 
                  alt="A realistic Indian family walking through a plotted development with a property professional" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                />
              </div>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="w-full lg:w-5/12"
            >
              <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-serif text-brand-deep-navy leading-[1.2] mb-8">
                Real Estate Is Ultimately About People.
              </motion.h2>
              <motion.p variants={fadeIn} className="text-brand-charcoal/80 text-lg leading-relaxed font-light">
                Every plot, property and development exists for the people who will build, live, work or grow around it.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 09. FINAL CTA */}
      <section className="py-24 md:py-32 bg-brand-deep-navy text-white text-center">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto flex flex-col items-center"
          >
            <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-serif leading-[1.2] mb-6">
              Let's Build What Comes Next.
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/70 font-light text-lg mb-10">
              Explore our projects or speak with the KHU Estate team to learn more.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
              <Link to="/projects" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-white text-sm tracking-widest uppercase font-medium hover:bg-white hover:text-brand-deep-navy transition-colors">
                View Projects
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/contact" className="group inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 text-white text-sm tracking-widest uppercase font-medium hover:bg-white/10 transition-colors">
                Get in Touch
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
