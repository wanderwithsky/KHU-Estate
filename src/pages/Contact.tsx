import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    project: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Name and phone number are required.');
      setLoading(false);
      return;
    }

    try {
      let projectId = null;
      if (formData.project && formData.project !== 'general') {
        const { data: projData } = await supabase.from('projects').select('id').ilike('slug', formData.project).maybeSingle();
        if (projData) projectId = projData.id;
      }

      const { error: submitError } = await supabase.from('leads').insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        project_id: projectId,
        source: 'WEBSITE_CONTACT_FORM',
        status: 'NEW',
        notes: `Project Interest: ${formData.project || 'None'}\n\nMessage: ${formData.message || 'No message provided.'}`
      });

      if (submitError) throw new Error(submitError.message || 'Failed to submit form');
      
      setSuccess(true);
      setFormData({ name: '', phone: '', email: '', project: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again or call us.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-brand-off-white min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div>
          <h1 className="text-5xl md:text-7xl font-serif text-brand-deep-navy tracking-tight mb-8 leading-tight">
            LET'S TALK <br /> PROPERTY.
          </h1>
          <p className="text-xl text-brand-charcoal/70 font-light max-w-md leading-relaxed mb-16">
            Whether you're looking for a residential plot or a commercial investment, we are here to provide clear and actionable guidance.
          </p>

          <div className="space-y-8">
            <div>
              <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-2 block">
                Office
              </span>
              <p className="text-brand-deep-navy text-lg">Robertsganj, Sonbhadra<br />Uttar Pradesh</p>
            </div>
            <div>
              <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-2 block">
                Contact
              </span>
              <p className="text-brand-deep-navy text-lg">Call or WhatsApp<br />Email Enquiries</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 border border-brand-soft-grey shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {success && (
              <div className="bg-green-50 text-green-800 p-4 rounded border border-green-200 text-sm">
                Thank you for reaching out! Your inquiry has been received and our team will contact you shortly.
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded border border-red-200 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Name *</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors" 
                placeholder="Your full name" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Phone *</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors" 
                  placeholder="Your phone number" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors" 
                  placeholder="Your email address" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Property / Project</label>
              <select 
                value={formData.project}
                onChange={e => setFormData({...formData, project: e.target.value})}
                className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors appearance-none"
              >
                <option value="">Select a project of interest</option>
                <option value="maa-kundwasini-nagar">Maa Kundwasini Nagar</option>
                <option value="general">General Enquiry</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Message</label>
              <textarea 
                rows={4} 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full border-b border-brand-soft-grey bg-transparent py-3 focus:outline-none focus:border-brand-deep-navy transition-colors resize-none" 
                placeholder="How can we help you?"
              ></textarea>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-8 px-8 py-4 bg-brand-deep-navy text-white text-sm tracking-widest uppercase font-medium hover:bg-brand-architectural-blue transition-colors disabled:opacity-50"
            >
              {loading ? 'SENDING...' : 'SEND ENQUIRY'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
