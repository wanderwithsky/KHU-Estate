import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function FeatureShell({ title }: { title?: string }) {
  const location = useLocation();
  const displayTitle = title || location.pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Module';

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
        <Construction size={32} />
      </div>
      <h2 className="text-2xl font-serif text-brand-deep-navy mb-3">{displayTitle}</h2>
      <p className="text-brand-charcoal/70 mb-8">
        This module is part of the KHU Developers roadmap. The user interface shell has been created, but it is currently awaiting the implementation of supporting backend database tables and APIs.
      </p>
      <div className="bg-brand-off-white border border-brand-soft-grey rounded p-4 text-xs font-mono text-brand-charcoal/60 w-full text-left">
        <strong>Dependency:</strong> Backend Supabase integration required for {location.pathname}.
      </div>
    </div>
  );
}
