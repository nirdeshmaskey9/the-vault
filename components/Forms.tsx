
import React, { useState } from 'react';
import { Button, Input, Select } from './UIComponents';
import { AccountType, Account, Expense, Income, Debt, SavingsGoal, PaymentFormData } from '../types';
import { CATEGORIES, formatCurrency } from '../constants';

// --- ADD ACCOUNT FORM ---
export const AddAccountForm: React.FC<{ onSubmit: (data: Partial<Account>) => void; onClose: () => void }> = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<AccountType>(AccountType.BANK);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      balanceCents: Math.round(parseFloat(balance) * 100) || 0,
      createdAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Account Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Chase Sapphire" required />
      <Select 
        label="Type" 
        value={type} 
        onChange={e => setType(e.target.value as AccountType)} 
        options={Object.values(AccountType).map(t => ({ value: t, label: t }))}
      />
      <Input label="Starting Balance ($)" type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} required />
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1">Create Account</Button>
      </div>
    </form>
  );
};

// --- CONNECT BANK FORM ---
export const ConnectBankForm: React.FC<{ onSubmit: () => void; onClose: () => void }> = ({ onSubmit, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    // Simulate Plaid Link delay
    setTimeout(() => {
        setIsLoading(false);
        onSubmit();
    }, 2000);
  };

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white font-medium">Connecting to Bank securely...</p>
          </div>
      );
  }

  return (
      <div className="space-y-6">
          <div className="p-4 bg-white rounded-lg flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Plaid_logo.svg" alt="Plaid" className="h-8" />
          </div>
          <p className="text-gray-300 text-sm text-center">
              The Vault uses Plaid to securely connect your accounts. Your credentials are never stored.
          </p>
          <div className="grid grid-cols-2 gap-4">
              <button onClick={handleConnect} className="p-4 bg-slate-800 rounded-lg border border-white/10 hover:border-violet-500 transition-all flex flex-col items-center gap-2">
                  <span className="text-2xl">🏦</span>
                  <span className="text-sm text-white">Chase</span>
              </button>
              <button onClick={handleConnect} className="p-4 bg-slate-800 rounded-lg border border-white/10 hover:border-violet-500 transition-all flex flex-col items-center gap-2">
                  <span className="text-2xl">💳</span>
                  <span className="text-sm text-white">Amex</span>
              </button>
              <button onClick={handleConnect} className="p-4 bg-slate-800 rounded-lg border border-white/10 hover:border-violet-500 transition-all flex flex-col items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-sm text-white">Wells Fargo</span>
              </button>
              <button onClick={handleConnect} className="p-4 bg-slate-800 rounded-lg border border-white/10 hover:border-violet-500 transition-all flex flex-col items-center gap-2">
                  <span className="text-2xl">🏛️</span>
                  <span className="text-sm text-white">Citi</span>
              </button>
          </div>
      </div>
  );
};

// --- ADD TRANSACTION FORM ---
export const AddTransactionForm: React.FC<{ 
  accounts: Account[];
  onSubmit: (data: any) => void; 
  onClose: () => void;
}> = ({ accounts, onSubmit, onClose }) => {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(1);
  const [accountId, setAccountId] = useState(accounts[0]?.id || 0);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      amountCents: Math.round(parseFloat(amount) * 100),
      date,
      categoryId,
      accountId,
      notes,
      source: type === 'INCOME' ? 'Manual Entry' : undefined
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex bg-slate-800 p-1 rounded-lg mb-4">
        <button type="button" onClick={() => setType('EXPENSE')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${type === 'EXPENSE' ? 'bg-rose-500 text-white' : 'text-gray-400'}`}>Expense</button>
        <button type="button" onClick={() => setType('INCOME')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${type === 'INCOME' ? 'bg-emerald-500 text-white' : 'text-gray-400'}`}>Income</button>
      </div>

      <Input label="Amount ($)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
      
      {type === 'EXPENSE' && (
        <Select 
          label="Category"
          value={categoryId}
          onChange={e => setCategoryId(Number(e.target.value))}
          options={CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
        />
      )}
      
      <Select 
        label="Account"
        value={accountId}
        onChange={e => setAccountId(Number(e.target.value))}
        options={accounts.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balanceCents)})` }))}
      />

      <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What was this for?" />

      <Button type="submit" className="w-full" variant={type === 'EXPENSE' ? 'danger' : 'success'}>
        {type === 'EXPENSE' ? 'Log Expense' : 'Log Income'}
      </Button>
    </form>
  );
};

// --- ADD GOAL FORM ---
export const AddGoalForm: React.FC<{ onSubmit: (data: Partial<SavingsGoal>) => void; onClose: () => void }> = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      goalCents: Math.round(parseFloat(goal) * 100),
      currentCents: 0,
      targetDate: date,
      active: true
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Goal Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Car" required />
      <Input label="Target Amount ($)" type="number" value={goal} onChange={e => setGoal(e.target.value)} required />
      <Input label="Target Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <Button type="submit" className="w-full" variant="success">Set Goal</Button>
    </form>
  );
};

// --- PAYMENT FORM ---
export const PaymentForm: React.FC<{
  initialData: { targetId: number, targetName: string, type: 'DEBT_PAYMENT' | 'SAVINGS_CONTRIBUTION' };
  accounts: Account[];
  onSubmit: (data: PaymentFormData) => void;
  onClose: () => void;
}> = ({ initialData, accounts, onSubmit, onClose }) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      targetId: initialData.targetId,
      targetName: initialData.targetName,
      type: initialData.type,
      amountCents: Math.round(parseFloat(amount) * 100),
      fromAccountId: accountId
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="p-4 bg-slate-800 rounded-lg border border-white/5">
         <p className="text-gray-400 text-sm">{initialData.type === 'DEBT_PAYMENT' ? 'Paying off' : 'Contributing to'}</p>
         <h3 className="text-xl font-bold text-white">{initialData.targetName}</h3>
       </div>

       <Input label="Amount ($)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
       
       <Select 
        label="From Account"
        value={accountId}
        onChange={e => setAccountId(Number(e.target.value))}
        options={accounts.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balanceCents)})` }))}
      />
      
      <Button type="submit" className="w-full" variant="success">
        Confirm Transaction
      </Button>
    </form>
  );
};
