
import React, { useState, useEffect } from 'react';
import { generateMockData, getInitialInsights } from './services/mockService';
import { Account, Expense, Income, Debt, SavingsGoal, UserStats, AIInsight, ModalType, UserProfile, ReceiptData, PaymentFormData, HistoryModalData, TransferFormData, AccountType } from './types';
import { Dashboard } from './components/Dashboard';
import { AccountsView, DebtsView, SavingsView, IncomeView, ExpensesView, HistoryModal } from './components/Views';
import { AIChat } from './components/AIChat';
import { Card, Button, Toast, Modal, Input, Select } from './components/UIComponents';
import { AddAccountForm, AddTransactionForm, AddGoalForm, AddDebtForm, PaymentForm, EditAccountForm, TransferForm } from './components/Forms';
import { saveState, loadState } from './services/persistence';
import { LandingPage } from './components/LandingPage';
import { logAction } from './services/watchdogService';
import { addFact } from './services/memoryService';

enum View {
  DASHBOARD = 'DASHBOARD',
  ACCOUNTS = 'ACCOUNTS',
  EXPENSES = 'EXPENSES',
  INCOME = 'INCOME',
  DEBTS = 'DEBTS',
  SAVINGS = 'SAVINGS'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // App State
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('guest');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [stats, setStats] = useState<UserStats>({ level: 1, xp: 0, nextLevelXp: 100, title: 'Novice', streakDays: 0 });
  const [insights, setInsights] = useState<AIInsight[]>([]);
  
  // UI State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [scannedReceipt, setScannedReceipt] = useState<ReceiptData | null>(null);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<HistoryModalData | null>(null);

  // Load Data
  useEffect(() => {
    // Check if previously logged in (optional, for now strictly require login)
  }, []);

  // Save State on Change
  useEffect(() => {
    if (!loading && isAuthenticated) {
      saveState({ accounts, expenses, income, debts, savings, stats, insights }, currentUserId);
    }
  }, [accounts, expenses, income, debts, savings, stats, insights, loading, isAuthenticated, currentUserId]);

  const handleLogin = (userId: string) => {
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      
      const saved = loadState(userId);
      if (saved) {
        setAccounts(saved.accounts);
        setExpenses(saved.expenses);
        setIncome(saved.income);
        setDebts(saved.debts);
        setSavings(saved.savings);
        setStats(saved.stats);
        setInsights(saved.insights);
        setProfile({ name: userId, currency: 'USD', financialGoal: 'Financial Freedom', riskTolerance: 'medium' });
      } else {
        // START FRESH - NO MOCK DATA
        setAccounts([]);
        setExpenses([]);
        setIncome([]);
        setDebts([]);
        setSavings([]);
        setStats({ level: 1, xp: 0, nextLevelXp: 100, title: 'Novice', streakDays: 0 });
        setInsights([]);
        setProfile({ name: userId, currency: 'USD', financialGoal: 'Financial Freedom', riskTolerance: 'medium' });
      }
      setLoading(false);
  };

  const addXP = (amount: number, reason: string) => {
    setStats(prev => {
      const newXp = prev.xp + amount;
      const leveledUp = newXp >= prev.nextLevelXp;
      return {
        ...prev,
        xp: leveledUp ? newXp - prev.nextLevelXp : newXp,
        level: leveledUp ? prev.level + 1 : prev.level,
        nextLevelXp: leveledUp ? Math.floor(prev.nextLevelXp * 1.5) : prev.nextLevelXp
      };
    });
    setToast({ message: `+${amount} XP: ${reason}`, type: 'success' });
  };

  const handleModalClose = () => {
    setModalType(ModalType.NONE);
    setScannedReceipt(null);
    setActiveItemId(null);
    setHistoryData(null);
  };

