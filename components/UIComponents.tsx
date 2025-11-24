
import React, { useEffect, useState } from 'react';

// --- PRIMITIVES ---

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; actions?: React.ReactNode }> = ({ children, className = '', title, actions }) => (
  <div className={`glass-panel rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-t border-white/10 ${className}`}>
    <div className="flex justify-between items-start mb-4">
      {title && <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">{title}</h3>}
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

export const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'; 
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', className = '', type="button", disabled=false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/30",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm",
    danger: "bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-500/20 backdrop-blur-sm",
    success: "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/20 backdrop-blur-sm",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5",
  };

  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' }> = ({ children, color = 'blue' }) => {
  const colors = {
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    red: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    yellow: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    purple: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

export const ProgressBar: React.FC<{ value: number; max: number; colorClass?: string; height?: string }> = ({ value, max, colorClass = "bg-violet-500", height = "h-2" }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${height} border border-white/5`}>
      <div 
        className={`h-full transition-all duration-1000 ease-out ${colorClass} shadow-[0_0_10px_currentColor]`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export const Toast: React.FC<{ message: string; type?: 'success' | 'info'; onClose: () => void }> = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 right-6 z-[100] animate-[slideIn_0.3s_ease-out]">
      <div className={`glass-panel px-6 py-4 rounded-xl border-l-4 ${type === 'success' ? 'border-l-emerald-500' : 'border-l-violet-500'} flex items-center gap-3 shadow-2xl`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'}`}>
          {type === 'success' ? '✓' : 'ℹ'}
        </div>
        <div>
          <h4 className="font-bold text-white">{type === 'success' ? 'Success!' : 'Update'}</h4>
          <p className="text-sm text-gray-300">{message}</p>
        </div>
      </div>
    </div>
  );
};

// --- FORM ELEMENTS ---

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = "", ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
    <input 
      className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all placeholder-gray-600 ${className}`} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: {value: string | number, label: string}[] }> = ({ label, options, className = "", ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
    <select 
      className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all appearance-none ${className}`} 
      {...props}
    >
      {options.map((opt, i) => (
        <option key={i} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
      ))}
    </select>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      setTimeout(() => setVisible(false), 300);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative bg-slate-900/90 border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h3 className="text-xl font-bold text-white neon-text">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
