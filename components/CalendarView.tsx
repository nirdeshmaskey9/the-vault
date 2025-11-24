
import React from 'react';
import { Expense, Income } from '../types';
import { Card } from './UIComponents';
import { formatCurrency } from '../constants';

interface CalendarViewProps {
  expenses: Expense[];
  income: Income[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ expenses, income }) => {
  // Simple current month view
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const recurringItems = [
    ...expenses.filter(e => e.isRecurring && e.nextDueDate).map(e => ({...e, type: 'BILL', day: new Date(e.nextDueDate!).getDate() })),
    ...income.filter(i => i.isRecurring && i.nextDueDate).map(i => ({...i, type: 'INCOME', day: new Date(i.nextDueDate!).getDate() }))
  ];

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        <h2 className="text-2xl font-bold text-white">Financial Calendar</h2>
        <p className="text-slate-400 text-sm">Upcoming recurring payments and income for {today.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>

        <Card className="p-0 overflow-hidden bg-slate-900 border-none">
            <div className="grid grid-cols-7 bg-slate-800 text-center py-2 text-gray-400 text-xs uppercase font-bold tracking-wider">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 border-l border-t border-slate-700/50">
                {blanks.map(i => <div key={`blank-${i}`} className="h-32 border-r border-b border-slate-700/50 bg-slate-900/50"></div>)}
                {days.map(d => {
                    const items = recurringItems.filter(i => i.day === d);
                    const isToday = d === today.getDate();
                    return (
                        <div key={d} className={`h-32 border-r border-b border-slate-700/50 p-2 relative group hover:bg-white/5 transition-colors ${isToday ? 'bg-violet-900/20' : ''}`}>
                            <span className={`text-sm font-medium ${isToday ? 'text-violet-400 bg-violet-900/50 px-1.5 rounded-full' : 'text-gray-500'}`}>{d}</span>
                            
                            <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px]">
                                {items.map((item, idx) => (
                                    <div key={idx} className={`text-[10px] p-1 rounded truncate ${item.type === 'BILL' ? 'bg-rose-900/50 text-rose-300 border border-rose-500/30' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30'}`}>
                                        {formatCurrency(item.amountCents)} {item.notes}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    </div>
  );
};
