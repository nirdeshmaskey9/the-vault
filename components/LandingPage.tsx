
import React, { useState } from 'react';
import { Button, Input } from './UIComponents';

interface LandingPageProps {
  onLogin: (userId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
        onLogin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black z-0"></div>
      
      <div className="relative z-10 text-center max-w-md w-full px-6">
        <div className="mb-8 inline-block animate-[float_6s_ease-in-out_infinite]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 shadow-[0_0_50px_rgba(139,92,246,0.5)] flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-200 to-indigo-400 tracking-tight neon-text">
          THE VAULT
        </h1>
        <p className="text-gray-400 mb-8">Secure. Intelligent. Personal.</p>

        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl space-y-4">
             <div className="text-left">
                <Input 
                    label="Access Key / Username"
                    placeholder="Enter a unique ID (e.g. Hunter)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="text-center"
                />
             </div>
             <Button type="submit" className="w-full py-3 text-lg">Enter Vault</Button>
             <p className="text-xs text-gray-500 mt-4">
                Data is stored locally on this device using this ID.
             </p>
        </form>
      </div>
    </div>
  );
};
