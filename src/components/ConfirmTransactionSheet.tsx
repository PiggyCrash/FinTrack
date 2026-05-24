import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { ParsedTransaction } from '../types/transaction';
import { CATEGORY_META } from '../constants/categories';
import { CATEGORIES } from '../types/transaction';
import type { Category, TransactionType } from '../types/transaction';

type DisplayType = 'income' | 'expense';

function toDisplayType(t: TransactionType): DisplayType {
  return t === 'income' || t === 'saving' ? 'income' : 'expense';
}

interface Props {
  visible: boolean;
  parsed: ParsedTransaction | null;
  transcript?: string;
  onConfirm: (data: ParsedTransaction & { date: string }) => void;
  onCancel: () => void;
}

export default function ConfirmTransactionSheet({
  visible,
  parsed,
  transcript,
  onConfirm,
  onCancel,
}: Props) {
  const [displayType, setDisplayType] = useState<DisplayType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    if (parsed) {
      setDisplayType(toDisplayType(parsed.transaction_type));
      setAmount(String(parsed.amount));
      setCategory(parsed.category);
      setDescription(parsed.description);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [parsed]);

  const handleConfirm = () => {
    if (!amount || isNaN(Number(amount))) return;
    onConfirm({
      transaction_type: displayType,
      amount: parseFloat(amount),
      currency: parsed?.currency ?? 'IDR',
      category,
      description,
      confidence_score: parsed?.confidence_score ?? 1,
      date: new Date(date).toISOString(),
    });
  };

  const selectedMeta = CATEGORY_META[category];

  return (
    <>
      {}
      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.title}>Confirm Transaction</Text>

              {}
              {transcript ? (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptLabel}>🤖 AI Parsed From:</Text>
                  <Text style={styles.transcriptText} numberOfLines={3}>
                    "{transcript}"
                  </Text>
                </View>
              ) : null}

              {}
              <Text style={styles.label}>Transaction Type</Text>
              <View style={styles.typeRow}>
                {(['income', 'expense'] as DisplayType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, displayType === t && styles.typeChipActive]}
                    onPress={() => setDisplayType(t)}
                  >
                    <Text style={[styles.typeChipText, displayType === t && styles.typeChipTextActive]}>
                      {t === 'income' ? '💰 Income' : '💸 Expense'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {}
              <Text style={styles.label}>Amount (IDR)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />

              {}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for?"
                placeholderTextColor="#94A3B8"
              />

              {}
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />

              {}
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowCategoryDropdown(true)}
              >
                <View style={styles.dropdownLeft}>
                  <View style={[styles.dropdownIconWrap, { backgroundColor: selectedMeta.color + '20' }]}>
                    <Text style={styles.dropdownIcon}>{selectedMeta.icon}</Text>
                  </View>
                  <Text style={styles.dropdownValue}>{selectedMeta.label}</Text>
                </View>
                <Text style={styles.dropdownChevron}>›</Text>
              </TouchableOpacity>

              {}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmText}>💾 Save Transaction</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        visible={showCategoryDropdown}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.handle} />
            <Text style={styles.pickerTitle}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const meta = CATEGORY_META[item];
                const active = category === item;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, active && styles.pickerItemActive]}
                    onPress={() => {
                      setCategory(item);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <View style={[styles.pickerItemIcon, { backgroundColor: meta.color + '20' }]}>
                      <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                    </View>
                    <Text style={[styles.pickerItemLabel, active && { color: '#2563EB', fontWeight: '700' }]}>
                      {meta.label}
                    </Text>
                    {active && <Text style={styles.pickerCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => setShowCategoryDropdown(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  transcriptBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  transcriptLabel: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  transcriptText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  label: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    color: '#1E293B',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#FFF',
  },
  
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownIcon: { fontSize: 18 },
  dropdownValue: { color: '#1E293B', fontSize: 15, fontWeight: '600' },
  dropdownChevron: { color: '#94A3B8', fontSize: 22, fontWeight: '300' },
  
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 4,
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 2,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  confirmText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '70%',
  },
  pickerTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  pickerItemActive: { backgroundColor: '#EFF6FF' },
  pickerItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemLabel: { flex: 1, color: '#475569', fontSize: 15, fontWeight: '500' },
  pickerCheck: { color: '#2563EB', fontSize: 16, fontWeight: '700' },
  pickerCancel: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  pickerCancelText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
});
