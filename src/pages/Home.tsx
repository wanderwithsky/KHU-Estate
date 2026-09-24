import { Link } from 'react-router-dom';
import Hero from '../sections/Hero';

import FeaturedProject from '../sections/FeaturedProject';
import WhyKhu from '../sections/WhyKhu';

export default function Home() {
  return (
    <div className="w-full">
      <Hero />

      <FeaturedProject />
      <WhyKhu />
      
      {/* Property Experience Quick Links */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-brand-deep-navy">FIND YOUR SPACE.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'RESIDENTIAL', image: '/images/projects/project_residential.jpg' },
              { name: 'COMMERCIAL', image: '/images/projects/project_highway.jpg' },
              { name: 'PLOTS', image: '/images/projects/project_nature_city.jpg' },
              { name: 'PROJECTS', image: '/images/projects/project_happy_home.jpg' }
            ].map((category) => (
              <Link 
                key={category.name} 
                to="/projects"
                className="group relative aspect-[3/4] overflow-hidden bg-brand-warm-white flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-brand-charcoal/20 group-hover:bg-brand-deep-navy/60 transition-colors duration-500 z-10" />
                <h3 className="relative z-20 text-white tracking-widest font-medium uppercase text-lg group-hover:scale-110 transition-transform duration-500 shadow-black drop-shadow-md">
                  {category.name}
                </h3>
                <img 
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 bg-brand-off-white text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-brand-deep-navy leading-tight mb-8">
            A PROPERTY JOURNEY BUILT AROUND CLARITY.
          </h2>
          <p className="text-lg md:text-xl text-brand-charcoal/70 font-light leading-relaxed">
            From discovering a project to understanding a plot and scheduling a visit, every step should feel clear.
          </p>
        </div>
      </section>
    </div>
  );
}
