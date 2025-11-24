import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend } from 'recharts';
import { Expense, Category, Debt, SavingsGoal } from '../types';
import { CATEGORIES, formatCurrency } from '../constants';

interface ChartProps {
  data: any[];
}

export const ExpenseTrendChart: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
  const grouped = expenses.reduce((acc, curr) => {
    const date = curr.date.substring(5); // MM-DD
    acc[date] = (acc[date] || 0) + curr.amountCents;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.keys(grouped).sort().map(date => ({
    date,
    amount: grouped[date] / 100
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#ffffff20', color: '#fff' }}
            formatter={(val: number) => [`$${val.toFixed(2)}`, 'Spent']}
          />
          <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
  const grouped = expenses.reduce((acc, curr) => {
    acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amountCents;
    return acc;
  }, {} as Record<number, number>);

  const data = Object.keys(grouped).map(catId => {
    const cat = CATEGORIES.find(c => c.id === parseInt(catId));
    return {
      name: cat?.name || 'Unknown',
      value: grouped[parseInt(catId)] / 100,
      color: cat?.color || '#ccc'
    };
  }).sort((a,b) => b.value - a.value);

  return (
    <div className="h-[250px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ backgroundColor: '#1e293b', borderColor: '#ffffff20', color: '#fff', borderRadius: '8px' }}
             formatter={(val: number) => formatCurrency(val * 100)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-gray-400 text-xs uppercase tracking-wider">Top Cat</span>
        <span className="text-white font-bold">{data[0]?.name.split(' ')[0]}</span>
      </div>
    </div>
  );
};

export const DebtPaydownChart: React.FC<{ debts: Debt[] }> = ({ debts }) => {
  const data = debts.map(d => ({
    name: d.name,
    paid: (d.totalAmountCents - d.remainingBalanceCents) / 100,
    remaining: d.remainingBalanceCents / 100,
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
          <Tooltip 
            cursor={{fill: 'transparent'}}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#ffffff20', color: '#fff' }}
          />
          <Bar dataKey="paid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Paid" />
          <Bar dataKey="remaining" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} name="Remaining" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SavingsProgressRadial: React.FC<{ savings: SavingsGoal[] }> = ({ savings }) => {
  const data = savings.map((s, index) => ({
    name: s.name,
    uv: (s.currentCents / s.goalCents) * 100,
    fill: index % 2 === 0 ? '#8b5cf6' : '#06b6d4'
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={data}>
          <RadialBar
            label={{ position: 'insideStart', fill: '#fff' }}
            background
            dataKey="uv"
            cornerRadius={10}
          />
          <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
          <Tooltip 
             contentStyle={{ backgroundColor: '#1e293b', borderColor: '#ffffff20', color: '#fff' }}
             formatter={(val: number) => `${val.toFixed(1)}%`}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};