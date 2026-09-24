import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { projects, plots } from '../data/projects';

export default function ProjectDetails() {
  const { slug } = useParams();
  const project = projects.find(p => p.id === (slug || 'maa-kundwasini-nagar')); // Use slug from route
  
  const [filterType, setFilterType] = useState('ALL');
  
  if (!project) return <div>Project not found</div>;

  const filteredPlots = plots.filter(plot => filterType === 'ALL' || plot.type.toUpperCase() === filterType);

  return (
    <div className="w-full bg-brand-off-white min-h-screen pt-32 pb-24">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-20 text-center">
        <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-4 block">
          Featured Project
        </span>
        <h1 className="text-5xl md:text-7xl font-serif text-brand-deep-navy tracking-tight mb-6">
          {project.name.toUpperCase()}
        </h1>
        <p className="text-brand-charcoal/60 text-sm tracking-widest uppercase">
          {project.location}
        </p>
      </div>

      <div className="w-full h-[60vh] md:h-[80vh] relative mb-24 overflow-hidden">
        <img 
          src={project.coverImage} 
          alt={project.name} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Project Story / Info */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 mb-32">
        <div>
          <h2 className="text-3xl font-serif text-brand-deep-navy mb-8">THE OPPORTUNITY.</h2>
          <p className="text-lg text-brand-charcoal font-light leading-relaxed mb-6">
            {project.description} This project offers a mix of residential and commercial plots tailored for high growth and excellent connectivity.
          </p>
        </div>
        <div>
          {project.offer && (
           <div className="bg-brand-warm-white p-12 border border-brand-soft-grey/50">
             <h3 className="text-xs tracking-[0.2em] text-brand-deep-navy uppercase font-bold mb-6">Limited Offer</h3>
             <p className="text-3xl font-serif text-brand-architectural-blue mb-2">{project.offer.price}</p>
             <p className="text-lg font-medium text-brand-charcoal mb-4">{project.offer.details}</p>
             <p className="text-xs text-brand-charcoal/60">{project.offer.terms}</p>
           </div>
          )}
        </div>
      </div>

      {/* Location Advantage */}
      {project.distances && project.distances.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-32">
          <h2 className="text-3xl font-serif text-brand-deep-navy mb-12 text-center">LOCATION ADVANTAGES</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {project.distances.map((loc, idx) => (
              <div key={idx} className="text-center group">
                <p className="text-2xl font-serif text-brand-architectural-blue mb-2 group-hover:scale-110 transition-transform">{loc.distance}</p>
                <p className="text-xs tracking-widest uppercase font-medium text-brand-charcoal">{loc.location}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory / Site Plan */}
      <div id="inventory" className="max-w-7xl mx-auto px-6 lg:px-12">
        <h2 className="text-3xl font-serif text-brand-deep-navy mb-8">A PLAN DESIGNED FOR POSSIBILITY.</h2>
        
        {/* Filter */}
        <div className="flex gap-4 mb-8">
          {['ALL', 'RESIDENTIAL', 'COMMERCIAL'].map(type => (
            <button 
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs tracking-widest uppercase px-6 py-2 border ${filterType === type ? 'bg-brand-deep-navy text-white border-brand-deep-navy' : 'bg-transparent border-brand-soft-grey text-brand-charcoal hover:border-brand-deep-navy'} transition-colors`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Plot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPlots.map(plot => (
            <div key={plot.id} className="bg-white p-6 border border-brand-soft-grey hover:border-brand-architectural-blue transition-colors group cursor-pointer relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-2 h-full ${plot.status === 'AVAILABLE' ? 'bg-green-500/20' : plot.status === 'RESERVED' ? 'bg-yellow-500/20' : plot.status === 'BOOKED' ? 'bg-orange-500/20' : 'bg-red-500/20'}`} />
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl font-serif text-brand-deep-navy">{plot.id}</span>
                <span className={`text-[10px] tracking-widest uppercase px-2 py-1 ${plot.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-brand-soft-grey text-brand-charcoal'}`}>
                  {plot.status}
                </span>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-brand-charcoal"><span className="text-xs text-brand-charcoal/50 uppercase tracking-widest">Type:</span> {plot.type}</p>
                <p className="text-sm text-brand-charcoal"><span className="text-xs text-brand-charcoal/50 uppercase tracking-widest">Dim:</span> {plot.dimensions}</p>
                <p className="text-sm text-brand-charcoal"><span className="text-xs text-brand-charcoal/50 uppercase tracking-widest">Area:</span> {plot.area} sq.ft</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
