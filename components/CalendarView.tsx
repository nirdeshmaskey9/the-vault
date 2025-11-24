
import React, { useState } from 'react';
import { Expense, Income, Debt, SavingsGoal } from '../types';
import { formatCurrency } from '../constants';
import { Card } from './UIComponents';

interface CalendarViewProps {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  savings: SavingsGoal[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ expenses, income, debts, savings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const eventsByDate: Record<number, any[]> = {};

  // Populate events
  const processEvents = () => {
    // Expenses
    expenses.forEach(e => {
        const d = new Date(e.date);
        if (d.getMonth() === month && d.getFullYear() === year) {
            if (!eventsByDate[d.getDate()]) eventsByDate[d.getDate()] = [];
            eventsByDate[d.getDate()].push({ type: 'expense', amount: e.amountCents, desc: e.notes });
        }
    });
    // Income
    income.forEach(i => {
        const d = new Date(i.date);
        if (d.getMonth() === month && d.getFullYear() === year) {
            if (!eventsByDate[d.getDate()]) eventsByDate[d.getDate()] = [];
            eventsByDate[d.getDate()].push({ type: 'income', amount: i.amountCents, desc: i.source });
        }
    });
    // Debts Due
    debts.forEach(d => {
        if (d.dueDate) {
            const date = new Date(d.dueDate);
            if (date.getMonth() === month && date.getFullYear() === year) {
                if (!eventsByDate[date.getDate()]) eventsByDate[date.getDate()] = [];
                eventsByDate[date.getDate()].push({ type: 'debt', amount: d.minPaymentCents || 0, desc: `${d.name} Due` });
            }
        }
    });
  };

  processEvents();

  const renderDay = (day: number) => {
    const events = eventsByDate[day] || [];
    const hasExpense = events.some(e => e.type === 'expense');
    const hasIncome = events.some(e => e.type === 'income');
    const hasDebt = events.some(e => e.type === 'debt');

    return (
      <div key={day} className="min-h-[100px] p-2 border border-white/5 bg-white/5 rounded-lg relative hover:bg-white/10 transition-colors group">
        <span className={`text-sm font-bold ${hasIncome ? 'text-emerald-400' : 'text-gray-400'}`}>{day}</span>
        
        <div className="mt-2 space-y-1">
          {events.slice(0, 3).map((ev, i) => (
             <div key={i} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                 ev.type === 'income' ? 'bg-emerald-500/20 text-emerald-300' :
                 ev.type === 'debt' ? 'bg-rose-500/20 text-rose-300' :
                 'bg-violet-500/20 text-violet-300'
             }`}>
                {ev.type === 'expense' ? '-' : ''}{formatCurrency(ev.amount)}
             </div>
          ))}
          {events.length > 3 && (
             <div className="text-[10px] text-gray-500">+{events.length - 3} more</div>
          )}
        </div>

        {/* Indicators */}
        <div className="absolute top-2 right-2 flex gap-1">
           {hasDebt && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Financial Calendar</h2>
          <div className="flex gap-4 items-center bg-slate-800 rounded-lg p-1">
             <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-white">←</button>
             <span className="font-mono text-lg font-bold text-white min-w-[150px] text-center">
                 {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
             </span>
             <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-white">→</button>
          </div>
       </div>

       <Card className="bg-slate-900/50 backdrop-blur-xl">
          <div className="grid grid-cols-7 gap-4 mb-4 text-center text-gray-400 font-medium">
             <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
             {Array.from({ length: firstDay }).map((_, i) => (
               <div key={`empty-${i}`} className="min-h-[100px] bg-transparent" />
             ))}
             {Array.from({ length: daysInMonth }).map((_, i) => renderDay(i + 1))}
          </div>
       </Card>
    </div>
  );
};
