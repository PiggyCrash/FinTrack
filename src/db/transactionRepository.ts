import { getDb } from './client';
import {
  Transaction,
  CreateTransactionInput,
  SyncStatus,
  DashboardData,
  CategorySummary,
  MonthlySummary,
  Category,
  DailyData,
  GroupBy,
  ChartPoint,
} from '../types/transaction';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';





export async function insertTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const db = await getDb();
  const now = new Date().toISOString();
  const row: Transaction = {
    id: uuidv4(),
    ...input,
    sync_status: 'pending',
    updated_at: now,
    created_at: now,
  };

  await db.runAsync(
    `INSERT INTO transactions
      (id, transaction_type, amount, currency, category, description, date,
       sync_status, updated_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.transaction_type,
      row.amount,
      row.currency,
      row.category,
      row.description,
      row.date,
      row.sync_status,
      row.updated_at,
      row.created_at,
    ]
  );

  return row;
}





export async function getTransactions(
  limit = 50,
  offset = 0
): Promise<Transaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Transaction>(
    `SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}





export async function getPendingTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE sync_status = 'pending' ORDER BY updated_at ASC`
  );
}





export async function markAsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE transactions SET sync_status = 'synced' WHERE id IN (${placeholders})`,
    ids
  );
}





export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
}





export async function getDashboardData(): Promise<DashboardData> {
  const db = await getDb();

  
  const totals = await db.getAllAsync<{ transaction_type: string; total: number }>(
    `SELECT transaction_type, SUM(amount) as total
     FROM transactions
     GROUP BY transaction_type`
  );

  let totalIncome = 0;
  let totalExpense = 0;
  let totalSaving = 0;
  for (const row of totals) {
    if (row.transaction_type === 'income') totalIncome = row.total;
    if (row.transaction_type === 'expense') totalExpense = row.total;
    if (row.transaction_type === 'saving') totalSaving = row.total;
  }

  
  const byCategory = await db.getAllAsync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total
     FROM transactions
     WHERE transaction_type = 'expense'
     GROUP BY category
     ORDER BY total DESC`
  );

  
  const byMonth = await db.getAllAsync<{
    month: string;
    income: number;
    expense: number;
    saving: number;
  }>(
    `SELECT
       strftime('%Y-%m', date) as month,
       SUM(CASE WHEN transaction_type = 'income'  THEN amount ELSE 0 END) as income,
       SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expense,
       SUM(CASE WHEN transaction_type = 'saving'  THEN amount ELSE 0 END) as saving
     FROM transactions
     WHERE date >= date('now', '-6 months')
     GROUP BY month
     ORDER BY month ASC`
  );

  return {
    totalBalance: totalIncome - totalExpense - totalSaving,
    totalIncome,
    totalExpense,
    totalSaving,
    byCategory: byCategory.map((r) => ({
      category: r.category as Category,
      total: r.total,
    })) as CategorySummary[],
    byMonth: byMonth as MonthlySummary[],
  };
}





export async function getDailyData(dateStr: string): Promise<DailyData> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ transaction_type: string; total: number }>(
    `SELECT transaction_type, SUM(amount) as total
     FROM transactions
     WHERE date(date) = date(?)
     GROUP BY transaction_type`,
    [dateStr]
  );
  let income = 0, expense = 0, saving = 0;
  for (const r of rows) {
    
    if (r.transaction_type === 'income')   income  += r.total;
    if (r.transaction_type === 'saving')   income  += r.total;
    if (r.transaction_type === 'expense')  expense += r.total;
    if (r.transaction_type === 'transfer') expense += r.total;
  }
  return { income, expense, saving };
}





export async function getChartData(
  groupBy: GroupBy,
  startDate: string,
  endDate: string
): Promise<ChartPoint[]> {
  const db = await getDb();

  const fmt =
    groupBy === 'daily'   ? '%m-%d' :
    groupBy === 'monthly' ? '%Y-%m' :
                            '%Y';

  const rows = await db.getAllAsync<{
    label: string; income: number; expense: number; saving: number;
  }>(
    `SELECT
       strftime('${fmt}', date) as label,
       SUM(CASE WHEN transaction_type IN ('income','saving')   THEN amount ELSE 0 END) as income,
       SUM(CASE WHEN transaction_type IN ('expense','transfer') THEN amount ELSE 0 END) as expense,
       0 as saving
     FROM transactions
     WHERE date(date) BETWEEN date(?) AND date(?)
     GROUP BY label
     ORDER BY label ASC`,
    [startDate, endDate]
  );
  return rows as ChartPoint[];
}





export async function getCategoryDataRange(
  startDate: string,
  endDate: string
): Promise<CategorySummary[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total
     FROM transactions
     WHERE transaction_type = 'expense'
       AND date(date) BETWEEN date(?) AND date(?)
     GROUP BY category
     ORDER BY total DESC`,
    [startDate, endDate]
  );
  return rows.map(r => ({ category: r.category as Category, total: r.total }));
}
