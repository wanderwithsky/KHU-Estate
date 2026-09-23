import { Link } from 'react-router-dom';
import { projects } from '../data/projects';

export default function Projects() {
  return (
    <div className="w-full bg-brand-off-white min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-20">
        <h1 className="text-5xl md:text-6xl font-serif text-brand-deep-navy tracking-tight mb-6">
          PORTFOLIO.
        </h1>
        <div className="w-24 h-px bg-brand-architectural-blue"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-32">
        {projects.map((project, index) => (
          <div key={project.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
            <div className={`relative aspect-[4/5] w-full overflow-hidden ${index % 2 !== 0 ? 'lg:order-2' : ''}`}>
              <img 
                src={project.coverImage} 
                alt={project.name} 
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[10s] ease-out"
              />
            </div>
            
            <div className={`${index % 2 !== 0 ? 'lg:order-1' : ''}`}>
              <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-4 block">
                {project.type}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif text-brand-deep-navy mb-4">
                {project.name}
              </h2>
              <p className="text-brand-charcoal/60 text-sm tracking-widest uppercase mb-8">
                {project.location}
              </p>
              
              <p className="text-lg text-brand-charcoal font-light leading-relaxed mb-12">
                {project.description}
              </p>

              <Link 
                to={`/projects/${project.id}`} 
                className="inline-block px-8 py-4 border border-brand-deep-navy text-brand-deep-navy text-sm tracking-widest uppercase font-medium hover:bg-brand-deep-navy hover:text-white transition-colors"
              >
                Explore Project
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
