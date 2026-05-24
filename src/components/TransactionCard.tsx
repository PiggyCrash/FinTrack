import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../types/transaction';
import { CATEGORY_META } from '../constants/categories';
import CategoryBadge from './CategoryBadge';
import SyncStatusBadge from './SyncStatusBadge';

interface Props {
  transaction: Transaction;
  onPress?: (t: Transaction) => void;
  onLongPress?: (t: Transaction) => void;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency === 'IDR' ? 'IDR' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TransactionCard({ transaction, onPress, onLongPress }: Props) {
  const meta = CATEGORY_META[transaction.category] ?? { label: transaction.category, color: '#3B82F6', icon: '💳' };

  
  const effectiveType =
    transaction.transaction_type === 'saving' ? 'income' :
    transaction.transaction_type === 'transfer' ? 'expense' :
    transaction.transaction_type;

  const isIncome  = effectiveType === 'income';
  const isExpense = effectiveType === 'expense';

  const amountColor  = isIncome ? '#16A34A' : isExpense ? '#DC2626' : '#2563EB';
  const amountPrefix = isIncome ? '+' : isExpense ? '-' : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(transaction)}
      onLongPress={() => onLongPress?.(transaction)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: meta.color + '20' }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || meta.label}
        </Text>
        <View style={styles.row}>
          <CategoryBadge category={transaction.category} />
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <SyncStatusBadge status={transaction.sync_status} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 21 },
  middle: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  description: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  date: { color: '#94A3B8', fontSize: 11 },
  right: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  amount: { fontSize: 14, fontWeight: '700' },
});
