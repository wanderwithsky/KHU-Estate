import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Camera, X, Check, Plus } from 'lucide-react';
import VisitSpreadsheet from '../../components/VisitSpreadsheet';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function UserVisits() {
  const { profile } = useCurrentUser();
  const [scheduledRecords, setScheduledRecords] = useState<any[]>([]);
  const [completedRecords, setCompletedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Summary Stats
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    pending: 0
  });

  // Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentVisit, setCurrentVisit] = useState<any>(null);
  const [isNewVisit, setIsNewVisit] = useState(false);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    meet_time: '',
    remarks: '',
    date: new Date().toISOString().split('T')[0],
    status: 'COMPLETED'
  });
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Camera access was denied or unavailable.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelfiePreview(dataUrl);
        
        // Convert to File
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelfieFile(file);
          }
        }, 'image/jpeg', 0.8);
        
        stopCamera();
        setIsCameraOpen(false);
      }
    }
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Find where assigned or where user is associate/tl/stl
      const res = await supabase
        .from('site_visits')
        .select(`
          *,
          user_profiles:assigned_user_id(user_code, full_name, role)
        `)
        .order('visit_date', { ascending: false })
        .order('visit_time', { ascending: false });

      if (res.error) throw res.error;

      const scheduled = res.data.filter(r => ['SCHEDULED', 'RESCHEDULED', 'NO_SHOW'].includes(r.status));
      const completed = res.data.filter(r => ['COMPLETED', 'CANCELLED'].includes(r.status));
      
      setScheduledRecords(scheduled);
      setCompletedRecords(completed);
      
      // Compute stats
      setStats({
        upcoming: scheduled.length,
        completed: completed.filter(r => r.status === 'COMPLETED').length,
        pending: scheduled.filter(r => r.status === 'SCHEDULED' || r.status === 'RESCHEDULED').length
      });
      
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = (visit: any = null) => {
    setError('');
    setSuccess('');
    setSelfieFile(null);
    setSelfiePreview('');
    
    if (visit) {
      setCurrentVisit(visit);
      setIsNewVisit(false);
      setFormData({
        customer_name: visit.customer_name || '',
        phone: visit.phone || '',
        meet_time: visit.visit_time || '',
        remarks: visit.remarks || '',
        date: visit.visit_date || new Date().toISOString().split('T')[0],
        status: visit.status || 'COMPLETED'
      });
    } else {
      setCurrentVisit(null);
      setIsNewVisit(true);
      const now = new Date();
      setFormData({
        customer_name: '',
        phone: '',
        meet_time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        remarks: '',
        date: new Date().toISOString().split('T')[0],
        status: 'COMPLETED'
      });
    }
    setIsReportModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadSelfie = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('visit-selfies')
      .upload(fileName, file);
      
    if (error) throw error;
    return data.path;
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (!formData.customer_name || !formData.phone || !formData.meet_time) {
        throw new Error('Please fill all required fields.');
      }
      
      if (!selfieFile && !currentVisit?.selfie_url) {
        throw new Error('Selfie is required to submit a visit report.');
      }

      let selfiePath = currentVisit?.selfie_url;
      if (selfieFile) {
        selfiePath = await uploadSelfie(selfieFile);
      }

      const payload = {
        customer_name: formData.customer_name,
        phone: formData.phone,
        visit_time: formData.meet_time,
        remarks: formData.remarks,
        selfie_url: selfiePath,
        status: formData.status || 'COMPLETED',
        assigned_user_id: profile?.id
      };
      
      let res;
      if (isNewVisit || !currentVisit) {
        if (!formData.date) throw new Error('Date is required for a new visit.');
        res = await supabase.from('site_visits').insert({
          ...payload,
          visit_date: formData.date,
          created_by: profile?.id
        }).select().single();
      } else {
        res = await supabase.from('site_visits')
          .update(payload)
          .eq('id', currentVisit.id)
          .select().single();
      }
      
      if (res.error) throw res.error;

      // Audit Log
      await supabase.from('audit_logs').insert({
        action: 'USER_SUBMITTED_VISIT_REPORT',
        module: 'VISIT',
        actor_user_id: profile?.id,
        entity_id: res.data.id,
        entity_type: 'SITE_VISIT',
        new_data: { 
          admin_code: profile?.user_code,
          admin_name: profile?.full_name 
        }
      });

      setSuccess('Visit report submitted successfully.');
      setTimeout(() => {
        setIsReportModalOpen(false);
        fetchData();
      }, 1500);
      
    } catch (err: any) {
      console.error('Submit report error:', err);
      setError(err.message || 'Unable to submit visit report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-8 pb-10">
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-brand-soft-grey shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1">Upcoming Visits</p>
          <p className="text-3xl font-serif text-brand-deep-navy">{stats.upcoming}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-brand-soft-grey shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1">Pending Reports</p>
          <p className="text-3xl font-serif text-orange-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-brand-soft-grey shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-1">Completed Visits</p>
          <p className="text-3xl font-serif text-green-700">{stats.completed}</p>
        </div>
      </div>

      {/* MY VISITS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif text-brand-deep-navy">My Visits</h2>
        </div>
        <p className="text-sm text-brand-charcoal/60">Visits scheduled for you by Admin.</p>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-20 bg-gray-100 rounded w-full"></div>
          </div>
        ) : (
          <VisitSpreadsheet 
            records={scheduledRecords}
            type="MY_VISITS"
            onEdit={handleOpenReport}
            onView={(record) => {
              setCurrentVisit(record);
              setIsViewModalOpen(true);
            }}
          />
        )}
      </div>

      <hr className="border-brand-soft-grey" />

      {/* COMPLETED VISITS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif text-brand-deep-navy">Visits (History)</h2>
            <p className="text-sm text-brand-charcoal/60 mt-1">Your submitted visit reports.</p>
          </div>
          <button 
            onClick={() => handleOpenReport()}
            className="flex items-center gap-1.5 text-xs bg-brand-deep-navy text-white px-4 py-2 rounded font-medium hover:bg-brand-deep-navy/90 transition-colors shadow-sm"
          >
            <Plus size={14} />
            Create Visit
          </button>
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-20 bg-gray-100 rounded w-full"></div>
          </div>
        ) : (
          <VisitSpreadsheet 
            records={completedRecords}
            type="HISTORY"
            onView={(record) => {
              setCurrentVisit(record);
              setIsViewModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Visit Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto border border-brand-soft-grey max-h-[95vh]">
            <div className="sticky top-0 bg-brand-deep-navy px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-serif text-white">
                Submit Visit Report
              </h2>
              <button 
                onClick={() => {
                  setIsReportModalOpen(false);
                  stopCamera();
                }}
                className="text-white/70 hover:text-white transition-colors"
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitReport} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm flex items-center gap-2">
                  <Check size={16} />
                  {success}
                </div>
              )}
              
              <div className="bg-brand-primary/5 p-3 rounded border border-brand-soft-grey flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-brand-deep-navy text-white flex items-center justify-center font-medium">
                  {profile.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Submitting As</p>
                  <p className="font-medium text-brand-deep-navy">{profile.user_code} — {profile.full_name}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Customer Name *</label>
                  <input 
                    type="text" 
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    required
                    className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold outline-none text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Phone *</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold outline-none text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Selfie *</label>
                  <div className="border-2 border-dashed border-brand-soft-grey rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                    {selfiePreview || (currentVisit && currentVisit.selfie_url) ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={selfiePreview || `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/visit-selfies/${currentVisit.selfie_url}`} 
                          alt="Preview" 
                          className="max-h-48 rounded shadow-sm mb-3" 
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={startCamera} className="text-xs bg-brand-deep-navy text-white px-3 py-1.5 rounded font-medium">Retake Photo</button>
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-brand-charcoal border border-brand-soft-grey bg-white px-3 py-1.5 rounded font-medium">Upload File</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Camera size={32} className="text-brand-charcoal/40 mb-3" />
                        <div className="flex gap-3 mt-2">
                          <button type="button" onClick={startCamera} className="text-xs bg-brand-deep-navy text-white px-4 py-2 rounded font-medium shadow-sm">Take Selfie</button>
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-white text-brand-charcoal border border-brand-soft-grey px-4 py-2 rounded font-medium">Upload</button>
                        </div>
                        <p className="text-xs text-brand-charcoal/60 mt-3">Live camera preferred. Fallback to upload.</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
                
                {isNewVisit && (
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Date *</label>
                    <input 
                      type="date" 
                      required
                      className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold outline-none text-sm bg-white"
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setFormData(prev => ({...prev, date: newDate}));
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Status *</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold outline-none text-sm bg-white"
                    required
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="NO_SHOW">No Show</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Meet Time *</label>
                  <input 
                    type="time" 
                    value={formData.meet_time}
                    onChange={(e) => setFormData({...formData, meet_time: e.target.value})}
                    required
                    className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold outline-none text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal/70 uppercase tracking-wider mb-2">Remarks</label>
                  <textarea 
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    rows={3}
                    className="w-full p-3 border border-brand-soft-grey rounded focus:ring-2 focus:ring-brand-gold outline-none text-sm resize-none"
                    placeholder="Enter visit observations..."
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-brand-soft-grey">
                <button 
                  type="button"
                  onClick={() => {
                    setIsReportModalOpen(false);
                    stopCamera();
                  }}
                  className="px-4 py-2 text-brand-charcoal font-medium hover:bg-gray-100 rounded transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting || success !== ''}
                  className="px-4 py-2 bg-brand-gold text-white rounded text-sm font-medium hover:bg-brand-gold/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Visit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {isViewModalOpen && currentVisit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-y-auto border border-brand-soft-grey max-h-[95vh]">
            <div className="sticky top-0 bg-brand-deep-navy px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-serif text-white">
                Visit Details
              </h2>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Customer</p>
                  <p className="font-medium text-brand-deep-navy">{currentVisit.customer_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Phone</p>
                  <p className="font-medium text-brand-deep-navy">{currentVisit.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Date</p>
                  <p className="font-medium text-brand-deep-navy">{currentVisit.visit_date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Time / Meet Time</p>
                  <p className="font-medium text-brand-deep-navy">{currentVisit.visit_time || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Location</p>
                  <p className="font-medium text-brand-deep-navy">{currentVisit.location || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Project</p>
                  <p className="font-medium text-brand-deep-navy">{currentVisit.project_name || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Status</p>
                  <p className="font-medium text-brand-deep-navy">{currentVisit.status}</p>
                </div>
              </div>
              
              {currentVisit.selfie_url && (
                <div className="border-t border-brand-soft-grey pt-4">
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 mb-2">Selfie</p>
                  <img 
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/visit-selfies/${currentVisit.selfie_url}`} 
                    alt="Selfie" 
                    className="max-h-64 rounded shadow-sm border border-brand-soft-grey"
                  />
                </div>
              )}
              
              <div className="border-t border-brand-soft-grey pt-4">
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60">Remarks</p>
                <p className="font-medium text-brand-deep-navy bg-gray-50 p-3 rounded border border-brand-soft-grey mt-1">
                  {currentVisit.remarks || 'No remarks provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black text-white">
            <h3 className="font-medium text-lg">Take Selfie</h3>
            <button onClick={closeCamera} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            {cameraError ? (
              <div className="text-center p-6 bg-white/10 rounded-lg max-w-sm mx-4">
                <p className="text-white mb-4">{cameraError}</p>
                <button 
                  onClick={closeCamera}
                  className="bg-white text-black px-6 py-2 rounded font-medium w-full"
                >
                  Close & Use Upload
                </button>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="min-w-full min-h-full object-cover"
              />
            )}
          </div>
          
          <div className="h-32 bg-black flex items-center justify-center pb-6">
            {!cameraError && (
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white/50 bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-white border border-gray-200"></div>
              </button>
            )}
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
