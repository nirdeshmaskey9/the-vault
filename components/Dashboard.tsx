
import React from 'react';
import { Account, Expense, Income, UserStats, AIInsight, ModalType } from '../types';
import { Card, Badge, Button } from './UIComponents';
import { ExpenseTrendChart, CategoryPieChart } from './Charts';
import { formatCurrency, LEVEL_TITLES } from '../constants';

interface DashboardProps {
  accounts: Account[];
  expenses: Expense[];
  income: Income[];
  stats: UserStats;
  insights: AIInsight[];
  onOpenModal: (type: ModalType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ accounts, expenses, income, stats, insights, onOpenModal }) => {
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balanceCents, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amountCents, 0);
  const totalIncome = income.reduce((acc, curr) => acc + curr.amountCents, 0);
  const netWorth = totalBalance; // Simplified

  // Calculate Level Progress
  const progressPercent = Math.min((stats.xp / stats.nextLevelXp) * 100, 100);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Gamification Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 to-indigo-900 p-6 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-xs font-bold uppercase tracking-wide border border-yellow-500/30">
                 Level {stats.level}
               </span>
               <span className="text-gray-400 text-sm">{stats.title}</span>
            </div>
            <h1 className="text-3xl font-bold text-white neon-text">Welcome back, Hunter</h1>
            <p className="text-indigo-200 text-sm mt-1">You are on a {stats.streakDays} day financial streak!</p>
          </div>
          
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs text-indigo-300 mb-1">
              <span>{stats.xp} XP</span>
              <span>{stats.nextLevelXp} XP</span>
            </div>
            <div className="h-2 bg-indigo-950 rounded-full overflow-hidden border border-indigo-500/30">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
          <p className="text-slate-400 text-sm">Net Worth</p>
          <h2 className="text-2xl font-bold text-white mt-1">{formatCurrency(netWorth)}</h2>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <span>↑ 2.5%</span> <span className="text-slate-500">vs last month</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
           <p className="text-slate-400 text-sm">Income (Mo)</p>
           <h2 className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalIncome)}</h2>
        </Card>
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
           <p className="text-slate-400 text-sm">Expenses (Mo)</p>
           <h2 className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalExpenses)}</h2>
        </Card>
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
           <p className="text-slate-400 text-sm">Savings Rate</p>
           <h2 className="text-2xl font-bold text-blue-400 mt-1">
             {totalIncome > 0 ? (( (totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
           </h2>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 overflow-x-auto pb-2">
         <Button onClick={() => onOpenModal(ModalType.ADD_EXPENSE)} className="whitespace-nowrap">
           + Add Expense
         </Button>
         <Button onClick={() => onOpenModal(ModalType.ADD_INCOME)} variant="success" className="whitespace-nowrap">
           + Add Income
         </Button>
         <Button onClick={() => onOpenModal(ModalType.ADD_GOAL)} variant="secondary" className="whitespace-nowrap">
           + Set Goal
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Card title="Spending Trend (30 Days)" className="h-full min-h-[350px]">
            <ExpenseTrendChart expenses={expenses} />
          </Card>
        </div>

        {/* Breakdown & AI */}
        <div className="space-y-6">
           <Card title="Category Breakdown">
             <CategoryPieChart expenses={expenses} />
           </Card>

           <Card title="AI Vault Insights" className="bg-gradient-to-b from-indigo-900/40 to-slate-900/40 border-indigo-500/20">
             <div className="space-y-3">
               {insights.map(insight => (
                 <div key={insight.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-3 items-start hover:bg-white/10 transition-colors cursor-pointer">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      insight.type === 'warning' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                      insight.type === 'tip' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' :
                      'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-200 leading-tight">{insight.message}</p>
                      {insight.impact && <p className="text-xs text-gray-400 mt-1 font-mono">{insight.impact}</p>}
                    </div>
                 </div>
               ))}
               <Button variant="secondary" className="w-full text-xs py-1.5 h-8 mt-2" onClick={() => onOpenModal(ModalType.SETTINGS)}>
                 Generate New Report
               </Button>
             </div>
           </Card>
        </div>
      </div>
      
      {/* Accounts Quick List */}
      <h3 className="text-xl font-bold text-white px-1">Your Accounts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div 
             key={acc.id} 
             onClick={() => {}} 
             className="group relative p-5 rounded-xl bg-slate-800/50 border border-white/5 hover:border-violet-500/50 hover:bg-slate-800 transition-all duration-300 cursor-pointer"
          >
             <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{acc.type}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
             </div>
             <h4 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">{acc.name}</h4>
             <p className={`text-2xl font-bold mt-1 ${acc.balanceCents < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
               {formatCurrency(acc.balanceCents)}
             </p>
             <div className="absolute inset-0 border border-violet-500/0 group-hover:border-violet-500/30 rounded-xl transition-all duration-300 pointer-events-none shadow-[0_0_0_0_rgba(139,92,246,0)] group-hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]"></div>
          </div>
        ))}
        {/* Add Account Card */}
        <div 
          onClick={() => onOpenModal(ModalType.ADD_ACCOUNT)}
          className="p-5 rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-violet-500 hover:bg-white/5 transition-all cursor-pointer min-h-[140px]"
        >
           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
           </div>
           <span className="font-medium">Add Account</span>
        </div>
      </div>
    </div>
  );
};
