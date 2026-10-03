import { useState, useEffect } from 'react';
import { getVisitSelfieUrl } from '../utils/getVisitSelfieUrl';
import { Camera } from 'lucide-react';

interface SelfieImageProps {
  selfiePath: string | null | undefined;
  className?: string;
  alt?: string;
}

export default function SelfieImage({ selfiePath, className = '', alt = 'Visit selfie' }: SelfieImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSignedUrl() {
      if (!selfiePath) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      const url = await getVisitSelfieUrl(selfiePath);
      
      if (isMounted) {
        if (url) {
          setSignedUrl(url);
        } else {
          setError(true);
        }
        setLoading(false);
      }
    }

    loadSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [selfiePath]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className} min-h-[100px]`}>
        <p className="text-xs text-brand-charcoal/50 animate-pulse">Loading selfie...</p>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 rounded border border-gray-200 ${className} min-h-[100px] p-4`}>
        <Camera size={24} className="text-gray-400 mb-2" />
        <p className="text-xs font-medium text-gray-500">Selfie unavailable</p>
        {error && <p className="text-[10px] text-gray-400 text-center mt-1">Unable to load this image.</p>}
      </div>
    );
  }

  return (
    <img 
      src={signedUrl} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
}
