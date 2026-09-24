import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function JoinAssociate() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const applicationNumber = `APP-${Math.floor(Date.now() / 1000)}`;

      const { error: insertError } = await supabase
        .from('associate_applications')
        .insert([{
          application_number: applicationNumber,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          message: formData.message,
          status: 'PENDING_TL_REVIEW',
          source: 'Website'
        }]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setStatus('success');
      setFormData({ fullName: '', phone: '', email: '', city: '', message: '' });
    } catch (error: any) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit application');
    }
  };

  return (
    <div className="w-full bg-brand-warm-white min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div>
          <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-6 block">
            Careers
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy tracking-tight mb-8 leading-tight">
            BUILD YOUR PROPERTY CAREER WITH KHU ESTATE.
          </h1>
          <p className="text-lg text-brand-charcoal font-light max-w-lg leading-relaxed mb-12">
            A real estate opportunity for people who want to work with clients, explore properties, and build lasting business relationships. Join our growing network as an Associate.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <span className="text-brand-architectural-blue mr-4 font-serif text-xl">01</span>
              <div>
                <h3 className="font-medium text-brand-deep-navy mb-1">Access Premium Projects</h3>
                <p className="text-sm font-light text-brand-charcoal">Represent thoughtfully planned properties like Maa Kundwasini Nagar.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-brand-architectural-blue mr-4 font-serif text-xl">02</span>
              <div>
                <h3 className="font-medium text-brand-deep-navy mb-1">Professional Growth</h3>
                <p className="text-sm font-light text-brand-charcoal">Build your own client base with the support of an established brand.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-brand-architectural-blue mr-4 font-serif text-xl">03</span>
              <div>
                <h3 className="font-medium text-brand-deep-navy mb-1">Transparent Returns</h3>
                <p className="text-sm font-light text-brand-charcoal">Clear and structured commission opportunities based on your success.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 shadow-sm border-t-4 border-brand-architectural-blue">
          <div className="mb-8">
            <h2 className="text-2xl font-serif text-brand-deep-navy mb-2">Join as Associate</h2>
            <p className="text-sm text-brand-charcoal/60 font-light">Submit your details and our team will get in touch.</p>
          </div>

          {status === 'success' ? (
            <div className="bg-brand-light-blue p-6 border-l-4 border-brand-architectural-blue">
              <h3 className="text-xl font-serif text-brand-deep-navy mb-2">Application Received</h3>
              <p className="text-sm text-brand-charcoal">Thank you for your interest. Our team will review your application and get in touch with you shortly.</p>
              <button 
                onClick={() => setStatus('idle')}
                className="mt-6 text-sm font-medium text-brand-architectural-blue hover:text-brand-deep-navy uppercase tracking-wider"
              >
                Submit Another Application
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {status === 'error' && (
                <div className="bg-red-50 text-red-600 p-4 text-sm rounded border border-red-200">
                  {errorMessage}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors" 
                  placeholder="John Doe" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Phone *</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors" 
                    placeholder="+91" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Email *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors" 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors" 
                  placeholder="e.g. Robertsganj" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Message (Optional)</label>
                <textarea 
                  rows={3} 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors resize-none" 
                  placeholder="Tell us about your background..."
                />
              </div>
              
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="w-full mt-4 px-8 py-4 bg-brand-deep-navy text-white text-sm tracking-widest uppercase font-medium hover:bg-brand-architectural-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
