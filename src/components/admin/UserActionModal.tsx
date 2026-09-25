import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatUser } from '../../utils/formatUser';
import { useAuth } from '../../context/AuthContext';

type ActionType = 'VIEW' | 'EDIT' | 'SUSPEND' | 'REVIVE' | null;

interface UserActionModalProps {
  user: any;
  action: ActionType;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserActionModal({ user, action, onClose, onSuccess }: UserActionModalProps) {
  const { profile: adminProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Edit form state
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    mobile: user.mobile || '',
    city: user.city || '',
    address: user.address || ''
  });

  const handleUpdateStatus = async (newStatus: 'SUSPENDED' | 'ACTIVE') => {
    setLoading(true);
    setError('');
    
    // Prevent admin from suspending themselves
    if (user.id === adminProfile?.id && newStatus === 'SUSPENDED') {
      setError('You cannot suspend your own admin account.');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Audit log
      await supabase.from('audit_logs').insert({
        actor_user_id: adminProfile?.id,
        action: newStatus === 'SUSPENDED' ? 'ADMIN_SUSPENDED_USER' : 'ADMIN_REVIVED_USER',
        module: 'USER_MANAGEMENT',
        entity_id: user.id,
        metadata: { target_code: user.user_code }
      });
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError('Unable to update account status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          mobile: formData.mobile,
          city: formData.city,
          address: formData.address
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_user_id: adminProfile?.id,
        action: 'ADMIN_UPDATED_USER',
        module: 'USER_MANAGEMENT',
        entity_id: user.id,
        metadata: { target_code: user.user_code }
      });

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError('Unable to update account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!action) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 transition-opacity">
      <div className="bg-white w-full max-w-2xl p-6 md:p-8 rounded-lg shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">X</button>
        
        {/* VIEW */}
        {action === 'VIEW' && (
          <div>
            <h3 className="text-xl font-serif text-brand-deep-navy mb-1">{formatUser(user.user_code, user.full_name)}</h3>
            <div className="text-sm tracking-widest uppercase font-bold text-brand-charcoal/50 mb-6">{user.role.replace('_', ' ')}</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-1">Email</label>
                <div className="font-medium text-brand-charcoal">{user.email || 'Not available'}</div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-1">Mobile</label>
                <div className="font-medium text-brand-charcoal">{user.mobile || 'Not available'}</div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-1">Status</label>
                <div className="font-medium text-brand-charcoal">{user.status}</div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-1">Joined Date</label>
                <div className="font-medium text-brand-charcoal">
                  {user.joining_date && user.joining_date !== '1970-01-01' ? new Date(user.joining_date).toLocaleDateString() : 'Not available'}
                </div>
              </div>
            </div>
            
            <div className="bg-brand-off-white p-4 rounded border border-brand-soft-grey mt-6">
              <h4 className="text-sm font-bold tracking-widest uppercase text-brand-deep-navy mb-4">Hierarchy</h4>
              <div className="space-y-3 font-medium text-sm">
                <div className="text-brand-charcoal/70">ADMIN001 — System Admin</div>
                
                {(user.role === 'TEAM_LEADER' || user.role === 'ASSOCIATE') && user.parent && (
                  <div className="pl-4 border-l-2 border-brand-architectural-blue">
                    ↓ {formatUser(user.parent.user_code, user.parent.full_name)}
                  </div>
                )}
                
                {user.role === 'ASSOCIATE' && user.parent?.parent && (
                  <div className="pl-4 border-l-2 border-brand-architectural-blue">
                    ↓ {formatUser(user.parent.parent.user_code, user.parent.parent.full_name)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EDIT */}
        {action === 'EDIT' && (
          <div>
            <h3 className="text-xl font-serif text-brand-deep-navy mb-4">Edit User</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-200 rounded">{error}</div>}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">User Code</label>
                  <input type="text" value={user.user_code} disabled className="w-full border border-gray-200 bg-gray-50 text-gray-500 p-2 text-sm rounded cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Role</label>
                  <input type="text" value={user.role} disabled className="w-full border border-gray-200 bg-gray-50 text-gray-500 p-2 text-sm rounded cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Full Name</label>
                  <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border border-gray-300 p-2 text-sm rounded focus:border-brand-architectural-blue focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Mobile</label>
                  <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full border border-gray-300 p-2 text-sm rounded focus:border-brand-architectural-blue focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Auth Email (Read-Only via generic edit)</label>
                  <input type="email" value={user.email} disabled className="w-full border border-gray-200 bg-gray-50 text-gray-500 p-2 text-sm rounded cursor-not-allowed" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-brand-charcoal mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 p-2 text-sm rounded focus:border-brand-architectural-blue focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand-deep-navy text-white p-3 text-sm font-bold tracking-widest uppercase hover:bg-brand-architectural-blue mt-4 transition-colors">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* SUSPEND */}
        {action === 'SUSPEND' && (
          <div>
            <h3 className="text-xl font-serif text-brand-deep-navy mb-4">Suspend {user.full_name}?</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-200 rounded">{error}</div>}
            <div className="text-brand-charcoal/80 mb-6 font-medium bg-red-50 p-4 border border-red-100 rounded">
              {formatUser(user.user_code, user.full_name)}<br/><br/>
              This account will remain in the system, but the user will no longer be able to access the portal until the account is revived.
            </div>
            <div className="flex gap-4">
              <button onClick={onClose} className="flex-1 border border-brand-charcoal/20 text-brand-charcoal p-3 font-bold text-sm tracking-widest uppercase hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleUpdateStatus('SUSPENDED')} disabled={loading} className="flex-1 bg-red-600 text-white p-3 font-bold text-sm tracking-widest uppercase hover:bg-red-700">
                {loading ? 'Processing...' : 'Suspend Account'}
              </button>
            </div>
          </div>
        )}

        {/* REVIVE */}
        {action === 'REVIVE' && (
          <div>
            <h3 className="text-xl font-serif text-brand-deep-navy mb-4">Revive {user.full_name}?</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-200 rounded">{error}</div>}
            <div className="text-brand-charcoal/80 mb-6 font-medium bg-green-50 p-4 border border-green-100 rounded">
              {formatUser(user.user_code, user.full_name)}<br/><br/>
              This will restore the user's portal access while keeping their existing account, code, hierarchy and historical records.
            </div>
            <div className="flex gap-4">
              <button onClick={onClose} className="flex-1 border border-brand-charcoal/20 text-brand-charcoal p-3 font-bold text-sm tracking-widest uppercase hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleUpdateStatus('ACTIVE')} disabled={loading} className="flex-1 bg-brand-deep-navy text-white p-3 font-bold text-sm tracking-widest uppercase hover:bg-brand-architectural-blue">
                {loading ? 'Processing...' : 'Revive Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
