import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 1 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const textReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8 }
  }
};

export default function Hero() {
  return (
    <>
      <section className="relative w-full h-[100svh] min-h-[700px] flex items-center overflow-hidden bg-brand-charcoal">
        {/* Background Image with Parallax / Zoom Effect */}
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            src="/images/home_hero.jpg" 
            alt="Indian plotted development in Uttar Pradesh with family" 
            className="w-full h-full object-cover object-[70%_50%] md:object-center"
          />
          {/* Gradient overlay: Darker on left, lighter on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-deep-navy/95 via-brand-deep-navy/70 to-transparent md:to-brand-deep-navy/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-deep-navy/80 via-transparent to-transparent md:opacity-0" />
        </div>
        
        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-32 flex flex-col md:flex-row items-center justify-between h-full">
          
          {/* Left Text Column */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full md:w-[55%] flex flex-col justify-center h-full pt-12 md:pt-0"
          >
            {/* Eyebrow */}
            <motion.p 
              variants={fadeUp} 
              className="text-brand-architectural-blue/90 text-[10px] md:text-xs tracking-[0.25em] font-bold uppercase mb-6 flex items-center gap-2 flex-wrap"
            >
              <span>Premium Plots</span>
              <span className="text-white/30">|</span>
              <span>Trusted Developer</span>
              <span className="text-white/30 hidden sm:inline">|</span>
              <span className="hidden sm:inline">Multiple Locations</span>
            </motion.p>
            
            {/* Headline */}
            <div className="mb-6 flex flex-col">
              <motion.h1 
                variants={textReveal} 
                className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif text-white leading-[1.1] mb-1"
              >
                Apna Plot
              </motion.h1>
              <motion.h1 
                variants={textReveal} 
                className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif text-brand-gold text-[#d4af37] leading-[1.1]"
              >
                Apna Future
              </motion.h1>
            </div>
            
            {/* Supporting Text */}
            <motion.p 
              variants={fadeUp} 
              className="text-white/80 text-lg md:text-xl lg:text-2xl font-light tracking-wide max-w-xl mb-12 leading-relaxed"
            >
              KHU Developer ke saath, sirf zameen nahi... <br className="hidden md:block" />
              ek behtar kal ki neev rakhiye.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/projects" 
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#d4af37] text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:bg-white transition-colors duration-300"
              >
                Explore Our Projects
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/contact" 
                className="flex items-center justify-center px-8 py-4 border border-white/30 text-white text-sm tracking-widest uppercase font-medium hover:bg-white/10 transition-colors duration-300"
              >
                Get In Touch
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Location Story (Hidden on small screens, shown on md+) */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="hidden md:flex w-full md:w-[35%] flex-col justify-end items-end h-full pb-12"
          >
            <div className="flex flex-col items-end border-r-2 border-[#d4af37]/30 pr-6">
              <motion.span variants={fadeUp} className="text-white/50 text-xs tracking-[0.2em] uppercase font-medium mb-6">
                Active Locations
              </motion.span>
              <div className="flex flex-col gap-4 text-right">
                {['Robertsganj', 'Ghorawal', 'Chopan', 'Salkhan'].map((loc, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-center justify-end gap-3 group">
                    <span className="text-white/80 text-sm md:text-base font-light tracking-wider group-hover:text-[#d4af37] transition-colors">{loc}</span>
                    <MapPin size={14} className="text-white/30 group-hover:text-[#d4af37] transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
          
        </div>

        {/* Bottom Value Strip */}
        <div className="absolute bottom-0 left-0 w-full bg-brand-deep-navy/90 backdrop-blur-md border-t border-white/10 py-4 md:py-6">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex items-center justify-between overflow-x-auto no-scrollbar gap-8 md:gap-4 whitespace-nowrap"
            >
              {[
                'Legal Documentation',
                'Prime Locations',
                'Transparent Dealings',
                'Thoughtful Planning'
              ].map((feature, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                  <span className="text-white/80 text-xs md:text-sm tracking-[0.15em] uppercase font-medium">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Transition to Projects Section */}
      <section className="bg-brand-warm-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto flex flex-col items-center"
          >
            <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-6 block">
              Our Projects
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy leading-[1.1] mb-8">
              Best Locations.<br />
              Greater Opportunities.
            </h2>
            <p className="text-brand-charcoal/70 text-lg leading-relaxed max-w-xl font-light mb-10">
              Explore meticulously planned plotted developments across Sonbhadra. Designed with clarity, priced honestly, and prepared for your future.
            </p>
            <Link 
              to="/projects" 
              className="group inline-flex items-center justify-center gap-3 border-b border-brand-deep-navy pb-1 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue hover:border-brand-architectural-blue transition-colors duration-300"
            >
              Explore Our Projects
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