  const handleCreateTransaction = (data: any) => {
    logAction('ADD', `Created ${data.type} of $${data.amountCents/100}`);
    if (data.type === 'EXPENSE') {
      const newExpense: Expense = {
        id: Date.now(),
        date: data.date,
        amountCents: data.amountCents,
        categoryId: data.categoryId,
        accountId: data.accountId,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        metaOrigin: scannedReceipt ? 'receipt_scan' : 'manual'
      };
      setExpenses(prev => [...prev, newExpense]);
      setAccounts(prev => prev.map(a => a.id === data.accountId ? { ...a, balanceCents: a.balanceCents - data.amountCents } : a));
      addXP(10, "Expense Logged");
    } else {
      const newIncome: Income = {
        id: Date.now(),
        date: data.date,
        amountCents: data.amountCents,
        source: data.source || 'Manual Entry',
        accountId: data.accountId,
        notes: data.notes
      };
      setIncome(prev => [...prev, newIncome]);
      setAccounts(prev => prev.map(a => a.id === data.accountId ? { ...a, balanceCents: a.balanceCents + data.amountCents } : a));
      addXP(20, "Income Recorded");
    }
  };

  const handleEditAccount = (data: Partial<Account>) => {
      if (activeItemId !== null) {
          setAccounts(prev => prev.map(a => a.id === activeItemId ? { ...a, ...data } : a));
          setToast({ message: "Account Updated", type: "success" });
          logAction('EDIT', `Edited account ${activeItemId}`);
      }
  };

