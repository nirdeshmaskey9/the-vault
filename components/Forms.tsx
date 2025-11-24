
import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from './UIComponents';
import { AccountType, Account, Expense, Income, Debt, SavingsGoal, PaymentFormData, TransferFormData, UserProfile } from '../types';
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

// --- EDIT ACCOUNT FORM ---
export const EditAccountForm: React.FC<{ account: Account; onSubmit: (data: Partial<Account>) => void; onClose: () => void }> = ({ account, onSubmit, onClose }) => {
  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState((account.balanceCents / 100).toFixed(2));
  const [type, setType] = useState<AccountType>(account.type);
  const [notes, setNotes] = useState(account.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      balanceCents: Math.round(parseFloat(balance) * 100),
      notes
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Account Name" value={name} onChange={e => setName(e.target.value)} required />
      <Select 
        label="Type" 
        value={type} 
        onChange={e => setType(e.target.value as AccountType)} 
        options={Object.values(AccountType).map(t => ({ value: t, label: t }))}
      />
      <Input label="Current Balance ($)" type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} required />
      <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1">Save Changes</Button>
      </div>
    </form>
  );
};

// --- ADD TRANSACTION FORM (UPDATED RECURRING) ---
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
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState('');

  useEffect(() => {
     // Default next due date to 1 month from now
     const d = new Date(date);
     d.setMonth(d.getMonth() + 1);
     setNextDueDate(d.toISOString().split('T')[0]);
  }, [date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      amountCents: Math.round(parseFloat(amount) * 100),
      date,
      categoryId,
      accountId,
      notes,
      source: type === 'INCOME' ? 'Manual Entry' : undefined,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
      nextDueDate: isRecurring ? nextDueDate : undefined
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
        options={accounts.map(a => ({ value: a.id, label: `${a.name} ($${(a.balanceCents/100).toFixed(0)})` }))}
      />

      <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What was this for?" />

      {/* RECURRING TOGGLE */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/5">
        <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-5 h-5 accent-violet-500 rounded" />
            <span className="text-white text-sm font-medium">This is a recurring transaction</span>
        </label>
        
        {isRecurring && (
            <div className="grid grid-cols-2 gap-4 animate-[fadeIn_0.3s_ease-out]">
                <Select 
                    label="Frequency"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    options={[{value: 'monthly', label: 'Monthly'}, {value: 'weekly', label: 'Weekly'}, {value: 'yearly', label: 'Yearly'}]}
                />
                <Input label="Next Due Date" type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} />
            </div>
        )}
      </div>

      <Button type="submit" className="w-full" variant={type === 'EXPENSE' ? 'danger' : 'success'}>
        {type === 'EXPENSE' ? 'Log Expense' : 'Log Income'}
      </Button>
    </form>
  );
};

// --- EDIT PROFILE FORM ---
export const EditProfileForm: React.FC<{ profile: UserProfile | null; onSubmit: (e: React.FormEvent) => void; onClose: () => void }> = ({ profile, onSubmit, onClose }) => {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <Input name="name" label="Your Name" defaultValue={profile?.name || ''} placeholder="e.g. Hunter" required />
            <Input name="occupation" label="Occupation" defaultValue={profile?.occupation || ''} placeholder="e.g. Software Engineer" />
            <Input name="income" label="Monthly Income ($)" type="number" defaultValue={profile?.monthlyIncome?.toString() || ''} placeholder="e.g. 5000" />
            <Input name="goal" label="Financial Goal" defaultValue={profile?.financialGoal || 'Financial Freedom'} />
            
            <Select name="risk" label="Risk Tolerance" defaultValue={profile?.riskTolerance} options={[{value:'low', label:'Low'}, {value:'medium', label:'Medium'}, {value:'high', label:'High'}]} />
            
            <Select name="voice" label="AI Voice Preference" defaultValue={profile?.voiceName || 'Kore'} options={[
                {value: 'Kore', label: 'Kore (Balanced)'},
                {value: 'Zephyr', label: 'Zephyr (Deep)'},
                {value: 'Puck', label: 'Puck (Light)'},
                {value: 'Fenrir', label: 'Fenrir (Strong)'},
            ]} />

            <div className="flex gap-2 pt-4">
                <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1">Save Profile</Button>
            </div>
        </form>
    );
};

