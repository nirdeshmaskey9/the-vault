
import React, { useState, useEffect } from 'react';
import { Button, Input } from './UIComponents';
import { loginUser, registerUser, loginWithGoogle } from '../services/authService';
import { isFirebaseConfigured } from '../services/firebaseConfig';

interface LandingPageProps {
  onLogin: (userId: string, userName?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(isFirebaseConfigured());
  }, []);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
    }

    if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
    }

    if (isRegistering) {
        if (!name) { setError("Name is required for registration."); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
        
        const res = await registerUser(email, password, name);
        if (res.success && res.user) {
            onLogin(res.user.uid, res.user.displayName || name);
        } else {
            setError(res.message || "Registration failed.");
        }
    } else {
        const res = await loginUser(email, password);
        if (res.success && res.user) {
            onLogin(res.user.uid, res.user.displayName || email.split('@')[0]);
        } else {
            setError(res.message || "Login failed.");
        }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const res = await loginWithGoogle();
    if (res.success && res.user) {
        onLogin(res.user.uid, res.user.displayName || 'Guest User');
    } else {
        setError(res.message || "Google Sign-In failed.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-black to-black z-0"></div>
      
      {/* Connection Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md z-50">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500 animate-pulse'}`}></div>
        <span className="text-xs font-mono text-gray-300">
            {isConnected ? 'FIREBASE CONNECTED' : 'LOCAL SIMULATION'}
        </span>
      </div>

      <div className="relative z-10 text-center max-w-md w-full px-6">
        <div className="mb-8 inline-block animate-[float_6s_ease-in-out_infinite]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 shadow-[0_0_50px_rgba(244,63,94,0.5)] flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-rose-100 via-rose-200 to-amber-200 tracking-tight neon-text">
          THE VAULT
        </h1>
        <p className="text-rose-200/60 mb-8">Secure. Intelligent. Personal.</p>

        <div className="glass-panel p-8 rounded-2xl space-y-6 animate-[fadeIn_0.5s_ease-out] shadow-2xl shadow-rose-900/20">
             
             <div className="flex bg-white/5 rounded-lg p-1 mb-4">
                <button 
                    type="button" 
                    onClick={() => { setIsRegistering(false); setError(''); }} 
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isRegistering ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Login
                </button>
                <button 
                    type="button" 
                    onClick={() => { setIsRegistering(true); setError(''); }} 
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isRegistering ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Register
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {isRegistering && (
                    <Input 
                        label="Full Name"
                        placeholder="e.g. Hunter"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={isRegistering}
                    />
                )}
                <Input 
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input 
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <p className="text-rose-400 text-sm text-center bg-rose-900/20 py-2 rounded border border-rose-500/20">{error}</p>}

                <Button type="submit" className="w-full py-3 text-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500" disabled={loading}>
                    {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Access Vault')}
                </Button>
             </form>

             <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-black/50 text-gray-500">Or continue with</span></div>
             </div>

             <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
                disabled={loading}
             >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
             </button>
        </div>
        
        <p className="text-xs text-gray-600 mt-6 max-w-xs mx-auto">
            {!isConnected ? 
                "⚠️ Running in LOCAL MODE. Data is only saved to this browser. Add Firebase keys to services/firebaseConfig.ts to sync across devices." :
                "✅ Connected to Firebase. Your data is secure and synced."
            }
        </p>
      </div>
    </div>
  );
};
