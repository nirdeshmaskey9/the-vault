
import React from 'react';
import { Account, Expense, Income, UserStats, AIInsight, ModalType, UserProfile } from '../types';
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
  profile: UserProfile | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ accounts, expenses, income, stats, insights, onOpenModal, profile }) => {
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balanceCents, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amountCents, 0);
  const totalIncome = income.reduce((acc, curr) => acc + curr.amountCents, 0);
  const netWorth = totalBalance; 

  const progressPercent = Math.min((stats.xp / stats.nextLevelXp) * 100, 100);

  // Filter recurring due soon
  const dueSoon = [
    ...expenses.filter(e => e.isRecurring && e.nextDueDate).map(e => ({...e, type: 'Bill'})),
    ...income.filter(i => i.isRecurring && i.nextDueDate).map(i => ({...i, type: 'Income'}))
  ].sort((a,b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime()).slice(0, 3);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Gamification Header - Warm Theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900 to-indigo-900 p-6 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
           {/* Abstract Shape */}
           <svg width="300" height="300" viewBox="0 0 100 100" fill="white">
             <circle cx="50" cy="50" r="40" />
           </svg>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wide border border-amber-500/30">
                 Level {stats.level}
               </span>
               <span className="text-rose-200 text-sm">{stats.title}</span>
            </div>
            <h1 className="text-3xl font-bold text-white neon-text">
              Welcome back, {profile?.name || 'Hunter'}
            </h1>
            <p className="text-rose-100/70 text-sm mt-1">
               {profile?.occupation ? `${profile.occupation} • ` : ''} 
               {stats.streakDays} Day Streak
            </p>
          </div>
          
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs text-rose-300 mb-1">
              <span>{stats.xp} XP</span>
              <span>{stats.nextLevelXp} XP</span>
            </div>
            <div className="h-2 bg-rose-950 rounded-full overflow-hidden border border-rose-500/30">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gray-900 to-slate-900">
          <p className="text-slate-400 text-sm">Net Worth</p>
          <h2 className="text-2xl font-bold text-white mt-1">{formatCurrency(netWorth)}</h2>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
             <span>Live Estimate</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-gray-900 to-slate-900">
           <p className="text-slate-400 text-sm">Income (Mo)</p>
           <h2 className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalIncome)}</h2>
        </Card>
        <Card className="bg-gradient-to-br from-gray-900 to-slate-900">
           <p className="text-slate-400 text-sm">Expenses (Mo)</p>
           <h2 className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalExpenses)}</h2>
        </Card>
        <Card className="bg-gradient-to-br from-gray-900 to-slate-900">
           <p className="text-slate-400 text-sm">Savings Rate</p>
           <h2 className="text-2xl font-bold text-amber-400 mt-1">
             {totalIncome > 0 ? (( (totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
           </h2>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 overflow-x-auto pb-2">
         <Button onClick={() => onOpenModal(ModalType.ADD_EXPENSE)} className="whitespace-nowrap bg-rose-600 hover:bg-rose-500">
           + Add Expense
         </Button>
         <Button onClick={() => onOpenModal(ModalType.ADD_INCOME)} className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-500">
           + Add Income
         </Button>
         <Button onClick={() => onOpenModal(ModalType.ADD_GOAL)} className="whitespace-nowrap bg-amber-600 hover:bg-amber-500">
           + Set Goal
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card title="Spending Trend (30 Days)" className="h-[350px]">
             <ExpenseTrendChart expenses={expenses} />
           </Card>
           
           {/* Recurring Due Soon Widget */}
           <Card title="Upcoming Recurring Payments">
              {dueSoon.length === 0 ? <p className="text-sm text-gray-500">No recurring items due soon.</p> : (
                  <div className="space-y-3">
                      {dueSoon.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${item.type === 'Bill' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                  <div>
                                      <p className="text-sm font-bold text-white">{item.notes}</p>
                                      <p className="text-xs text-gray-400">Due: {item.nextDueDate}</p>
                                  </div>
                              </div>
                              <span className={item.type === 'Bill' ? 'text-rose-400' : 'text-emerald-400'}>
                                  {formatCurrency(item.amountCents)}
                              </span>
                          </div>
                      ))}
                      <Button variant="ghost" className="w-full text-xs" onClick={() => { /* Should navigate to Calendar */ }}>
                        View Calendar
                      </Button>
                  </div>
              )}
           </Card>
        </div>

        <div className="space-y-6">
           <Card title="Category Breakdown">
             <CategoryPieChart expenses={expenses} />
           </Card>

           <Card title="Vault Insights" className="bg-gradient-to-b from-rose-900/40 to-slate-900/40 border-rose-500/20">
             <div className="space-y-3">
               {insights.map(insight => (
                 <div key={insight.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-3 items-start hover:bg-white/10 transition-colors cursor-pointer">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      insight.type === 'warning' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                      insight.type === 'tip' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                      'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-200 leading-tight">{insight.message}</p>
                    </div>
                 </div>
               ))}
               <Button variant="secondary" className="w-full text-xs" onClick={() => onOpenModal(ModalType.SETTINGS)}>
                 Generate New Report
               </Button>
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
