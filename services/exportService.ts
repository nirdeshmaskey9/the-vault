
import { Expense, Income } from '../types';
import { CATEGORIES } from '../constants';

export const exportToCSV = (expenses: Expense[], income: Income[]) => {
  const expenseRows = expenses.map(e => {
    const cat = CATEGORIES.find(c => c.id === e.categoryId)?.name || 'Unknown';
    return `EXPENSE,${e.date},-${(e.amountCents/100).toFixed(2)},${cat},${e.notes}`;
  });

  const incomeRows = income.map(i => {
    return `INCOME,${i.date},${(i.amountCents/100).toFixed(2)},${i.source},${i.notes}`;
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + "Type,Date,Amount,Category/Source,Notes\n"
    + [...incomeRows, ...expenseRows].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `vault_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
