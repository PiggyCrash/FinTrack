import { useState, useCallback } from 'react';
import {
  getTransactions,
  insertTransaction,
  deleteTransaction,
} from '../db/transactionRepository';
import { Transaction, CreateTransactionInput } from '../types/transaction';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getTransactions(limit, offset);
      setTransactions(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (input: CreateTransactionInput) => {
    setError(null);
    try {
      const row = await insertTransaction(input);
      setTransactions((prev) => [row, ...prev]);
      return row;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save transaction.');
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete transaction.');
    }
  }, []);

  return { transactions, loading, error, load, add, remove };
}
