import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useTransactions } from '../../src/hooks/useTransactions';
import TransactionCard from '../../src/components/TransactionCard';
import { Transaction, TransactionType, TRANSACTION_TYPES } from '../../src/types/transaction';


const TYPE_FILTERS: Array<TransactionType | 'all'> = ['all', 'expense', 'income'];

const filterColors: Record<string, string> = {
  all:      '#2563EB',
  expense:  '#EF4444',
  income:   '#16A34A',
  saving:   '#10B981',
  transfer: '#F59E0B',
};

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isToday(d: Date): boolean {
  return d.toDateString() === new Date().toDateString();
}

export default function HistoryScreen() {
  const { transactions, loading, load, remove } = useTransactions();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [search, setSearch] = useState('');

  
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo,   setDateTo]   = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker,   setShowToPicker]   = useState(false);

  useFocusEffect(
    useCallback(() => { load(500); }, [])
  );

  const filtered = transactions.filter((t) => {
    const matchType = filter === 'all' || t.transaction_type === filter;
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());

    const txDate = new Date(t.date);
    const matchFrom = !dateFrom || txDate >= dateFrom;
    const matchTo   = !dateTo   || txDate <= new Date(dateTo.getTime() + 86400000 - 1);

    return matchType && matchSearch && matchFrom && matchTo;
  });

  const handleLongPress = (t: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Delete "${t.description || t.category}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(t.id) },
      ]
    );
  };

  const clearDates = () => { setDateFrom(null); setDateTo(null); };

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.count}>{filtered.length} transactions</Text>
      </View>

      {}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions..."
          placeholderTextColor="#94A3B8"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {}
      <View style={styles.dateFilterRow}>
        <TouchableOpacity style={styles.datePillBtn} onPress={() => setShowFromPicker(true)}>
          <Text style={styles.datePillLabel}>From</Text>
          <Text style={styles.datePillValue}>{dateFrom ? formatDateShort(dateFrom) : 'Any date'}</Text>
        </TouchableOpacity>

        <View style={styles.dateDivider} />

        <TouchableOpacity style={styles.datePillBtn} onPress={() => setShowToPicker(true)}>
          <Text style={styles.datePillLabel}>To</Text>
          <Text style={styles.datePillValue}>{dateTo ? formatDateShort(dateTo) : 'Any date'}</Text>
        </TouchableOpacity>

        {(dateFrom || dateTo) && (
          <TouchableOpacity style={styles.clearDateBtn} onPress={clearDates}>
            <Text style={styles.clearDateText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {}
      {showFromPicker && (
        Platform.OS === 'android' ? (
          <DateTimePicker
            value={dateFrom ?? new Date()}
            mode="date"
            display="calendar"
            maximumDate={dateTo ?? new Date()}
            onChange={(_, date) => { setShowFromPicker(false); if (date) setDateFrom(date); }}
          />
        ) : (
          <Modal transparent animationType="fade">
            <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowFromPicker(false)}>
              <View style={styles.pickerCard}>
                <DateTimePicker
                  value={dateFrom ?? new Date()}
                  mode="date"
                  display="inline"
                  maximumDate={dateTo ?? new Date()}
                  onChange={(_, date) => { if (date) setDateFrom(date); }}
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowFromPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )
      )}

      {showToPicker && (
        Platform.OS === 'android' ? (
          <DateTimePicker
            value={dateTo ?? new Date()}
            mode="date"
            display="calendar"
            minimumDate={dateFrom ?? undefined}
            maximumDate={new Date()}
            onChange={(_, date) => { setShowToPicker(false); if (date) setDateTo(date); }}
          />
        ) : (
          <Modal transparent animationType="fade">
            <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowToPicker(false)}>
              <View style={styles.pickerCard}>
                <DateTimePicker
                  value={dateTo ?? new Date()}
                  mode="date"
                  display="inline"
                  minimumDate={dateFrom ?? undefined}
                  maximumDate={new Date()}
                  onChange={(_, date) => { if (date) setDateTo(date); }}
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowToPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )
      )}

      {}
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f && { backgroundColor: (filterColors[f] ?? '#2563EB') + '18', borderColor: filterColors[f] ?? '#2563EB' },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && { color: filterColors[f] ?? '#2563EB', fontWeight: '700' }]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionCard transaction={item} onLongPress={handleLongPress} />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => load(500)} tintColor="#2563EB" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗂️</Text>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySub}>Try a different filter or add one first</Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const STATUS_BAR_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F5FF' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : STATUS_BAR_H + 16,
    paddingBottom: 16,
    backgroundColor: '#2563EB',
  },
  title: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  count: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 2 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon:  { fontSize: 15 },
  searchInput: { flex: 1, color: '#1E293B', fontSize: 14 },
  clearIcon:   { color: '#94A3B8', fontSize: 15, paddingHorizontal: 4 },

  
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden',
  },
  datePillBtn: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  datePillLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  datePillValue: { color: '#1E293B', fontSize: 13, fontWeight: '600', marginTop: 2 },
  dateDivider:   { width: 1, height: 36, backgroundColor: '#DBEAFE' },
  clearDateBtn:  { paddingHorizontal: 12, paddingVertical: 10 },
  clearDateText: { color: '#94A3B8', fontSize: 16 },

  
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerCard:    { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', width: 340 },
  pickerDone:    { backgroundColor: '#2563EB', margin: 14, borderRadius: 12, padding: 14, alignItems: 'center' },
  pickerDoneText:{ color: '#FFF', fontSize: 16, fontWeight: '700' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 7,
    marginBottom: 10,
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  filterText: { color: '#94A3B8', fontSize: 12 },

  listContent:    { paddingBottom: 30 },
  emptyContainer: { flex: 1 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { color: '#1E293B', fontSize: 18, fontWeight: '700' },
  emptySub:       { color: '#94A3B8', fontSize: 13, marginTop: 6, textAlign: 'center' },
});
