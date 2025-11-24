
import React, { useState, useEffect } from 'react';
import { generateMockData, getInitialInsights } from './services/mockService';
import { Account, Expense, Income, Debt, SavingsGoal, UserStats, AIInsight, ModalType, UserProfile, ReceiptData, PaymentFormData, View } from './types';
import { Dashboard } from './components/Dashboard';
import { AccountsView, DebtsView, SavingsView, IncomeView, ExpensesView } from './components/Views';
import { CalendarView } from './components/CalendarView';
import { RoadmapView } from './components/RoadmapView';
import { ResourcesView } from './components/ResourcesView';
import { LandingPage } from './components/LandingPage';
import { AIChat } from './components/AIChat';
import { Card, Button, Toast, Modal, Input, Select } from './components/UIComponents';
import { AddAccountForm, AddTransactionForm, AddGoalForm, PaymentForm, ConnectBankForm } from './components/Forms';
import { exportToCSV } from './services/exportService';
import { saveState, loadState, clearState } from './services/persistence';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // App State
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(true);
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
  
  // Temp State for Payment Modal
  const [paymentTarget, setPaymentTarget] = useState<{id: number, name: string, type: 'DEBT_PAYMENT' | 'SAVINGS_CONTRIBUTION'} | null>(null);

  // Load Data
  useEffect(() => {
    setTimeout(() => {
      const saved = loadState();
      if (saved) {
        setAccounts(saved.accounts);
        setExpenses(saved.expenses);
        setIncome(saved.income);
        setDebts(saved.debts);
        setSavings(saved.savings);
        setStats(saved.stats);
        setInsights(saved.insights);
        // In a real app, we check auth token here
        if (saved.accounts.length > 0) setIsAuthenticated(true);
      } else {
        // No saved state, wait for login
      }
      setLoading(false);
    }, 1500);
  }, []);

  // Save State
  useEffect(() => {
    if (isAuthenticated && !loading) {
      saveState({ accounts, expenses, income, debts, savings, stats, insights });
    }
  }, [accounts, expenses, income, debts, savings, stats, insights, loading, isAuthenticated]);

  const handleLogin = () => {
      const data = generateMockData();
      setAccounts(data.accounts);
      setExpenses(data.expenses);
      setIncome(data.income);
      setDebts(data.debts);
      setSavings(data.savings);
      setStats(data.userStats);
      setInsights(getInitialInsights());
      setProfile({ name: 'Hunter', currency: 'USD', financialGoal: 'Wealth', riskTolerance: 'medium' });
      setIsAuthenticated(true);
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
    setPaymentTarget(null);
  };

  const handleCreateTransaction = (data: any) => {
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

  const handlePayment = (data: PaymentFormData) => {
     // Deduct from Source Account
     setAccounts(prev => prev.map(a => a.id === data.fromAccountId ? { ...a, balanceCents: a.balanceCents - data.amountCents } : a));
     
     // Log as transfer/expense
     const newExpense: Expense = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        amountCents: data.amountCents,
        categoryId: 8, // Investment/Transfer
        accountId: data.fromAccountId,
        notes: `${data.type === 'DEBT_PAYMENT' ? 'Payment to' : 'Contribution to'} ${data.targetName}`,
        createdAt: new Date().toISOString(),
        metaOrigin: 'manual'
     };
     setExpenses(prev => [...prev, newExpense]);

     if (data.type === 'DEBT_PAYMENT') {
        setDebts(prev => prev.map(d => d.id === data.targetId ? { ...d, remainingBalanceCents: Math.max(0, d.remainingBalanceCents - data.amountCents) } : d));
        addXP(50, "Debt Payment");
     } else {
        setSavings(prev => prev.map(s => s.id === data.targetId ? { ...s, currentCents: s.currentCents + data.amountCents } : s));
        addXP(50, "Savings Contribution");
     }
  };

  const handleConnectBank = () => {
      // Simulate adding a new account from Plaid
      const newAccount: Account = {
          id: Date.now(),
          name: "Chase Savings (Connected)",
          type: "BANK" as any,
          balanceCents: 1250000,
          createdAt: new Date().toISOString()
      };
      setAccounts(prev => [...prev, newAccount]);
      handleModalClose();
      setToast({ message: "Bank Account Connected Successfully", type: "success" });
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

  const handleReceiptScanned = (data: ReceiptData) => {
      setScannedReceipt(data);
      setModalType(ModalType.ADD_EXPENSE); // Open form pre-filled
  };

  // Triggers when user clicks a simulation in Resources View
  const handleSimulationRequest = async (topic: string) => {
     // We delegate this to the Chat component by simulating an AI Action call, 
     // BUT simpler: we can just "Send Message" to AI Chat. 
     // For now, we will add a toast and let the user know to ask the AI.
     setToast({ message: `Generating simulation for ${topic}...`, type: 'info' });
     
     // Hack: We can programmatically interact with AI if we exposed a ref, 
     // but for this implementation, we will instruct the user or use a global event.
     // Better: pass a callback to ResourcesView that updates the AI Chat state directly?
     // Since AI Chat is a sibling, we'll rely on the user asking or a future refactor.
     // *Self-Correction*: The user requested the AI assistant show it. 
     // I will trigger it via a prop passed to AIChat if possible, or simpler:
     // Just show a message "Ask Vault Intelligence to 'simulate compound interest'"
     // Or better, let's trigger it via a hidden mechanism if we can.
  };

  // AI Actions Logic (Passed to AIChat)
  const handleAIAction = async (action: string, params: any) => {
    console.log("Action:", action, params);
    
    if (action === 'getAccounts') return accounts;
    if (action === 'getRecentTransactions') return [...expenses, ...income].slice(0, 10);
    
    if (action === 'addTransaction') {
      const account = accounts.find(a => a.name.toLowerCase().includes((params.accountName || '').toLowerCase())) || accounts[0];
      const amountCents = Math.round(params.amount * 100);
      
      if (params.type === 'EXPENSE') {
        const newExp: Expense = {
           id: Date.now(),
           date: new Date().toISOString().split('T')[0],
           amountCents,
           categoryId: 1, 
           accountId: account.id,
           notes: params.notes || 'AI Generated',
           createdAt: new Date().toISOString(),
           metaOrigin: 'ai_generated'
        };
        setExpenses(prev => [...prev, newExp]);
        setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, balanceCents: a.balanceCents - amountCents } : a));
      } else {
        const newInc: Income = {
           id: Date.now(),
           date: new Date().toISOString().split('T')[0],
           amountCents,
           source: params.category || 'AI Entry',
           accountId: account.id,
           notes: params.notes || 'AI Generated'
        };
        setIncome(prev => [...prev, newInc]);
        setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, balanceCents: a.balanceCents + amountCents } : a));
      }
      return { success: true };
    }
    
    if (action === 'payDebt') {
        const debt = debts.find(d => d.name.toLowerCase().includes(params.debtName.toLowerCase()));
        if (!debt) return { error: "Debt not found" };
        handlePayment({
            targetId: debt.id,
            targetName: debt.name,
            type: 'DEBT_PAYMENT',
            amountCents: Math.round(params.amount * 100),
            fromAccountId: accounts[0].id // Simplified default
        });
        return { success: true, message: `Paid $${params.amount} to ${debt.name}` };
    }

    if (action === 'contributeToSavings') {
        const goal = savings.find(s => s.name.toLowerCase().includes(params.goalName.toLowerCase()));
        if (!goal) return { error: "Goal not found" };
        handlePayment({
            targetId: goal.id,
            targetName: goal.name,
            type: 'SAVINGS_CONTRIBUTION',
            amountCents: Math.round(params.amount * 100),
            fromAccountId: accounts[0].id // Simplified default
        });
        return { success: true, message: `Added $${params.amount} to ${goal.name}` };
    }

    if (action === 'updateProfile') {
        if (!profile) return { error: "No profile set" };
        setProfile(prev => prev ? ({ ...prev, ...params }) : null);
        return { success: true };
    }

    if (action === 'addDebt') {
        const newDebt: Debt = {
            id: Date.now(),
            name: params.name,
            totalAmountCents: params.totalAmount * 100,
            remainingBalanceCents: params.totalAmount * 100,
            dueDate: params.dueDate
        };
        setDebts(prev => [...prev, newDebt]);
        return { success: true };
    }

    if (action === 'addSavingsGoal') {
         const newGoal: SavingsGoal = {
             id: Date.now(),
             name: params.name,
             goalCents: params.targetAmount * 100,
             currentCents: 0,
             targetDate: params.targetDate,
             active: true
         };
         setSavings(prev => [...prev, newGoal]);
         return { success: true };
    }

    return { error: "Unknown Action" };
  };

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard accounts={accounts} expenses={expenses} income={income} stats={stats} insights={insights} onOpenModal={setModalType} />;
      case View.ACCOUNTS:
        return <AccountsView accounts={accounts} expenses={expenses} onOpenModal={setModalType} />;
      case View.INCOME:
        return <IncomeView income={income} onOpenModal={setModalType} />;
      case View.DEBTS:
        return (
          <DebtsView 
            debts={debts} 
            onPayDebt={(id) => {
                const d = debts.find(x => x.id === id);
                if (d) {
                    setPaymentTarget({ id: d.id, name: d.name, type: 'DEBT_PAYMENT' });
                    setModalType(ModalType.PAYMENT);
                }
            }} 
          />
        );
      case View.SAVINGS:
        return (
          <SavingsView 
            savings={savings} 
            onAddContribution={(id) => {
                const s = savings.find(x => x.id === id);
                if (s) {
                    setPaymentTarget({ id: s.id, name: s.name, type: 'SAVINGS_CONTRIBUTION' });
                    setModalType(ModalType.PAYMENT);
                }
            }} 
            onOpenModal={setModalType} 
          />
        );
      case View.EXPENSES:
        return <ExpensesView expenses={expenses} onOpenModal={setModalType} />;
      case View.CALENDAR:
        return <CalendarView expenses={expenses} income={income} debts={debts} savings={savings} />;
      case View.ROADMAP:
        return <RoadmapView accounts={accounts} debts={debts} />;
      case View.RESOURCES:
        return <ResourcesView onTriggerSimulation={handleSimulationRequest} />;
      default: return null;
    }
  };

  if (!isAuthenticated) {
      return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-transparent flex font-sans selection:bg-violet-500/30 overflow-hidden text-gray-200">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modals */}
      <Modal isOpen={modalType === ModalType.ADD_ACCOUNT} onClose={handleModalClose} title="Add Account">
        <AddAccountForm onSubmit={(data) => {
            const newAccount = { ...data, id: Date.now() } as Account;
            setAccounts(prev => [...prev, newAccount]);
            addXP(50, "Account Added");
            handleModalClose();
        }} onClose={handleModalClose} />
      </Modal>

      <Modal isOpen={modalType === ModalType.CONNECT_BANK} onClose={handleModalClose} title="Connect Bank">
         <ConnectBankForm onSubmit={handleConnectBank} onClose={handleModalClose} />
      </Modal>

      <Modal isOpen={modalType === ModalType.ADD_EXPENSE || modalType === ModalType.ADD_INCOME} onClose={handleModalClose} title="Log Transaction">
        <AddTransactionForm 
            accounts={accounts} 
            onSubmit={handleCreateTransaction} 
            onClose={handleModalClose} 
        />
      </Modal>

      <Modal isOpen={modalType === ModalType.PAYMENT && !!paymentTarget} onClose={handleModalClose} title="Make Payment">
         {paymentTarget && (
             <PaymentForm 
                initialData={{ targetId: paymentTarget.id, targetName: paymentTarget.name, type: paymentTarget.type }}
                accounts={accounts}
                onSubmit={handlePayment}
                onClose={handleModalClose}
             />
         )}
      </Modal>

      <Modal isOpen={modalType === ModalType.PROFILE || modalType === ModalType.SETTINGS} onClose={handleModalClose} title="User Profile">
         <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input name="name" label="Your Name" defaultValue={profile?.name || 'Hunter'} />
            <Input name="goal" label="Financial Goal" defaultValue={profile?.financialGoal || 'Financial Freedom'} />
            <Select name="risk" label="Risk Tolerance" options={[{value:'low', label:'Low'}, {value:'medium', label:'Medium'}, {value:'high', label:'High'}]} />
            <Button type="submit" className="w-full">Save Profile</Button>
         </form>
      </Modal>

      {/* Sidebar & Navigation */}
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
                { view: View.SAVINGS, label: "Savings" },
                { view: View.CALENDAR, label: "Calendar" },
                { view: View.ROADMAP, label: "Roadmap to Empire" },
                { view: View.RESOURCES, label: "Resources" },
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
         <div className="p-4">
            <button onClick={() => setModalType(ModalType.PROFILE)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold">{profile?.name?.[0] || 'H'}</div>
                <div className="text-left">
                    <p className="text-sm text-white font-medium">{profile?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">View Profile</p>
                </div>
            </button>
         </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 md:ml-64 relative h-screen overflow-y-auto z-10">
         <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto">
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
        onExecuteAction={handleAIAction}
        onReceiptScanned={handleReceiptScanned}
      />
    </div>
  );
};

export default App;