// ... (Other Forms: AddGoal, AddDebt, Payment, Transfer remain the same) ...
export const AddGoalForm: React.FC<{ onSubmit: (data: Partial<SavingsGoal>) => void; onClose: () => void }> = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [date, setDate] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ name, goalCents: Math.round(parseFloat(goal) * 100), currentCents: 0, targetDate: date, active: true }); onClose(); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Goal Name" value={name} onChange={e => setName(e.target.value)} required />
      <Input label="Target Amount ($)" type="number" value={goal} onChange={e => setGoal(e.target.value)} required />
      <Input label="Target Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <Button type="submit" className="w-full" variant="success">Set Goal</Button>
    </form>
  );
};

export const AddDebtForm: React.FC<{ onSubmit: (data: Partial<Debt>) => void; onClose: () => void }> = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [due, setDue] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ name, totalAmountCents: Math.round(parseFloat(total) * 100), remainingBalanceCents: Math.round(parseFloat(total) * 100), dueDate: due, }); onClose(); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Debt Name" value={name} onChange={e => setName(e.target.value)} required />
      <Input label="Total Amount ($)" type="number" value={total} onChange={e => setTotal(e.target.value)} required />
      <Input label="Due Date" type="date" value={due} onChange={e => setDue(e.target.value)} />
      <Button type="submit" className="w-full" variant="danger">Add Debt</Button>
    </form>
  );
};

export const PaymentForm: React.FC<{ targetName: string; targetId: number; type: 'DEBT' | 'SAVINGS'; accounts: Account[]; onSubmit: (data: PaymentFormData) => void; onClose: () => void; }> = ({ targetName, targetId, type, accounts, onSubmit, onClose }) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 0);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ targetId, targetName, type, amountCents: Math.round(parseFloat(amount) * 100), accountId }); onClose(); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-slate-800 rounded-lg mb-2"><p className="text-sm text-gray-400">Paying towards:</p><p className="text-lg font-bold text-white">{targetName}</p></div>
      <Input label="Amount ($)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
      <Select label="Pay From Account" value={accountId} onChange={e => setAccountId(Number(e.target.value))} options={accounts.map(a => ({ value: a.id, label: `${a.name} ($${(a.balanceCents/100).toFixed(0)})` }))} />
      <Button type="submit" className="w-full" variant={type === 'DEBT' ? 'danger' : 'success'}>{type === 'DEBT' ? 'Make Payment' : 'Contribute Funds'}</Button>
    </form>
  );
};

export const TransferForm: React.FC<{ accounts: Account[]; onSubmit: (data: TransferFormData) => void; onClose: () => void; }> = ({ accounts, onSubmit, onClose }) => {
  const [fromId, setFromId] = useState(accounts[0]?.id || 0);
  const [toId, setToId] = useState(accounts.length > 1 ? accounts[1].id : accounts[0]?.id);
  const [amount, setAmount] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (fromId === toId) { alert("Source and destination accounts must be different."); return; } onSubmit({ fromAccountId: fromId, toAccountId: toId, amountCents: Math.round(parseFloat(amount) * 100) }); onClose(); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="From Account" value={fromId} onChange={e => setFromId(Number(e.target.value))} options={accounts.map(a => ({ value: a.id, label: `${a.name} ($${(a.balanceCents/100).toFixed(0)})` }))} />
      <Select label="To Account" value={toId} onChange={e => setToId(Number(e.target.value))} options={accounts.map(a => ({ value: a.id, label: `${a.name} ($${(a.balanceCents/100).toFixed(0)})` }))} />
      <Input label="Amount ($)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
      <Button type="submit" className="w-full">Transfer Funds</Button>
    </form>
  );
};
