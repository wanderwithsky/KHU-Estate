import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Hero from '../sections/Hero';
import ScrollProgressBar from '../components/ScrollProgressBar';
import { projects } from '../data/projects';
import { ArrowRight, MapPin, ChevronDown, Phone } from 'lucide-react';

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

const faqs = [
  { question: "What is KHU Developers?", answer: "KHU Developers Private Limited is a private limited real-estate company incorporated in 2019 and based in Robertsganj, Sonbhadra, Uttar Pradesh." },
  { question: "Where is KHU Developers based?", answer: "The company is based in Robertsganj, Sonbhadra, Uttar Pradesh." },
  { question: "What does KHU Developers do?", answer: "The company operates in the real-estate sector, including land and property-related development and opportunities." },
  { question: "Where can I explore KHU Developers projects?", answer: "You can explore the projects and locations currently listed on the Projects page." },
  { question: "Can I schedule a site visit?", answer: "Yes. Use the site's contact or visit-request flow to connect with the team." },
  { question: "How can I contact KHU Developers?", answer: "Use the Contact section or Contact page to connect with the team." }
];

export default function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Get featured projects
  const featuredIds = ['happy-home', 'nature-city', 'laxmi-nagar', 'vikas-nagar', 'maa-kundvasini-nagar'];
  const featuredProjects = projects.filter(p => featuredIds.includes(p.id)).slice(0, 4);

  // Get locations
  const locationsMap = projects.reduce((acc, p) => {
    acc[p.location] = (acc[p.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full bg-brand-warm-white text-brand-charcoal overflow-hidden font-sans">
      <ScrollProgressBar />
      
      {/* 01. HERO */}
      <Hero />

      {/* 02. ABOUT KHU DEVELOPERS PREVIEW */}
      <section className="py-24 md:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center"
          >
            <div>
              <motion.span variants={fadeIn} className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-6 block">
                ABOUT KHU DEVELOPERS
              </motion.span>
              <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy leading-tight mb-8">
                Rooted in the Land.<br />Focused on What Comes Next.
              </motion.h2>
              <motion.p variants={fadeIn} className="text-brand-charcoal/70 text-lg md:text-xl leading-relaxed font-light mb-12">
                KHU Developers Private Limited is a real-estate company based in Robertsganj, Sonbhadra, Uttar Pradesh, with a focus on property, land and planned development opportunities.
              </motion.p>
              
              <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-brand-charcoal/10 pt-8 mb-12">
                <div>
                  <span className="block text-2xl font-serif text-brand-deep-navy mb-1">2019</span>
                  <span className="text-[10px] tracking-widest uppercase font-bold text-brand-charcoal/50">Incorporated</span>
                </div>
                <div>
                  <span className="block text-2xl font-serif text-brand-deep-navy mb-1">Robertsganj</span>
                  <span className="text-[10px] tracking-widest uppercase font-bold text-brand-charcoal/50">Sonbhadra, UP</span>
                </div>
                <div>
                  <span className="block text-2xl font-serif text-brand-deep-navy mb-1">Pvt. Ltd.</span>
                  <span className="text-[10px] tracking-widest uppercase font-bold text-brand-charcoal/50">Company</span>
                </div>
                <div>
                  <span className="block text-2xl font-serif text-brand-deep-navy mb-1">ACTIVE</span>
                  <span className="text-[10px] tracking-widest uppercase font-bold text-brand-charcoal/50">Current Status</span>
                </div>
              </motion.div>
              
              <motion.div variants={fadeIn}>
                <Link to="/about" className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue transition-colors">
                  <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">Discover KHU Developers</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
            
            <motion.div variants={fadeIn} className="relative aspect-[4/5] overflow-hidden group shadow-lg">
              <img 
                src="https://res.cloudinary.com/hmjaaen2/image/upload/v1791888225/1a63fa1c-3a0d-497b-9cc3-0cedb6325107.jpg" 
                alt="Active site development and land leveling at KHU Developers project" 
                className="w-full h-full object-cover object-center transition-transform duration-[2s] group-hover:scale-105"
                loading="lazy"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 03. FEATURED PROJECTS PREVIEW */}
      <section className="py-24 md:py-40 bg-brand-warm-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-16">
            <motion.span variants={fadeIn} className="text-xs tracking-[0.2em] text-brand-gold uppercase font-bold mb-4 block">OUR PROJECTS</motion.span>
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy leading-tight mb-6">Places to Begin.<br/>Spaces to Belong.</motion.h2>
            <motion.p variants={fadeIn} className="text-brand-charcoal/70 text-lg font-light max-w-2xl">Explore developments and locations associated with KHU Developers.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 mb-16">
            {featuredProjects.map((project, idx) => {
              // Asymmetric layout logic
              let classes = "lg:col-span-4";
              if (idx === 0) classes = "lg:col-span-8 lg:row-span-2"; // Large main
              if (idx === 3) classes = "lg:col-span-12"; // Horizontal bottom

              return (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`group relative overflow-hidden bg-brand-soft-grey flex flex-col ${classes} ${idx === 3 ? 'aspect-[21/9]' : 'aspect-[4/5]'}`}
                >
                  <img src={project.coverImage} alt={project.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-deep-navy/90 via-brand-deep-navy/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  <div className="relative z-10 flex flex-col h-full justify-end p-8">
                    <div className="transform transition-transform duration-500 group-hover:-translate-y-4">
                      <span className="inline-block bg-brand-gold text-brand-deep-navy text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 mb-4">
                        {project.location}
                      </span>
                      <h3 className={`font-serif text-white mb-2 ${idx === 0 ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'}`}>{project.name}</h3>
                      <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-white/80 text-xs tracking-widest uppercase font-bold hover:text-white transition-colors mt-4 opacity-0 group-hover:opacity-100">
                        Explore Project <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center">
            <Link to="/projects" className="inline-flex items-center gap-3 bg-brand-deep-navy text-white px-8 py-4 text-sm tracking-widest uppercase font-bold hover:bg-brand-architectural-blue transition-colors">
              View All Projects <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 04. WHERE WE ARE / LOCATIONS */}
      <section className="py-24 md:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <motion.span initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-4 block">WHERE WE ARE</motion.span>
          <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy mb-16">Growing Around Places That Matter.</motion.h2>
          
          <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden group mb-16">
            <img src="/images/services/service_02_1790313594571.jpg" alt="Locations" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 transition-all duration-[3s]" />
            <div className="absolute inset-0 bg-brand-deep-navy/10" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                {Object.entries(locationsMap).map(([loc, count], i) => (
                  <motion.div 
                    key={loc}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2, type: "spring" }}
                    className="flex flex-col items-center bg-white/90 backdrop-blur-md p-6 shadow-xl transform transition-transform hover:-translate-y-2"
                  >
                    <MapPin className="text-brand-architectural-blue mb-4" size={24} />
                    <span className="text-lg font-serif text-brand-deep-navy mb-1">{loc}</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-brand-gold">{count} {count===1?'Project':'Projects'}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <Link to="/projects" className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue transition-colors">
            <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">Explore All Locations</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* 05. EMOTIONAL LAND SECTION */}
      <section className="relative py-32 md:py-48 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/services/service_01_1790313580623.jpg" alt="A Plot Is More Than a Piece of Land" className="w-full h-full object-cover opacity-90 scale-105" />
          <div className="absolute inset-0 bg-brand-deep-navy/60" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-white">
          <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-4xl md:text-5xl lg:text-7xl font-serif mb-8 leading-tight">
            A Plot Is More Than a Piece of Land.
          </motion.h2>
          <motion.p initial={{opacity:0, y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.2}} className="text-xl md:text-2xl font-light text-white/90">
            It can be the beginning of a home, a business, a plan or a new chapter.
          </motion.p>
        </div>
      </section>

      {/* 06. SERVICES / OUR APPROACH PREVIEW */}
      <section className="py-24 md:py-40 bg-brand-warm-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-20">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.span variants={fadeIn} className="text-xs tracking-[0.2em] text-brand-gold uppercase font-bold mb-4 block">WHAT WE DO</motion.span>
              <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy leading-tight mb-8">From Land to Opportunity.</motion.h2>
              <motion.div variants={fadeIn}>
                <Link to="/services" className="group inline-flex items-center gap-3 text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:text-brand-architectural-blue transition-colors">
                  <span className="border-b border-brand-deep-navy group-hover:border-brand-architectural-blue pb-1 transition-colors">Explore Our Approach</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div initial={{opacity:0, x:30}} whileInView={{opacity:1, x:0}} viewport={{once:true}} transition={{duration:0.8}} className="relative aspect-[4/3] overflow-hidden group shadow-lg">
              <img 
                src="https://res.cloudinary.com/hmjaaen2/image/upload/v1791888412/07e03829-596e-4f24-929a-953575e4651c.jpg" 
                alt="Infrastructure and paved internal roadway construction at KHU Developers colony" 
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
                loading="lazy"
              />
            </motion.div>
          </div>

          {/* Horizontal Journey */}
          <div className="flex flex-wrap md:flex-nowrap justify-between gap-8 md:gap-4 relative pt-12 border-t border-brand-charcoal/10">
            {['Discover', 'Understand', 'Visit', 'Plan', 'Connect'].map((step, idx) => (
              <motion.div 
                key={step} 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="w-1/2 md:w-auto flex flex-col items-start group cursor-default"
              >
                <span className="text-3xl md:text-4xl font-serif text-brand-charcoal/20 group-hover:text-brand-gold transition-colors duration-500 mb-4">0{idx+1}</span>
                <span className="text-xs font-bold tracking-widest uppercase text-brand-deep-navy">{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 07. WHY KHU DEVELOPERS */}
      <section className="py-24 md:py-40 bg-brand-deep-navy text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-20">
            <motion.span variants={fadeIn} className="text-xs tracking-[0.2em] text-brand-gold uppercase font-bold mb-4 block">WHY KHU DEVELOPERS</motion.span>
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight max-w-3xl">Real Estate Deserves More Thought.</motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            {[
              { title: 'Local Perspective', desc: 'Deep roots in the region give us a clearer understanding of how locations are growing.' },
              { title: 'Thoughtful Planning', desc: 'Considering access, community, and usability before a plot is ever presented.' },
              { title: 'Clear Communication', desc: 'Navigating property decisions with transparency and straight answers.' },
              { title: 'Long-Term Perspective', desc: 'Focused on sustainable growth and relationships that outlast a single transaction.' }
            ].map((item, idx) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="flex flex-col gap-4 border-t border-white/10 pt-8"
              >
                <h3 className="text-2xl font-serif text-brand-gold">{item.title}</h3>
                <p className="text-white/70 font-light leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 07B. REAL ESTATE GALLERY / SITE DEVELOPMENTS */}
      <section className="py-24 md:py-36 bg-brand-warm-white border-t border-brand-charcoal/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={staggerContainer} 
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          >
            <div>
              <motion.span variants={fadeIn} className="text-xs tracking-[0.2em] text-brand-gold uppercase font-bold mb-4 block">
                ON-SITE PROGRESS & DEVELOPMENTS
              </motion.span>
              <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy leading-tight">
                Authentic Groundwork.<br />Active Site Developments.
              </motion.h2>
            </div>
            <motion.p variants={fadeIn} className="text-brand-charcoal/70 text-base md:text-lg font-light max-w-md">
              A transparent glimpse into our actual plotted sites across Robertsganj, Ghorawal, and Salkhan. From initial land survey to road demarcation and colony entrances.
            </motion.p>
          </motion.div>

          {/* Curated Balanced Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1: Main Site Entrance (Image 10) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="group bg-white rounded-lg overflow-hidden border border-brand-soft-grey shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft-grey">
                <img 
                  src="https://res.cloudinary.com/hmjaaen2/image/upload/v1791888421/45371c0c-bdca-40cd-9775-f967bc89c65a.jpg" 
                  alt="KHU Developers project signboard at site entrance in Robertsganj" 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-brand-deep-navy/90 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded">
                  Site Entrance
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl text-brand-deep-navy mb-2 group-hover:text-brand-architectural-blue transition-colors">
                    Robertsganj Project Entry
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 font-light leading-relaxed mb-4">
                    Official KHU Developers site marker, gated entry pathway, and leveled access avenue.
                  </p>
                </div>
                <div className="pt-4 border-t border-brand-soft-grey flex items-center justify-between text-xs text-brand-charcoal/60">
                  <span>Robertsganj, Sonbhadra</span>
                  <span className="text-brand-gold font-medium">On-Site</span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Wide Plotted Land with Road & Flags (Image 12) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="group bg-white rounded-lg overflow-hidden border border-brand-soft-grey shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft-grey">
                <img 
                  src="https://res.cloudinary.com/hmjaaen2/image/upload/v1791888448/541f9fbe-7cd6-47c5-91f0-b91b9cce2811.jpg" 
                  alt="Plotted colony layout with marked brick boundaries and celebratory flags" 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-brand-primary text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded">
                  Plot Demarcation
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl text-brand-deep-navy mb-2 group-hover:text-brand-architectural-blue transition-colors">
                    Active Colony Layout
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 font-light leading-relaxed mb-4">
                    Individual plot boundaries visibly laid with brickwork and access roads during customer site visits.
                  </p>
                </div>
                <div className="pt-4 border-t border-brand-soft-grey flex items-center justify-between text-xs text-brand-charcoal/60">
                  <span>Plotted Township</span>
                  <span className="text-brand-gold font-medium">Demarcated</span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Boundary Wall Construction (Image 4) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="group bg-white rounded-lg overflow-hidden border border-brand-soft-grey shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft-grey">
                <img 
                  src="https://res.cloudinary.com/hmjaaen2/image/upload/v1791888390/65bbf04d-4b57-4fce-a1b7-975a71dc7f50.jpg" 
                  alt="Ground-level boundary masonry and plot demarcation work" 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-brand-architectural-blue text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded">
                  Civil Groundwork
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl text-brand-deep-navy mb-2 group-hover:text-brand-architectural-blue transition-colors">
                    Boundary Masonry & Foundation
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 font-light leading-relaxed mb-4">
                    Brick alignment and foundation trenches delineating demarcated plots for future owners.
                  </p>
                </div>
                <div className="pt-4 border-t border-brand-soft-grey flex items-center justify-between text-xs text-brand-charcoal/60">
                  <span>Site Development</span>
                  <span className="text-brand-gold font-medium">In Progress</span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Main Access Road with Flags (Image 5) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="group bg-white rounded-lg overflow-hidden border border-brand-soft-grey shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft-grey">
                <img 
                  src="https://res.cloudinary.com/hmjaaen2/image/upload/v1791888398/57ceb1fe-7464-4b3d-8e51-db084dfa55e8.jpg" 
                  alt="Wide internal gravel corridor leading towards project ceremonial welcome gate" 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-brand-deep-navy/90 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded">
                  Internal Roadway
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl text-brand-deep-navy mb-2 group-hover:text-brand-architectural-blue transition-colors">
                    Entrance Avenue & Passage
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 font-light leading-relaxed mb-4">
                    Naturally shaded, well-graded connectivity road built to handle vehicular movement and site visits.
                  </p>
                </div>
                <div className="pt-4 border-t border-brand-soft-grey flex items-center justify-between text-xs text-brand-charcoal/60">
                  <span>Connectivity Road</span>
                  <span className="text-brand-gold font-medium">Accessible</span>
                </div>
              </div>
            </motion.div>

            {/* Card 5: Drainage & Underground Utilities (Image 11) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="group bg-white rounded-lg overflow-hidden border border-brand-soft-grey shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft-grey">
                <img 
                  src="https://res.cloudinary.com/hmjaaen2/image/upload/v1791888435/b8b20d58-2660-4b1b-acf0-7fdd09b2a5c9.jpg" 
                  alt="Underground concrete drainage pipe installation and utility trenching" 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-brand-primary text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded">
                  Drainage System
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl text-brand-deep-navy mb-2 group-hover:text-brand-architectural-blue transition-colors">
                    Underground Infrastructure
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 font-light leading-relaxed mb-4">
                    High-capacity pipeline installation ensuring robust rainwater management and planned utility drainage.
                  </p>
                </div>
                <div className="pt-4 border-t border-brand-soft-grey flex items-center justify-between text-xs text-brand-charcoal/60">
                  <span>Colony Infrastructure</span>
                  <span className="text-brand-gold font-medium">Underground</span>
                </div>
              </div>
            </motion.div>

            {/* Card 6: Clean Bitumen Road Paving (Image 8) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="group bg-white rounded-lg overflow-hidden border border-brand-soft-grey shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft-grey">
                <img 
                  src="https://res.cloudinary.com/hmjaaen2/image/upload/v1791888412/07e03829-596e-4f24-929a-953575e4651c.jpg" 
                  alt="Freshly paved bituminous road surface with perimeter boundary fencing" 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-brand-architectural-blue text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded">
                  Paved Roads
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl text-brand-deep-navy mb-2 group-hover:text-brand-architectural-blue transition-colors">
                    Completed Roadways
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 font-light leading-relaxed mb-4">
                    Blacktop internal access pathways with perimeter compound walls ready for property builders.
                  </p>
                </div>
                <div className="pt-4 border-t border-brand-soft-grey flex items-center justify-between text-xs text-brand-charcoal/60">
                  <span>Plotted Community</span>
                  <span className="text-brand-gold font-medium">Paved</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 08. REAL ESTATE JOURNEY */}
      <section className="py-32 md:py-48 bg-brand-off-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy mb-20">
            From First Thought to the Right Place.
          </motion.h2>
          
          <div className="flex flex-col gap-12 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-brand-charcoal/10 -translate-x-1/2 z-0" />
            
            {['DISCOVER', 'EXPLORE', 'VISIT', 'UNDERSTAND', 'CONNECT'].map((step, idx) => (
              <motion.div 
                key={step}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-100px" }}
                className="relative z-10 flex items-center justify-center bg-brand-off-white py-4"
              >
                <span className={`text-4xl md:text-6xl font-serif tracking-tight transition-colors duration-700 ${idx % 2 === 0 ? 'text-brand-architectural-blue' : 'text-brand-gold'}`}>
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 09. CONTACT + MAP PREVIEW */}
      <section className="py-24 md:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.span variants={fadeIn} className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-4 block">GET IN TOUCH</motion.span>
              <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy leading-tight mb-8">Let's Talk About Your Next Move.</motion.h2>
              <motion.p variants={fadeIn} className="text-brand-charcoal/70 text-lg leading-relaxed font-light mb-12">
                Have a question about our projects, locations or opportunities? Connect with the KHU Developers team.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col gap-6 mb-12 border-l-2 border-brand-gold pl-6">
                <div>
                  <span className="block text-xs font-bold tracking-widest uppercase text-brand-charcoal/50 mb-1">Direct Phone Enquiries</span>
                  <a 
                    href="tel:+916394247451" 
                    className="inline-flex items-center gap-2 text-2xl font-serif text-brand-deep-navy font-bold hover:text-brand-architectural-blue transition-colors group"
                  >
                    <Phone size={20} className="text-brand-gold group-hover:scale-110 transition-transform" />
                    <span>6394247451</span>
                  </a>
                  <span className="block text-xs text-brand-charcoal/60 mt-1">Available for project inquiries, site visits & plots guidance</span>
                </div>
                <div>
                  <span className="block text-xs font-bold tracking-widest uppercase text-brand-charcoal/50 mb-1">Registered Office</span>
                  <span className="block text-brand-deep-navy font-medium">Robertsganj, Sonbhadra, Uttar Pradesh</span>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-wrap gap-4 items-center">
                <a 
                  href="tel:+916394247451" 
                  className="inline-flex items-center gap-3 bg-brand-gold text-brand-deep-navy px-8 py-4 text-sm tracking-widest uppercase font-bold hover:bg-brand-architectural-blue hover:text-white transition-all shadow-md hover:scale-[1.02]"
                >
                  <Phone size={16} />
                  <span>Call Now: 6394247451</span>
                </a>
                <Link to="/contact" className="inline-flex items-center gap-3 bg-brand-deep-navy text-white px-8 py-4 text-sm tracking-widest uppercase font-bold hover:bg-brand-architectural-blue transition-colors">
                  Open Contact Page <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}} transition={{duration:0.8}} className="w-full">
              {/* Map & Form UI */}
              <div className="bg-brand-soft-grey p-2 rounded-xl overflow-hidden border border-brand-charcoal/10 shadow-lg">
                <div className="w-full h-64 md:h-80 bg-brand-charcoal/5 rounded-lg overflow-hidden relative mb-2">
                  {/* Safe location map around Robertsganj */}
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115852.1764654516!2d82.97516345!3d24.6750393!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x398ef35b2e3dc8c1%3A0xb35a3ccbcdd8ad37!2sRobertsganj%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                    width="100%" height="100%" style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 rounded-lg"
                  />
                </div>
                <div className="bg-white p-6 md:p-8 rounded-lg">
                  <h3 className="text-xl font-serif text-brand-deep-navy mb-6">Send a Message</h3>
                  <form className="flex flex-col gap-4">
                    <input type="text" placeholder="Name" className="w-full bg-brand-off-white border border-brand-charcoal/10 rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-brand-architectural-blue transition-colors" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="tel" placeholder="Phone" className="w-full bg-brand-off-white border border-brand-charcoal/10 rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-brand-architectural-blue transition-colors" />
                      <input type="email" placeholder="Email" className="w-full bg-brand-off-white border border-brand-charcoal/10 rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-brand-architectural-blue transition-colors" />
                    </div>
                    <textarea placeholder="Message" rows={3} className="w-full bg-brand-off-white border border-brand-charcoal/10 rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-brand-architectural-blue transition-colors resize-none"></textarea>
                    <button type="button" className="w-full bg-brand-gold text-brand-deep-navy text-xs tracking-widest uppercase font-bold py-4 hover:bg-brand-architectural-blue hover:text-white transition-colors mt-2">
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section className="py-24 md:py-40 bg-brand-warm-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.2em] text-brand-gold uppercase font-bold mb-4 block">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-serif text-brand-deep-navy">Questions, Answered.</h2>
          </div>

          <div className="flex flex-col border-t border-brand-charcoal/10">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-brand-charcoal/10 overflow-hidden">
                <button 
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-6 md:py-8 text-left focus:outline-none group"
                >
                  <span className="text-lg md:text-xl font-serif text-brand-deep-navy group-hover:text-brand-architectural-blue transition-colors pr-8">{faq.question}</span>
                  <ChevronDown className={`flex-none text-brand-charcoal/40 transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaqIndex === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    >
                      <p className="pb-8 text-brand-charcoal/70 font-light pr-12">
                        {faq.answer}
                        {idx === 3 && (
                          <Link to="/projects" className="block mt-4 text-sm font-bold tracking-widest uppercase text-brand-gold hover:text-brand-architectural-blue transition-colors">
                            Explore Projects &rarr;
                          </Link>
                        )}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA */}
      <section className="relative py-32 md:py-48 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/services/projects_hero_1790312969807.jpg" 
            alt="Your Next Chapter Could Begin Here" 
            className="w-full h-full object-cover opacity-80 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-deep-navy/80 to-brand-deep-navy" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-white">
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-5xl md:text-7xl font-serif mb-8 leading-tight">
            Your Next Chapter Could Begin Here.
          </motion.h2>
          <motion.p initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.1}} className="text-lg md:text-xl font-light text-white/80 mb-12">
            Explore KHU Developers projects or connect with our team.
          </motion.p>
          
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.2}} className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center flex-wrap">
            <a 
              href="tel:+916394247451" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-brand-gold text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:bg-white hover:text-brand-deep-navy transition-all shadow-xl hover:scale-105"
            >
              <Phone size={16} />
              <span>Call Now: 6394247451</span>
            </a>
            <Link to="/projects" className="px-8 py-4 bg-white text-brand-deep-navy text-sm tracking-widest uppercase font-bold hover:bg-brand-architectural-blue hover:text-white transition-colors">
              EXPLORE PROJECTS &rarr;
            </Link>
            <Link to="/contact" className="px-8 py-4 border border-white text-white text-sm tracking-widest uppercase font-bold hover:bg-white/10 transition-colors">
              ENQUIRE ONLINE &rarr;
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
