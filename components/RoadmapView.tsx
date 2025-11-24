
import React from 'react';
import { Account, Debt } from '../types';
import { FINANCIAL_RANKS, formatCurrency } from '../constants';
import { Card, ProgressBar } from './UIComponents';

interface RoadmapViewProps {
  accounts: Account[];
  debts: Debt[];
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ accounts, debts }) => {
  const totalAssets = accounts.reduce((acc, a) => acc + a.balanceCents, 0);
  const totalLiabilities = debts.reduce((acc, d) => acc + d.remainingBalanceCents, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Find current rank
  let currentRankIndex = FINANCIAL_RANKS.findIndex(r => r.minNetWorth > netWorth) - 1;
  if (currentRankIndex < 0) currentRankIndex = FINANCIAL_RANKS.length - 1; // Handle Max
  // Fix for negative/low values finding index -1 if net worth is super low, default to 0
  if (netWorth < FINANCIAL_RANKS[0].minNetWorth) currentRankIndex = 0;
  
  // Actually, simplified find logic:
  const activeRank = FINANCIAL_RANKS.slice().reverse().find(r => netWorth >= r.minNetWorth) || FINANCIAL_RANKS[0];
  const activeIndex = FINANCIAL_RANKS.indexOf(activeRank);
  const nextRank = FINANCIAL_RANKS[activeIndex + 1];

  const progressToNext = nextRank 
    ? ((netWorth - activeRank.minNetWorth) / (nextRank.minNetWorth - activeRank.minNetWorth)) * 100
    : 100;

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
       <div className="text-center space-y-2">
          <h2 className="text-4xl font-black neon-text text-white">ROADMAP TO EMPIRE</h2>
          <p className="text-gray-400">Your journey from zero to financial legend.</p>
       </div>

       {/* Current Status Hero */}
       <div className="relative p-8 rounded-3xl bg-gradient-to-r from-violet-900 to-indigo-900 border border-violet-500/30 overflow-hidden text-center shadow-[0_0_50px_rgba(139,92,246,0.2)]">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10">
             <div className="text-6xl mb-4 animate-[float_4s_ease-in-out_infinite]">{activeRank.icon}</div>
             <h3 className="text-2xl font-bold text-violet-200 uppercase tracking-widest mb-1">Current Rank</h3>
             <h1 className="text-5xl md:text-6xl font-black text-white mb-6">{activeRank.title}</h1>
             
             <div className="max-w-2xl mx-auto bg-black/40 rounded-xl p-6 backdrop-blur-md border border-white/10">
                <div className="flex justify-between text-sm mb-2 font-mono">
                   <span className="text-gray-400">Net Worth: {formatCurrency(netWorth)}</span>
                   <span className="text-emerald-400">Next: {nextRank ? formatCurrency(nextRank.minNetWorth) : 'MAX LEVEL'}</span>
                </div>
                <ProgressBar value={Math.max(0, progressToNext)} max={100} height="h-4" colorClass="bg-gradient-to-r from-emerald-400 to-cyan-400" />
                <p className="mt-4 text-indigo-200 text-sm">Perk Unlocked: <span className="font-bold text-white">{activeRank.perks}</span></p>
             </div>
          </div>
       </div>

       {/* The Ladder */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {FINANCIAL_RANKS.map((rank, i) => {
             const isUnlocked = i <= activeIndex;
             const isNext = i === activeIndex + 1;
             
             return (
               <Card key={i} className={`relative flex flex-col items-center justify-center p-4 text-center transition-all duration-300 ${
                  isUnlocked ? 'bg-slate-800 border-emerald-500/30' : 
                  isNext ? 'bg-slate-900 border-violet-500/50 scale-105 shadow-xl' : 'opacity-50 grayscale'
               }`}>
                  <div className="text-3xl mb-2">{rank.icon}</div>
                  <h4 className={`font-bold text-sm ${isUnlocked ? 'text-emerald-400' : 'text-gray-400'}`}>{rank.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(rank.minNetWorth)}</p>
                  {isUnlocked && <div className="absolute top-2 right-2 text-emerald-500 text-xs">✓</div>}
                  {isNext && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] px-2 py-0.5 rounded-full">NEXT GOAL</div>}
               </Card>
             );
          })}
       </div>
    </div>
  );
};
