
import React, { useState } from 'react';
import { Account, AccountType, Debt, SavingsGoal, Expense, Income, ModalType } from '../types';
import { Card, Button, Badge, ProgressBar } from './UIComponents';
import { DebtPaydownChart, SavingsProgressRadial } from './Charts';
import { formatCurrency } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- ACCOUNTS VIEW ---
export const AccountsView: React.FC<{ 
  accounts: Account[]; 
  expenses: Expense[];
  onOpenModal: (type: ModalType) => void;
}> = ({ accounts, expenses, onOpenModal }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredAccounts = filterType === 'ALL' 
    ? accounts 
    : accounts.filter(a => a.type === filterType);

  const getRecentTransactions = (accountId: number) => {
    return expenses
      .filter(e => e.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Accounts & Assets</h2>
          <p className="text-slate-400 text-sm">Manage your liquid and credit assets</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" onClick={() => onOpenModal(ModalType.CONNECT_BANK)}>Connect Bank (Plaid)</Button>
           <Button onClick={() => onOpenModal(ModalType.ADD_ACCOUNT)}>+ Add Account</Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['ALL', ...Object.values(AccountType)].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterType === type 
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAccounts.map(acc => (
          <Card key={acc.id} className="relative group hover:border-violet-500/50 transition-all bg-opacity-40">
            <div className="flex justify-between items-start mb-2">
              <Badge color={acc.type === 'CREDIT' ? 'red' : 'blue'}>{acc.type}</Badge>
              <button className="text-gray-500 hover:text-white transition-colors">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            </div>
            
            <div className="mb-6">
               <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">{acc.name}</h3>
               <p className="text-slate-400 text-xs mt-1">Last updated: Today</p>
            </div>

            <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
              <span className="text-sm text-slate-400">Balance</span>
              <span className={`text-2xl font-bold ${acc.balanceCents < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(acc.balanceCents)}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">Recent Activity</p>
              {getRecentTransactions(acc.id).map(tx => (
                <div key={tx.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 truncate w-32">{tx.notes}</span>
                  <span className="text-rose-400">-{formatCurrency(tx.amountCents)}</span>
                </div>
              ))}
              {getRecentTransactions(acc.id).length === 0 && (
                <p className="text-xs text-slate-600 italic">No recent transactions</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- INCOME VIEW ---
export const IncomeView: React.FC<{
  income: Income[];
  onOpenModal: (type: ModalType) => void;
}> = ({ income, onOpenModal }) => {
  const totalIncome = income.reduce((acc, curr) => acc + curr.amountCents, 0);

  // Group by source for chart
  const sourceData = income.reduce((acc: any, curr) => {
    const existing = acc.find((d: any) => d.name === curr.source);
    if (existing) {
      existing.amount += curr.amountCents / 100;
    } else {
      acc.push({ name: curr.source, amount: curr.amountCents / 100 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white">Income Streams</h2>
           <p className="text-slate-400 text-sm">Total Earnings: <span className="text-emerald-400 font-mono">{formatCurrency(totalIncome)}</span></p>
        </div>
        <Button onClick={() => onOpenModal(ModalType.ADD_INCOME)} variant="success">+ Log Income</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2" title="Income Sources">
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={sourceData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#ffffff20', color: '#fff' }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </Card>
        
        <div className="space-y-4">
          <Card title="Top Source">
             <h3 className="text-xl font-bold text-white">{sourceData.sort((a:any,b:any) => b.amount - a.amount)[0]?.name || 'N/A'}</h3>
             <p className="text-emerald-400 text-lg mt-1">{formatCurrency((sourceData.sort((a:any,b:any) => b.amount - a.amount)[0]?.amount || 0) * 100)}</p>
          </Card>
          <Card className="bg-emerald-900/20 border-emerald-500/20">
             <p className="text-emerald-200 text-sm">"Diversifying income streams is key to building lasting wealth."</p>
          </Card>
        </div>
      </div>

      <div className="mt-8">
         <h3 className="text-xl font-bold text-white mb-4">Recent Deposits</h3>
         <div className="space-y-2">
            {income.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(inc => (
              <div key={inc.id} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-white font-bold">{inc.source}</p>
                      <p className="text-xs text-slate-400">{inc.date} • {inc.notes}</p>
                    </div>
                 </div>
                 <span className="text-emerald-400 font-mono font-bold">+{formatCurrency(inc.amountCents)}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

// --- DEBTS VIEW ---
export const DebtsView: React.FC<{
  debts: Debt[];
  onPayDebt: (id: number) => void;
}> = ({ debts, onPayDebt }) => {
  const totalDebt = debts.reduce((acc, d) => acc + d.remainingBalanceCents, 0);
  
  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h2 className="text-2xl font-bold text-white">Debt Snowball</h2>
           <p className="text-slate-400 text-sm">Total Remaining: <span className="text-rose-400 font-mono">{formatCurrency(totalDebt)}</span></p>
         </div>
         <Button variant="danger" onClick={() => {}}>Optimize Strategy</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart */}
         <Card className="lg:col-span-2" title="Payoff Progress">
            <DebtPaydownChart debts={debts} />
         </Card>

         {/* Debt Strategy Card */}
         <Card className="bg-gradient-to-br from-rose-900/40 to-slate-900 border-rose-500/20">
            <h3 className="text-lg font-bold text-rose-200 mb-2">Strategy: Avalanche</h3>
            <p className="text-sm text-rose-200/70 mb-4">Focusing on highest interest rates first will save you approx $1,204 in interest.</p>
            <div className="p-4 bg-black/20 rounded-lg border border-rose-500/10">
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-400">Monthly Payment Cap</span>
                 <span className="text-white">$1,500.00</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-400">Projected Free Date</span>
                 <span className="text-emerald-400">Aug 2026</span>
               </div>
            </div>
         </Card>
      </div>

      <h3 className="text-xl font-bold text-white mt-8">Active Liabilities</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {debts.map(debt => {
          const progress = debt.totalAmountCents - debt.remainingBalanceCents;
          return (
            <Card key={debt.id} className="border-l-4 border-l-rose-500">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h4 className="text-xl font-bold text-white">{debt.name}</h4>
                   <p className="text-xs text-slate-400">Due: {debt.dueDate || 'Monthly'}</p>
                 </div>
                 <Badge color="red">{((debt.remainingBalanceCents / debt.totalAmountCents) * 100).toFixed(0)}% Left</Badge>
               </div>
               
               <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{formatCurrency(progress)} / {formatCurrency(debt.totalAmountCents)}</span>
                  </div>
                  <ProgressBar value={progress} max={debt.totalAmountCents} colorClass="bg-rose-500" />
               </div>

               <div className="flex gap-3">
                 <Button className="flex-1" variant="secondary" onClick={() => onPayDebt(debt.id)}>Make Payment</Button>
                 <Button variant="ghost">History</Button>
               </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// --- SAVINGS VIEW ---
export const SavingsView: React.FC<{
  savings: SavingsGoal[];
  onAddContribution: (id: number) => void;
  onOpenModal: (type: ModalType) => void;
}> = ({ savings, onAddContribution, onOpenModal }) => {
  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h2 className="text-2xl font-bold text-white">Dreams & Goals</h2>
           <p className="text-slate-400 text-sm">Visualize your future purchases</p>
         </div>
         <Button onClick={() => onOpenModal(ModalType.ADD_GOAL)} variant="success">+ New Goal</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1 bg-gradient-to-b from-indigo-900/20 to-slate-900" title="Total Progress">
            <SavingsProgressRadial savings={savings} />
         </Card>
         
         <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savings.map(goal => {
               const percent = (goal.currentCents / goal.goalCents) * 100;
               return (
                 <Card key={goal.id} className={`border ${percent >= 100 ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/5'}`}>
                    <div className="flex justify-between items-start mb-3">
                       <div className={`p-2 rounded-lg ${percent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'}`}>
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       {percent >= 100 && <Badge color="green">COMPLETED!</Badge>}
                    </div>

                    <h4 className="text-lg font-bold text-white mb-1">{goal.name}</h4>
                    <p className="text-xs text-slate-400 mb-4">Target: {goal.targetDate || 'No date set'}</p>

                    <div className="space-y-2 mb-4">
                       <div className="flex justify-between text-xs font-mono">
                         <span className="text-emerald-400">{formatCurrency(goal.currentCents)}</span>
                         <span className="text-slate-500">{formatCurrency(goal.goalCents)}</span>
                       </div>
                       <ProgressBar value={goal.currentCents} max={goal.goalCents} colorClass={percent >= 100 ? "bg-emerald-400" : "bg-cyan-400"} />
                    </div>

                    <Button 
                      className="w-full text-sm" 
                      variant={percent >= 100 ? "ghost" : "secondary"}
                      disabled={percent >= 100}
                      onClick={() => onAddContribution(goal.id)}
                    >
                      {percent >= 100 ? 'Goal Reached 🎉' : 'Add Funds'}
                    </Button>
                 </Card>
               );
            })}
         </div>
      </div>
    </div>
  );
};

// --- EXPENSES VIEW ---
export const ExpensesView: React.FC<{
  expenses: Expense[];
  onOpenModal: (type: ModalType) => void;
}> = ({ expenses, onOpenModal }) => {
  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <Button onClick={() => onOpenModal(ModalType.ADD_EXPENSE)}>+ Add Expense</Button>
       </div>

       <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-slate-900/50 text-gray-400 text-xs uppercase">
                <tr>
                   <th className="p-4">Date</th>
                   <th className="p-4">Note</th>
                   <th className="p-4">Category</th>
                   <th className="p-4 text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
                   <tr key={e.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-gray-400 font-mono text-sm">{e.date}</td>
                      <td className="p-4 text-white font-medium">{e.notes}</td>
                      <td className="p-4">
                         <span className="px-2 py-1 rounded bg-white/5 text-gray-300 text-xs">Category {e.categoryId}</span>
                      </td>
                      <td className="p-4 text-right text-rose-400 font-mono">
                         -${(e.amountCents/100).toFixed(2)}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};
