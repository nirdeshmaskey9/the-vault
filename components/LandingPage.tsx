
import React from 'react';
import { Button } from './UIComponents';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  
  const handleLoginClick = async () => {
    // Check for AI Studio environment and handle API Key selection
    const aiStudio = (window as any).aistudio;
    
    if (aiStudio && aiStudio.openSelectKey) {
      try {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
          await aiStudio.openSelectKey();
        }
      } catch (e) {
        console.error("API Key selection error:", e);
      }
    }
    
    // Proceed to login (assume success or fallback to env key as per instructions)
    onLogin();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-20 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl px-6">
        <div className="mb-8 inline-block animate-[float_6s_ease-in-out_infinite]">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 shadow-[0_0_50px_rgba(139,92,246,0.5)] flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-200 to-indigo-400 tracking-tight neon-text">
          THE VAULT
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          The next generation of personal finance. <br/>
          <span className="text-violet-400">AI-Powered.</span> <span className="text-indigo-400">Gamified.</span> <span className="text-emerald-400">Secure.</span>
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <button 
                onClick={handleLoginClick}
                className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-105 transition-transform duration-200 flex items-center gap-3"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                <span>Continue with Google</span>
                <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-20"></div>
            </button>
            <button className="px-8 py-4 bg-transparent border border-white/20 text-white font-medium text-lg rounded-full hover:bg-white/10 transition-colors">
                View Demo
            </button>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-violet-400 mb-2">Vault Intelligence</h3>
                <p className="text-gray-400 text-sm">Powered by Gemini Pro. Speak naturally to your finances and get deep insights instantly.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-indigo-400 mb-2">Gamified Growth</h3>
                <p className="text-gray-400 text-sm">Earn XP for saving. Level up your financial status and unlock new visualization tools.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Total Control</h3>
                <p className="text-gray-400 text-sm">Connect banks via Plaid or manage manually. Track debts, savings, and investments in 3D.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
