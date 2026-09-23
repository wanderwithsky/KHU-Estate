import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-brand-deep-navy">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Premium Real Estate" 
          className="w-full h-full object-cover object-center opacity-40 transform hover:scale-105 transition-transform duration-[20s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-deep-navy/40 via-transparent to-brand-deep-navy/80" />
      </div>
      
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center mt-20">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white tracking-tight mb-8 leading-tight">
          WHERE SPACE <br /> BECOMES POSSIBILITY.
        </h1>
        <p className="text-brand-off-white text-lg md:text-xl font-light tracking-wide max-w-2xl mb-12">
          Thoughtfully planned spaces for living, investing and building what comes next.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <Link 
            to="/projects" 
            className="px-8 py-4 bg-white text-brand-deep-navy text-sm tracking-widest uppercase font-medium hover:bg-brand-light-blue transition-colors"
          >
            Explore Projects
          </Link>
          <Link 
            to="/contact" 
            className="px-8 py-4 border border-white text-white text-sm tracking-widest uppercase font-medium hover:bg-white hover:text-brand-deep-navy transition-colors"
          >
            Schedule a Site Visit
          </Link>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 text-white opacity-80">
        <span className="text-xs tracking-[0.2em] uppercase mb-4 font-light">Scroll to Explore</span>
        <div className="w-[1px] h-12 bg-white/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-[scroll_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </section>
  );
}