  const handlePayment = (data: PaymentFormData) => {
      const { targetId, type, amountCents, accountId } = data;
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balanceCents: a.balanceCents - amountCents } : a));

      if (type === 'DEBT') {
          setDebts(prev => prev.map(d => d.id === targetId ? { ...d, remainingBalanceCents: Math.max(0, d.remainingBalanceCents - amountCents) } : d));
          const newExp: Expense = {
             id: Date.now(),
             date: new Date().toISOString().split('T')[0],
             amountCents,
             categoryId: 3, 
             accountId,
             notes: `Payment to ${data.targetName}`,
             createdAt: new Date().toISOString(),
             metaOrigin: 'manual'
          };
          setExpenses(prev => [...prev, newExp]);
          addXP(50, "Debt Payment");
          logAction('ADD', `Paid debt ${data.targetName}`);
      } else {
          setSavings(prev => prev.map(s => s.id === targetId ? { ...s, currentCents: s.currentCents + amountCents } : s));
           const newExp: Expense = {
             id: Date.now(),
             date: new Date().toISOString().split('T')[0],
             amountCents,
             categoryId: 8,
             accountId,
             notes: `Contribution to ${data.targetName}`,
             createdAt: new Date().toISOString(),
             metaOrigin: 'manual'
          };
          setExpenses(prev => [...prev, newExp]);
          addXP(30, "Savings Contribution");
          logAction('ADD', `Contributed to savings ${data.targetName}`);
      }
  };

  const handleTransferFunds = (data: TransferFormData) => {
    const { fromAccountId, toAccountId, amountCents } = data;
    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const toAccount = accounts.find(a => a.id === toAccountId);

    if (!fromAccount || !toAccount || fromAccount.balanceCents < amountCents) {
      setToast({ message: "Invalid Transfer", type: "info" });
      return;
    }

    setAccounts(prev => prev.map(a => {
      if (a.id === fromAccountId) return { ...a, balanceCents: a.balanceCents - amountCents };
      if (a.id === toAccountId) return { ...a, balanceCents: a.balanceCents + amountCents };
      return a;
    }));

    const transferNote = `Transfer from ${fromAccount.name} to ${toAccount.name}`;
    const newExp: Expense = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      amountCents,
      categoryId: 8,
      accountId: fromAccountId,
      notes: transferNote,
      createdAt: new Date().toISOString(),
      metaOrigin: 'transfer'
    };
    
    const newInc: Income = {
      id: Date.now() + 1,
      date: new Date().toISOString().split('T')[0],
      amountCents,
      source: `Transfer from ${fromAccount.name}`,
      accountId: toAccountId,
      notes: transferNote
    };

    setExpenses(prev => [...prev, newExp]);
    setIncome(prev => [...prev, newInc]);
    addXP(10, "Funds Transferred");
    logAction('ADD', transferNote);
    setToast({ message: "Transfer Successful", type: "success" });
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setProfile({
        name: formData.get('name') as string,
        currency: 'USD',
        financialGoal: formData.get('goal') as string,
        riskTolerance: formData.get('risk') as any
    });
    handleModalClose();
    setToast({ message: "Profile Updated", type: "success" });
  };

  // --- AI ACTION HANDLER ---
  const handleAIAction = async (action: string, params: any) => {
    console.log("AI Action Triggered:", action, params);
    logAction('EDIT', `AI Triggered: ${action}`, params);
    
    // MEMORY
    if (action === 'rememberFact') {
        addFact(currentUserId, params.fact);
        setToast({ message: "Memory Updated", type: 'success' });
        return { success: true, message: "I have saved that to my memory." };
    }

    // READ
    if (action === 'getAccounts') return accounts;
    if (action === 'getRecentTransactions') return [...expenses, ...income].slice(0, 15);
    if (action === 'getDebts') return debts;
    if (action === 'getSavingsGoals') return savings;
    
    // --- WRITE ---
    if (action === 'addAccount') {
        const newAccount: Account = {
            id: Date.now(),
            name: params.name,
            type: (params.type ? params.type.toUpperCase() : AccountType.BANK) as AccountType,
            balanceCents: Math.round((params.balance || 0) * 100),
            createdAt: new Date().toISOString(),
            notes: 'AI Generated'
        };
        setAccounts(prev => [...prev, newAccount]);
        addXP(50, "Account Created");
        setToast({ message: `Account '${params.name}' created`, type: 'success' });
        return { success: true, message: `Account ${newAccount.name} created successfully.` };
    }

    if (action === 'editAccount') {
        const targetName = params.currentName.toLowerCase();
        const account = accounts.find(a => a.name.toLowerCase().includes(targetName));
        if (account) {
            handleEditAccount({ 
                ...account, 
                name: params.newName || account.name, 
                balanceCents: params.newBalance ? Math.round(params.newBalance * 100) : account.balanceCents, 
                notes: params.newNotes || account.notes 
            });
            return { success: true, message: `Account updated.` };
        }
        return { success: false, message: `Account not found.` };
    }

    if (action === 'deleteAccount') {
        const targetName = params.name.toLowerCase();
        const account = accounts.find(a => a.name.toLowerCase().includes(targetName));
        if (account) {
            setAccounts(prev => prev.filter(a => a.id !== account.id));
            setToast({ message: `Account '${account.name}' deleted`, type: 'info' });
            return { success: true, message: `Account ${account.name} deleted.` };
        }
        return { success: false, message: `Account not found.` };
    }

    if (action === 'addTransaction') {
      const account = accounts.find(a => a.name.toLowerCase().includes((params.accountName || '').toLowerCase())) || accounts[0];
      const amountCents = Math.round(params.amount * 100);
      
      if (!account) return { success: false, message: "Account not found or no accounts exist." };

      if (params.type === 'EXPENSE') {
        handleCreateTransaction({ type: 'EXPENSE', amountCents, categoryId: 1, accountId: account.id, notes: params.notes || 'AI Generated', date: new Date().toISOString().split('T')[0] });
      } else {
        handleCreateTransaction({ type: 'INCOME', amountCents, source: params.category, accountId: account.id, notes: params.notes || 'AI Generated', date: new Date().toISOString().split('T')[0] });
      }
      return { success: true, message: "Transaction added." };
    }

    if (action === 'editTransaction') {
        const term = params.searchTerm.toLowerCase();
        const expIndex = expenses.findIndex(e => e.notes.toLowerCase().includes(term));
        if (expIndex !== -1) {
            const oldExp = expenses[expIndex];
            const newExp = { ...oldExp };
            if (params.newAmount) {
                const diff = Math.round(params.newAmount * 100) - oldExp.amountCents;
                newExp.amountCents = Math.round(params.newAmount * 100);
                setAccounts(prev => prev.map(a => a.id === oldExp.accountId ? { ...a, balanceCents: a.balanceCents - diff } : a));
            }
            if (params.newNotes) newExp.notes = params.newNotes;
            if (params.newDate) newExp.date = params.newDate;
            const updated = [...expenses];
            updated[expIndex] = newExp;
            setExpenses(updated);
            setToast({ message: "Transaction Updated", type: 'success' });
            return { success: true, message: "Expense updated." };
        }
        return { success: false, message: "Transaction not found." };
    }

    if (action === 'deleteTransaction') {
        const term = params.searchTerm.toLowerCase();
        const expIndex = expenses.findIndex(e => e.notes.toLowerCase().includes(term));
        if (expIndex !== -1) {
            const exp = expenses[expIndex];
            setAccounts(prev => prev.map(a => a.id === exp.accountId ? { ...a, balanceCents: a.balanceCents + exp.amountCents } : a));
            setExpenses(prev => prev.filter((_, i) => i !== expIndex));
            setToast({ message: "Transaction Deleted", type: 'info' });
            return { success: true, message: "Transaction deleted and balance restored." };
        }
        return { success: false, message: "Transaction not found." };
    }

    if (action === 'transferFunds') {
        const fromAccount = accounts.find(a => a.name.toLowerCase().includes(params.fromAccountName.toLowerCase()));
        const toAccount = accounts.find(a => a.name.toLowerCase().includes(params.toAccountName.toLowerCase()));
        if (fromAccount && toAccount) {
            handleTransferFunds({ fromAccountId: fromAccount.id, toAccountId: toAccount.id, amountCents: Math.round(params.amount * 100) });
            return { success: true, message: "Transfer completed." };
        }
        return { success: false, message: "One or both accounts not found." };
    }

    if (action === 'addDebt') {
        const newDebt: Debt = {
            id: Date.now(),
            name: params.name,
            totalAmountCents: Math.round(params.totalAmount * 100),
            remainingBalanceCents: Math.round(params.totalAmount * 100),
            dueDate: params.dueDate
        };
        setDebts(prev => [...prev, newDebt]);
        setToast({ message: `Debt '${params.name}' Added`, type: 'success' });
        return { success: true, message: `Debt ${newDebt.name} added.` };
    }

    if (action === 'updateDebt') {
        const debt = debts.find(d => d.name.toLowerCase().includes(params.debtName.toLowerCase()));
        if (debt) {
            setDebts(prev => prev.map(d => d.id === debt.id ? {
                ...d,
                name: params.newName || d.name,
                totalAmountCents: params.newTotal ? Math.round(params.newTotal * 100) : d.totalAmountCents
            } : d));
            setToast({ message: "Debt Updated", type: 'success' });
            return { success: true, message: "Debt details updated." };
        }
        return { success: false, message: "Debt not found." };
    }

    if (action === 'deleteDebt') {
        const debt = debts.find(d => d.name.toLowerCase().includes(params.name.toLowerCase()));
        if (debt) {
            setDebts(prev => prev.filter(d => d.id !== debt.id));
            setToast({ message: "Debt Deleted", type: 'info' });
            return { success: true, message: "Debt record deleted." };
        }
        return { success: false, message: "Debt not found." };
    }

    if (action === 'addSavingsGoal') {
        const newGoal: SavingsGoal = {
            id: Date.now(),
            name: params.name,
            goalCents: Math.round(params.targetAmount * 100),
            currentCents: 0,
            targetDate: params.targetDate,
            active: true
        };
        setSavings(prev => [...prev, newGoal]);
        setToast({ message: `Goal '${params.name}' Added`, type: 'success' });
        return { success: true, message: `Goal ${newGoal.name} created.` };
    }

    if (action === 'updateSavingsGoal') {
        const goal = savings.find(s => s.name.toLowerCase().includes(params.currentName.toLowerCase()));
        if (goal) {
            setSavings(prev => prev.map(s => s.id === goal.id ? {
                ...s,
                name: params.newName || s.name,
                goalCents: params.newTarget ? Math.round(params.newTarget * 100) : s.goalCents
            } : s));
            setToast({ message: "Goal Updated", type: 'success' });
            return { success: true, message: "Goal updated." };
        }
        return { success: false, message: "Goal not found." };
    }

    if (action === 'deleteSavingsGoal') {
        const goal = savings.find(s => s.name.toLowerCase().includes(params.name.toLowerCase()));
        if (goal) {
            setSavings(prev => prev.filter(s => s.id !== goal.id));
            setToast({ message: "Goal Deleted", type: 'info' });
            return { success: true, message: "Goal deleted." };
        }
        return { success: false, message: "Goal not found." };
    }

    if (action === 'payDebt') {
        const debt = debts.find(d => d.name.toLowerCase().includes(params.debtName.toLowerCase()));
        const account = accounts.find(a => a.name.toLowerCase().includes(params.fromAccountName.toLowerCase()));
        if (debt && account) {
            handlePayment({ 
                targetId: debt.id, 
                targetName: debt.name, 
                type: 'DEBT', 
                amountCents: Math.round(params.amount * 100), 
                accountId: account.id 
            });
            return { success: true, message: "Payment processed." };
        }
        return { success: false, message: "Debt or Account not found." };
    }

    if (action === 'contributeToSavings') {
        const goal = savings.find(s => s.name.toLowerCase().includes(params.goalName.toLowerCase()));
        const account = accounts.find(a => a.name.toLowerCase().includes(params.fromAccountName.toLowerCase()));
        if (goal && account) {
             handlePayment({ 
                targetId: goal.id, 
                targetName: goal.name, 
                type: 'SAVINGS', 
                amountCents: Math.round(params.amount * 100), 
                accountId: account.id 
            });
            return { success: true, message: "Contribution processed." };
        }
        return { success: false, message: "Goal or Account not found." };
    }

    if (action === 'updateProfile') {
        setProfile(prev => ({
            ...prev!,
            name: params.name || prev?.name || 'Hunter',
            financialGoal: params.financialGoal || prev?.financialGoal || 'Freedom',
            riskTolerance: params.riskTolerance || prev?.riskTolerance || 'medium'
        }));
        setToast({ message: "Profile Updated", type: 'success' });
        return { success: true, message: "Profile updated." };
    }

    return { success: true, message: "Action Processed" };
  };

  if (!isAuthenticated) {
      return <LandingPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard accounts={accounts} expenses={expenses} income={income} stats={stats} insights={insights} onOpenModal={setModalType} />;
      case View.ACCOUNTS:
        return <AccountsView accounts={accounts} expenses={expenses} onOpenModal={(type, id) => { setActiveItemId(id || null); setModalType(type); }} />;
      case View.INCOME:
        return <IncomeView income={income} onOpenModal={setModalType} />;
      case View.DEBTS:
        return <DebtsView debts={debts} onOpenModal={(type) => setModalType(type)} onPayDebt={(id) => { setActiveItemId(id); setModalType(ModalType.PAYMENT); }} onViewHistory={(name) => { setHistoryData({ title: name, filterTerm: name }); setModalType(ModalType.HISTORY); }} />;
      case View.SAVINGS:
        return <SavingsView savings={savings} onOpenModal={(type) => setModalType(type)} onAddContribution={(id) => { setActiveItemId(id); setModalType(ModalType.PAYMENT); }} />;
      case View.EXPENSES:
        return <ExpensesView expenses={expenses} onOpenModal={setModalType} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex font-sans selection:bg-violet-500/30 overflow-hidden text-gray-200">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Modal isOpen={modalType === ModalType.ADD_ACCOUNT} onClose={handleModalClose} title="Add Account">
        <AddAccountForm onSubmit={(data) => {
            setAccounts(prev => [...prev, { ...data, id: Date.now() } as Account]);
            addXP(50, "Account Added");
            handleModalClose();
        }} onClose={handleModalClose} />
      </Modal>

      <Modal isOpen={modalType === ModalType.EDIT_ACCOUNT} onClose={handleModalClose} title="Edit Account">
         {activeItemId && accounts.find(a => a.id === activeItemId) && (
            <EditAccountForm 
                account={accounts.find(a => a.id === activeItemId)!}
                onSubmit={handleEditAccount}
                onClose={handleModalClose}
            />
         )}
      </Modal>

      <Modal isOpen={modalType === ModalType.ADD_EXPENSE || modalType === ModalType.ADD_INCOME} onClose={handleModalClose} title="Log Transaction">
        <AddTransactionForm accounts={accounts} onSubmit={handleCreateTransaction} onClose={handleModalClose} />
      </Modal>

      <Modal isOpen={modalType === ModalType.ADD_DEBT} onClose={handleModalClose} title="Add Debt">
          <AddDebtForm onSubmit={(data) => {
              setDebts(prev => [...prev, { ...data, id: Date.now() } as Debt]);
              handleModalClose();
          }} onClose={handleModalClose} />
      </Modal>

      <Modal isOpen={modalType === ModalType.ADD_GOAL} onClose={handleModalClose} title="Add Goal">
          <AddGoalForm onSubmit={(data) => {
              setSavings(prev => [...prev, { ...data, id: Date.now() } as SavingsGoal]);
              handleModalClose();
          }} onClose={handleModalClose} />
      </Modal>

      <Modal isOpen={modalType === ModalType.PAYMENT} onClose={handleModalClose} title="Process Payment">
          {activeItemId !== null && (
            <PaymentForm 
               targetId={activeItemId}
               targetName={debts.find(d => d.id === activeItemId)?.name || savings.find(s => s.id === activeItemId)?.name || 'Unknown'}
               type={debts.find(d => d.id === activeItemId) ? 'DEBT' : 'SAVINGS'}
               accounts={accounts}
               onSubmit={handlePayment}
               onClose={handleModalClose}
            />
          )}
      </Modal>

      <Modal isOpen={modalType === ModalType.TRANSFER} onClose={handleModalClose} title="Transfer Funds">
        <TransferForm accounts={accounts} onSubmit={handleTransferFunds} onClose={handleModalClose} />
      </Modal>

      <Modal isOpen={modalType === ModalType.HISTORY} onClose={handleModalClose} title={`History: ${historyData?.title}`}>
         {historyData && <HistoryModal expenses={expenses} filterTerm={historyData.filterTerm} />}
      </Modal>

      <Modal isOpen={modalType === ModalType.PROFILE || modalType === ModalType.SETTINGS} onClose={handleModalClose} title="User Profile">
         <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input name="name" label="Your Name" defaultValue={profile?.name || 'Hunter'} />
            <Input name="goal" label="Financial Goal" defaultValue={profile?.financialGoal || 'Financial Freedom'} />
            <Select name="risk" label="Risk Tolerance" options={[{value:'low', label:'Low'}, {value:'medium', label:'Medium'}, {value:'high', label:'High'}]} />
            <Button type="submit" className="w-full">Save Profile</Button>
            <Button variant="danger" className="w-full mt-2" onClick={() => { localStorage.clear(); window.location.reload(); }}>Log Out / Reset All</Button>
         </form>
      </Modal>

      {/* Sidebar (Desktop) */}
      <aside className="w-64 fixed inset-y-0 left-0 z-40 bg-black/40 backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col">
         <div className="p-6">
            <h1 className="text-2xl font-bold neon-text text-white">THE VAULT</h1>
         </div>
         <nav className="flex-1 px-4 space-y-2">
            {[
                { view: View.DASHBOARD, label: "Dashboard" },
                { view: View.ACCOUNTS, label: "Accounts" },
                { view: View.INCOME, label: "Income" },
                { view: View.EXPENSES, label: "Expenses" },
                { view: View.DEBTS, label: "Debts" },
                { view: View.SAVINGS, label: "Savings" }
            ].map(item => (
                <button 
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${currentView === item.view ? 'bg-violet-600/20 text-white border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {item.label}
                </button>
            ))}
         </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-white/10 flex justify-around p-3 safe-area-bottom">
        {[
            { view: View.DASHBOARD, icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
            { view: View.ACCOUNTS, icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
            { view: View.EXPENSES, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { view: View.DEBTS, icon: "M13 10V3L4 14h7v7l9-11h-7z" },
        ].map(item => (
            <button 
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`p-2 rounded-xl transition-colors ${currentView === item.view ? 'text-violet-400 bg-white/5' : 'text-gray-400'}`}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
            </button>
        ))}
         <button onClick={() => setModalType(ModalType.PROFILE)} className="p-2 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
         </button>
      </nav>

      <main className="flex-1 md:ml-64 relative h-screen overflow-y-auto z-10">
         <div className="p-4 md:p-10 pb-28 md:pb-24 max-w-7xl mx-auto">
            {renderContent()}
         </div>
      </main>

      <AIChat 
        accounts={accounts} 
        expenses={expenses} 
        income={income} 
        debts={debts} 
        savings={savings} 
        stats={stats} 
        profile={profile}
        currentUserId={currentUserId}
        onExecuteAction={handleAIAction}
        onReceiptScanned={(data) => { setScannedReceipt(data); setModalType(ModalType.ADD_EXPENSE); }}
      />
    </div>
  );
};

export default App;
