import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { projects } from '../data/projects';

const locations = ['All', 'Robertsganj', 'Ghorawal', 'Salkhan Varanasi Road'];

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

export default function Projects() {
  const [activeLocation, setActiveLocation] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Derived / Filtered data
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchLocation = activeLocation === 'All' || p.location === activeLocation;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLocation && matchSearch;
    });
  }, [activeLocation, searchQuery]);

  const projectsByLocation = useMemo(() => {
    const grouped: Record<string, typeof projects> = {};
    projects.forEach(p => {
      if (!grouped[p.location]) grouped[p.location] = [];
      grouped[p.location].push(p);
    });
    return grouped;
  }, []);

  const featuredProject = projects.find(p => p.id === 'happy-home') || projects[0];

  return (
    <div className="w-full bg-brand-warm-white text-brand-charcoal min-h-screen overflow-hidden font-sans">
      
      {/* 01. PROJECTS HERO */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-brand-deep-navy text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/projects/projects_hero_1790312969807.jpg" 
            alt="KHU Developers Projects Hero" 
            className="w-full h-full object-cover opacity-40 scale-105 transform-gpu"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-deep-navy/80 via-transparent to-brand-deep-navy/90" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-start mt-20">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl"
          >
            <motion.p variants={fadeIn} className="text-brand-gold text-xs md:text-sm tracking-[0.2em] uppercase font-bold mb-6">
              OUR PROJECTS
            </motion.p>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight mb-8">
              Places to Begin.<br />
              <span className="text-brand-warm-white/90">Spaces to Belong.</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-white/80 text-lg md:text-xl font-light leading-relaxed max-w-2xl border-l-2 border-brand-gold pl-6">
              Explore the developments and locations associated with K.H.U Developers.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 02. LOCATION FILTER & SEARCH */}
      <section className="sticky top-[60px] z-40 bg-brand-warm-white/90 backdrop-blur-md border-b border-brand-charcoal/10 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setActiveLocation(loc)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                  activeLocation === loc 
                    ? 'bg-brand-deep-navy text-white shadow-md' 
                    : 'bg-white text-brand-charcoal hover:bg-brand-architectural-blue/10 hover:text-brand-architectural-blue'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-brand-charcoal/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-architectural-blue transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={16} />
          </div>
        </div>
      </section>

      {/* 03. PROJECT SHOWCASE (Grid) */}
      <section className="py-24 md:py-32 bg-brand-warm-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  key={project.id}
                  className="group relative flex flex-col cursor-pointer"
                >
                  <Link to={`/projects/${project.id}`} className="block w-full h-full">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-brand-soft-grey mb-6">
                      <img 
                        src={project.coverImage} 
                        alt={`${project.name} real estate development in ${project.location}`} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-brand-deep-navy/0 group-hover:bg-brand-deep-navy/20 transition-colors duration-500" />
                      
                      {/* Hover Overlay Elements */}
                      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                        <span className="bg-brand-gold text-brand-deep-navy text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-lg">
                          {project.location}
                        </span>
                      </div>
                      
                      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                        <span className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-brand-deep-navy text-xs font-bold uppercase tracking-widest px-4 py-2 shadow-lg">
                          Explore <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col transform transition-transform duration-500 group-hover:-translate-y-2">
                      <h3 className="text-2xl font-serif text-brand-deep-navy mb-2">{project.name}</h3>
                      <p className="text-sm font-medium text-brand-architectural-blue tracking-wide flex items-center gap-1.5">
                        <MapPin size={14} /> {project.location}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredProjects.length === 0 && (
              <div className="col-span-full py-24 text-center">
                <p className="text-brand-charcoal/50 text-lg font-light">No projects found matching your criteria.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 12. PROJECT DISCOVERY HOOK */}
      <section className="py-24 bg-brand-architectural-blue text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_100%)] mix-blend-overlay" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-serif mb-6 leading-tight"
          >
            One Developer.<br />
            <span className="text-brand-gold">Multiple Places to Call Home.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl font-light text-white/80 max-w-2xl mx-auto"
          >
            Explore the different locations represented across the KHU Developers portfolio.
          </motion.p>
        </div>
      </section>

      {/* 04. PROJECT DISCOVERY / HORIZONTAL SCROLL */}
      <section className="py-32 bg-brand-deep-navy text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16">
          <h2 className="text-xs tracking-[0.2em] text-brand-gold uppercase font-bold mb-4">The Journey</h2>
          <h3 className="text-3xl md:text-5xl font-serif">A Portfolio of Possibilities</h3>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto pb-12 px-6 md:px-12 snap-x snap-mandatory scrollbar-hide gap-6 md:gap-8">
          {projects.map((project, i) => (
            <Link 
              to={`/projects/${project.id}`} 
              key={project.id}
              className="relative flex-none w-[85vw] md:w-[400px] aspect-[4/5] snap-center group overflow-hidden"
            >
              <img 
                src={project.coverImage} 
                alt={project.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-deep-navy via-brand-deep-navy/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 w-full transform transition-transform duration-500 group-hover:-translate-y-4">
                <span className="text-brand-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-3 block">
                  {String(i + 1).padStart(2, '0')} / {project.location}
                </span>
                <h4 className="text-2xl font-serif mb-4">{project.name}</h4>
                <div className="w-8 h-[1px] bg-white/50 group-hover:w-16 transition-all duration-500" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 05. WHERE WE ARE (Location Story) */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mb-20 text-center max-w-3xl mx-auto"
          >
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-serif text-brand-deep-navy mb-6">Where We Are</motion.h2>
            <motion.p variants={fadeIn} className="text-lg text-brand-charcoal/70 font-light">
              Strategic locations chosen for growth, connectivity, and community building across Sonbhadra and beyond.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24 relative">
            {/* Desktop Connector Line */}
            <div className="hidden md:block absolute top-8 left-12 right-12 h-[1px] bg-brand-charcoal/10" />
            
            {Object.entries(projectsByLocation).map(([loc, projs], idx) => (
              <motion.div 
                key={loc}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-full bg-brand-warm-white flex items-center justify-center border border-brand-charcoal/10 mb-8 mx-auto md:mx-0 relative z-10">
                  <MapPin className="text-brand-architectural-blue" size={24} />
                </div>
                <h3 className="text-2xl font-serif text-brand-deep-navy mb-2 text-center md:text-left uppercase tracking-tight">{loc}</h3>
                <p className="text-sm font-bold text-brand-architectural-blue tracking-widest uppercase mb-8 text-center md:text-left">
                  {projs.length} {projs.length === 1 ? 'Project' : 'Projects'}
                </p>
                
                <div className="space-y-4">
                  {projs.map(p => (
                    <Link 
                      key={p.id} 
                      to={`/projects/${p.id}`}
                      className="group flex items-center justify-between p-4 bg-brand-warm-white hover:bg-brand-deep-navy hover:text-white transition-colors duration-300 rounded-sm"
                    >
                      <span className="font-medium">{p.name}</span>
                      <ArrowRight size={16} className="text-brand-charcoal/30 group-hover:text-brand-gold transform group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 06. FEATURED PROJECT */}
      {featuredProject && (
        <section className="py-24 md:py-32 bg-brand-warm-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-12 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-brand-charcoal/20" />
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-charcoal/50">Featured Project</h2>
              <div className="h-[1px] flex-1 bg-brand-charcoal/20" />
            </div>

            <div className="relative group overflow-hidden aspect-[4/3] md:aspect-[21/9]">
              <img 
                src={featuredProject.coverImage} 
                alt={`${featuredProject.name} featured development`}
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-deep-navy/90 via-brand-deep-navy/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-2/3">
                <span className="inline-block bg-brand-gold text-brand-deep-navy text-xs font-bold tracking-widest uppercase px-4 py-2 mb-6">
                  {featuredProject.location}
                </span>
                <h3 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
                  {featuredProject.name}
                </h3>
                <Link 
                  to={`/projects/${featuredProject.id}`}
                  className="inline-flex items-center gap-3 bg-white text-brand-deep-navy px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-brand-architectural-blue hover:text-white transition-colors"
                >
                  View Project <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 07. PROJECT SUMMARY STRIP */}
      <section className="py-16 bg-brand-gold text-brand-deep-navy">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-brand-deep-navy/20">
            <div className="py-4 md:py-0 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-7xl font-serif mb-2">{projects.length}</span>
              <span className="text-xs font-bold tracking-widest uppercase">Projects Listed</span>
            </div>
            <div className="py-4 md:py-0 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-7xl font-serif mb-2">{Object.keys(projectsByLocation).length}</span>
              <span className="text-xs font-bold tracking-widest uppercase">Locations Represented</span>
            </div>
            <div className="py-4 md:py-0 flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-serif mb-4 pt-2">Robertsganj</span>
              <span className="text-xs font-bold tracking-widest uppercase">Primary Listed Location</span>
            </div>
          </div>
        </div>
      </section>

      {/* 08. FINAL CTA */}
      <section className="py-32 bg-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-serif text-brand-deep-navy mb-12">Find Your Place.</h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-8 py-4 bg-brand-deep-navy text-white text-sm tracking-widest uppercase font-bold hover:bg-brand-architectural-blue transition-colors"
              >
                Explore Projects
              </button>
              <Link 
                to="/contact" 
                className="px-8 py-4 border-2 border-brand-charcoal/20 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:border-brand-deep-navy transition-colors"
              >
                Get In Touch
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
