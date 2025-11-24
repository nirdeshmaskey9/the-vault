
import React from 'react';
import { Card, Button } from './UIComponents';

interface ResourcesViewProps {
  onTriggerSimulation: (topic: string) => void;
}

const RESOURCES = [
  { id: 'compound', title: 'Compound Interest', desc: 'See how your money grows over time.', icon: '📈' },
  { id: 'snowball', title: 'Debt Snowball vs Avalanche', desc: 'Visualize payoff strategies.', icon: '⛄' },
  { id: 'inflation', title: 'Inflation Simulator', desc: 'Understand purchasing power loss.', icon: '🎈' },
  { id: 'mortgage', title: 'Rent vs Buy', desc: 'Compare long term housing costs.', icon: '🏠' },
  { id: 'fire', title: 'FIRE Calculator', desc: 'Financial Independence Retire Early.', icon: '🔥' },
  { id: 'crypto', title: 'Market Volatility', desc: 'Simulate risk in volatile markets.', icon: '📉' }
];

export const ResourcesView: React.FC<ResourcesViewProps> = ({ onTriggerSimulation }) => {
  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
       <div>
          <h2 className="text-2xl font-bold text-white">Financial Knowledge Base</h2>
          <p className="text-slate-400 text-sm">Interactive tools to sharpen your financial IQ.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCES.map(res => (
             <Card key={res.id} className="group hover:bg-slate-800 transition-all cursor-pointer border hover:border-violet-500/50">
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {res.icon}
                   </div>
                   <div>
                      <h3 className="font-bold text-white group-hover:text-violet-300">{res.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{res.desc}</p>
                   </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                   <Button 
                     onClick={() => onTriggerSimulation(res.title)} 
                     variant="secondary" 
                     className="w-full text-sm"
                   >
                     Launch Simulation
                   </Button>
                </div>
             </Card>
          ))}
       </div>

       <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-slate-900 border border-emerald-500/20">
          <h3 className="text-xl font-bold text-emerald-400 mb-2">Did you know?</h3>
          <p className="text-gray-300">
             The S&P 500 has historically returned about 10% annually before inflation. 
             Use the Compound Interest tool to see how investing $500/mo can make you a millionaire in 30 years.
          </p>
       </div>
    </div>
  );
};
