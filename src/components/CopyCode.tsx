import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyCodeProps {
  code: string;
}

export default function CopyCode({ code }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code || code === 'Code not assigned') return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!code || code === 'Code not assigned') {
    return null;
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-brand-off-white hover:bg-gray-100 text-brand-architectural-blue border border-brand-soft-grey rounded text-xs font-medium transition-colors"
      title="Copy Code"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? <span className="text-green-600">Copied</span> : 'Copy Code'}
    </button>
  );
}
