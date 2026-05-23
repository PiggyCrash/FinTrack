import { z } from 'zod';





export const TRANSACTION_TYPES = ['expense', 'income', 'saving', 'transfer'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CATEGORIES = [
  'investment',
  'daily foods',
  'laundry',
  'fuel',
  'additional foods',
  'emergency',
  'games',
  'electronic services',
  'administrial process',
  'saving',
  'transfer',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const SYNC_STATUSES = ['pending', 'synced'] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];





export interface Transaction {
  id: string;                  
  transaction_type: TransactionType;
  amount: number;
  currency: string;            
  category: Category;
  description: string;
  date: string;                
  sync_status: SyncStatus;
  updated_at: string;          
  created_at: string;          
}





export const ParsedTransactionSchema = z.object({
  transaction_type: z.enum(TRANSACTION_TYPES),
  amount: z.number().positive(),
  currency: z.string().default('IDR'),
  category: z.enum(CATEGORIES),
  description: z.string(),
  confidence_score: z.number().min(0).max(1),
});

export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;





export type CreateTransactionInput = Omit<
  Transaction,
  'id' | 'sync_status' | 'updated_at' | 'created_at'
>;





export interface CategorySummary {
  category: Category;
  total: number;
}

export interface MonthlySummary {
  month: string;   
  income: number;
  expense: number;
  saving: number;
}

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  byCategory: CategorySummary[];
  byMonth: MonthlySummary[];
}





export interface DailyData {
  income: number;
  expense: number;
  saving: number;
}

export type GroupBy = 'daily' | 'monthly' | 'yearly';

export interface ChartPoint {
  label: string;   
  income: number;
  expense: number;
  saving: number;
}
