import { Link } from 'react-router-dom';
import { projects } from '../data/projects';

export default function FeaturedProject() {
  const project = projects[0];

  return (
    <section className="py-24 bg-brand-warm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-4 block">
              Featured Project
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-brand-deep-navy mb-4">
              {project.name}
            </h2>
            <p className="text-brand-charcoal/60 text-lg tracking-wide uppercase">
              {project.location}
            </p>
          </div>
          <div className="hidden md:flex gap-4">
            <Link 
              to={`/projects/${project.id}`} 
              className="px-8 py-4 bg-brand-deep-navy text-white text-sm tracking-widest uppercase font-medium hover:bg-brand-architectural-blue transition-colors"
            >
              Explore Project
            </Link>
          </div>
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden mb-12">
          <img 
            src={project.coverImage} 
            alt={project.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute top-6 right-6 bg-white px-6 py-3 shadow-lg">
            <p className="text-xs tracking-[0.2em] uppercase text-brand-deep-navy font-bold mb-1">Limited Offer</p>
            <p className="text-lg font-serif text-brand-architectural-blue">{project.offer.price}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-2">
            <p className="text-xl text-brand-charcoal font-light leading-relaxed">
              {project.description} Featuring residential and commercial plots thoughtfully planned to offer accessibility and opportunity.
            </p>
          </div>
          <div className="flex flex-col justify-center">
            <Link 
              to={`/projects/${project.id}`} 
              className="md:hidden px-8 py-4 mb-4 text-center bg-brand-deep-navy text-white text-sm tracking-widest uppercase font-medium"
            >
              Explore Project
            </Link>
            <Link 
              to={`/projects/${project.id}#inventory`} 
              className="px-8 py-4 text-center border border-brand-deep-navy text-brand-deep-navy text-sm tracking-widest uppercase font-medium hover:bg-brand-deep-navy hover:text-white transition-colors"
            >
              View Available Plots
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
