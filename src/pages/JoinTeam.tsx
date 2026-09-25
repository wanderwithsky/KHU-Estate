import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

export default function JoinTeam() {
  const location = useLocation();
  
  const getInitialRole = () => {
    if (location.pathname.includes('team-leader') && !location.pathname.includes('senior')) {
      return 'Team Leader';
    } else if (location.pathname.includes('senior-team-leader')) {
      return 'Senior Team Leader';
    }
    return 'Associate';
  };

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    message: '',
    referralCode: '',
    role: getInitialRole()
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData(prev => ({ ...prev, role: getInitialRole(), referralCode: '' }));
  }, [location.pathname]);

  // Handle clicking outside the custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      let assignedTlId = null;
      let assignedStlId = null;
      let appStatus = 'PENDING_TL_REVIEW'; // Default for associate

      // Validate codes based on role
      if (formData.role === 'Associate' && formData.referralCode.trim()) {
        const { data: tlData, error: tlError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_code', formData.referralCode.trim())
          .eq('role', 'TEAM_LEADER')
          .eq('status', 'ACTIVE')
          .single();

        if (tlError || !tlData) {
          throw new Error('Invalid Team Leader Code. Please check the code or leave it blank to submit your application to Admin.');
        }
        assignedTlId = tlData.id;
      } else if (formData.role === 'Team Leader') {
        appStatus = 'PENDING_STL_REVIEW';
        if (formData.referralCode.trim()) {
          const { data: stlData, error: stlError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_code', formData.referralCode.trim())
            .eq('role', 'SENIOR_TL')
            .eq('status', 'ACTIVE')
            .single();

          if (stlError || !stlData) {
            throw new Error('Invalid Senior Team Leader Code. Please check the code or leave it blank to submit to Admin.');
          }
          assignedStlId = stlData.id;
        }
      } else if (formData.role === 'Senior Team Leader') {
        appStatus = 'PENDING_STL_REVIEW'; // Or a new status if we had it, but this implies Admin review
        // No code validation needed
      }

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
          referral_code: formData.referralCode.trim() || null,
          assigned_tl_id: assignedTlId,
          assigned_stl_id: assignedStlId,
          status: appStatus,
          role_applied_for: formData.role,
          source: 'Website'
        }]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setStatus('success');
      setFormData({ fullName: '', phone: '', email: '', city: '', message: '', referralCode: '', role: formData.role });
    } catch (error: any) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit application');
    }
  };

  return (
    <div className="w-full bg-brand-warm-white min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* Left Section */}
        <div className="lg:w-1/2 lg:sticky lg:top-32 h-fit">
          <span className="text-xs tracking-[0.2em] text-brand-architectural-blue uppercase font-bold mb-6 block">
            Careers
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-deep-navy tracking-tight mb-8 leading-tight">
            BUILD YOUR<br />
            PROPERTY CAREER<br />
            WITH KHU DEVELOPERS.
          </h1>
          <p className="text-lg text-brand-charcoal font-light max-w-lg leading-relaxed mb-12">
            Join KHU Developers and build meaningful opportunities in real estate, leadership, and business development.
          </p>

          <div className="space-y-6">
            <div className="flex items-center">
              <span className="text-brand-architectural-blue mr-4 font-serif text-xl">01</span>
              <h3 className="font-medium text-brand-deep-navy text-lg">Associate Opportunities</h3>
            </div>
            <div className="flex items-center">
              <span className="text-brand-architectural-blue mr-4 font-serif text-xl">02</span>
              <h3 className="font-medium text-brand-deep-navy text-lg">Team Leadership</h3>
            </div>
            <div className="flex items-center">
              <span className="text-brand-architectural-blue mr-4 font-serif text-xl">03</span>
              <h3 className="font-medium text-brand-deep-navy text-lg">Senior Leadership</h3>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:w-1/2">
          <div className="bg-white p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl border border-brand-charcoal/5">
            <div className="mb-8">
              <h2 className="text-2xl font-serif text-brand-deep-navy mb-2">Join Our Team</h2>
              <p className="text-sm text-brand-charcoal/60 font-light">Submit your details and our team will get in touch.</p>
            </div>

            {status === 'success' ? (
              <div className="bg-brand-off-white p-8 rounded-xl border border-brand-charcoal/10 text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">✓</div>
                <h3 className="text-xl font-serif text-brand-deep-navy mb-2">Application Received</h3>
                <p className="text-sm text-brand-charcoal mb-8">Thank you for your interest. Our team will review your application and get in touch with you shortly.</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-6 py-3 bg-brand-deep-navy text-white text-xs font-medium tracking-widest hover:bg-brand-architectural-blue transition-colors rounded uppercase"
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {status === 'error' && (
                  <div className="bg-red-50 text-red-600 p-4 text-sm rounded-lg border border-red-100">
                    {errorMessage}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[11px] tracking-[0.1em] uppercase text-brand-charcoal font-medium">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3.5 rounded-lg focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors text-sm" 
                    placeholder="John Doe" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] tracking-[0.1em] uppercase text-brand-charcoal font-medium">Phone *</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3.5 rounded-lg focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors text-sm" 
                      placeholder="+91" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] tracking-[0.1em] uppercase text-brand-charcoal font-medium">Email *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3.5 rounded-lg focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors text-sm" 
                      placeholder="john@example.com" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] tracking-[0.1em] uppercase text-brand-charcoal font-medium">City</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3.5 rounded-lg focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors text-sm" 
                    placeholder="e.g. Robertsganj" 
                  />
                </div>

                {/* Role Dropdown */}
                <div className="space-y-2 relative" ref={dropdownRef}>
                  <label className="text-[11px] tracking-[0.1em] uppercase text-brand-charcoal font-medium">Role *</label>
                  <div 
                    className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3.5 rounded-lg cursor-pointer flex justify-between items-center transition-colors hover:border-brand-architectural-blue"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  >
                    <span className={`text-sm ${formData.role ? 'text-brand-deep-navy' : 'text-brand-charcoal/50'}`}>
                      {formData.role || 'Select your role'}
                    </span>
                    <span className={`transform transition-transform duration-300 text-brand-charcoal/50 text-xs ${isRoleDropdownOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                  
                  {/* Premium Custom Dropdown Options */}
                  <div className={`absolute z-10 w-full mt-2 bg-white rounded-xl border border-brand-charcoal/10 shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300 ease-out origin-top ${isRoleDropdownOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
                    {['Senior Team Leader', 'Team Leader', 'Associate'].map((roleOption) => (
                      <div 
                        key={roleOption}
                        className={`px-4 py-3.5 text-[15px] cursor-pointer transition-colors ${formData.role === roleOption ? 'bg-brand-off-white font-medium text-brand-architectural-blue' : 'text-brand-deep-navy hover:bg-brand-off-white/50'}`}
                        onClick={() => {
                          setFormData({...formData, role: roleOption, referralCode: ''});
                          setIsRoleDropdownOpen(false);
                        }}
                      >
                        {roleOption}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conditional Code Field */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${formData.role === 'Senior Team Leader' ? 'max-h-12 opacity-100' : 'max-h-32 opacity-100'}`}>
                  {formData.role === 'Associate' && (
                    <div className="space-y-2 pt-2">
                      <label className="text-[11px] tracking-[0.1em] uppercase text-brand-charcoal font-medium">Team Leader Code (Optional)</label>
                      <input 
                        type="text" 
                        value={formData.referralCode}
                        onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                        className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3.5 rounded-lg focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors text-sm" 
                        placeholder="Enter Team Leader Code" 
                      />
                      <p className="text-xs text-brand-charcoal/60 mt-1.5 leading-relaxed">
                        Have a Team Leader Code? Enter it to join directly under that Team Leader. Leave it blank if you don't have one.
                      </p>
                    </div>
                  )}

                  {formData.role === 'Team Leader' && (
                    <div className="space-y-2 pt-2">
                      <label className="text-[11px] tracking-[0.1em] uppercase text-brand-charcoal font-medium">Senior Team Leader Code (Optional)</label>
                      <input 
                        type="text" 
                        value={formData.referralCode}
                        onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                        className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3.5 rounded-lg focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors text-sm" 
                        placeholder="Enter Senior Team Leader Code" 
                      />
                      <p className="text-xs text-brand-charcoal/60 mt-1.5 leading-relaxed">
                        Have a Senior Team Leader Code? Enter it to join directly under that Senior Team Leader. Leave it blank if you don't have one.
                      </p>
                    </div>
                  )}

                  {formData.role === 'Senior Team Leader' && (
                    <div className="pt-2">
                      <p className="text-xs text-brand-charcoal/60 italic">
                        No referral code is required for Senior Team Leader applications.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] tracking-[0.1em] uppercase text-brand-charcoal font-medium">Message (Optional)</label>
                  <textarea 
                    rows={4} 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3.5 rounded-lg focus:outline-none focus:border-brand-architectural-blue focus:bg-white transition-colors resize-none text-sm leading-relaxed" 
                    placeholder="Tell us about your background, experience, or why you'd like to join KHU Developers..."
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full mt-6 px-8 py-4 bg-brand-deep-navy text-white text-[13px] tracking-widest uppercase font-medium rounded-lg shadow-sm hover:bg-brand-architectural-blue hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {status === 'loading' ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
