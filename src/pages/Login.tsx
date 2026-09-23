import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Temporary frontend mock until backend DB is connected
      if (email === 'admin@khuestate.com' && password === 'admin123') {
        login('mock-jwt-token', {
          id: '1',
          userCode: 'ADMIN001',
          role: 'ADMIN',
          fullName: 'System Admin',
          email: 'admin@khuestate.com'
        });
        navigate('/admin');
        return;
      }
      
      // Real API call (will fail if backend is down)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      
      // Redirect based on role
      switch (data.user.role) {
        case 'ADMIN': navigate('/admin'); break;
        case 'SENIOR_TL': navigate('/senior-team-leader'); break;
        case 'TEAM_LEADER': navigate('/team-leader'); break;
        case 'ASSOCIATE': navigate('/associate'); break;
        default: navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-brand-warm-white flex items-center justify-center p-6 pt-24">
      <div className="bg-white p-8 md:p-12 shadow-sm border-t-4 border-brand-primary w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-brand-deep-navy mb-2">Portal Login</h1>
          <p className="text-sm text-brand-charcoal/60 font-light">Enter your credentials to access your dashboard.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 text-sm rounded mb-6 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs tracking-[0.1em] uppercase text-brand-charcoal font-medium flex justify-between">
              <span>Password</span>
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-brand-soft-grey bg-brand-off-white px-4 py-3 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors" 
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-8 py-4 bg-brand-primary text-white text-sm tracking-widest uppercase font-medium hover:bg-brand-deep-navy transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-xs text-brand-charcoal/50">For demo purposes use:<br/>admin@khuestate.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
