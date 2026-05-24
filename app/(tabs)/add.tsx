import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useAudioRecorder } from '../../src/hooks/useAudioRecorder';
import { parseTextInput } from '../../src/ai/transactionParser';
import VoiceRecordButton from '../../src/components/VoiceRecordButton';
import ConfirmTransactionSheet from '../../src/components/ConfirmTransactionSheet';
import {
  ParsedTransaction,
  CATEGORIES,
  Category,
  TransactionType,
} from '../../src/types/transaction';
import { CATEGORY_META } from '../../src/constants/categories';

type InputMode = 'manual' | 'ai' | 'voice';

const DISPLAY_TYPES: TransactionType[] = ['income', 'expense'];

export default function AddScreen() {
  const { add, error: dbError } = useTransactions();
  const recorder = useAudioRecorder();

  const [mode, setMode] = useState<InputMode>('manual');
  const [saving, setSaving] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetParsed, setSheetParsed] = useState<ParsedTransaction | null>(null);
  const [sheetTranscript, setSheetTranscript] = useState('');

  
  const [manualType, setManualType] = useState<TransactionType>('expense');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState<Category>('other');
  const [manualDesc, setManualDesc] = useState('');
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  

  const handleManualSave = async () => {
    if (!manualAmount || isNaN(Number(manualAmount))) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      const result = await add({
        transaction_type: manualType,
        amount: parseFloat(manualAmount),
        currency: 'IDR',
        category: manualCategory,
        description: manualDesc,
        date: new Date(manualDate).toISOString(),
      });
      if (result) {
        setManualAmount('');
        setManualDesc('');
        Alert.alert('✅ Saved', 'Transaction recorded locally.', [
          { text: 'OK', onPress: () => router.push('/(tabs)/history') },
        ]);
      } else {
        Alert.alert(
          '❌ Save Failed',
          dbError ?? 'Could not save the transaction. Please try again.'
        );
      }
    } catch (e) {
      Alert.alert('❌ Error', e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleAiSubmit = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const parsed = await parseTextInput(aiText.trim());
      setSheetParsed(parsed);
      setSheetTranscript(aiText.trim());
      setSheetVisible(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Parsing failed.';
      
      const isUserFacing = msg.startsWith("Hmm");
      Alert.alert(isUserFacing ? "🤔 Couldn't Parse" : '⚠️ AI Error', msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (recorder.state === 'idle') {
      await recorder.start();
    } else if (recorder.state === 'recording') {
      await recorder.stop();
    }
  };

  
  React.useEffect(() => {
    if (recorder.state === 'done' && recorder.parsed) {
      setSheetParsed(recorder.parsed);
      setSheetTranscript(recorder.transcript);
      setSheetVisible(true);
    }
  }, [recorder.state]);

  const handleSheetConfirm = async (data: ParsedTransaction & { date: string }) => {
    setSheetVisible(false);
    setSaving(true);
    const result = await add({
      transaction_type: data.transaction_type,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      description: data.description,
      date: data.date,
    });
    setSaving(false);
    recorder.reset();
    setAiText('');
    if (result) {
      Alert.alert('✅ Saved', 'Transaction recorded locally.', [
        { text: 'OK', onPress: () => router.push('/(tabs)/history') },
      ]);
    }
  };

  

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {}
        <View style={styles.header}>
          <Text style={styles.title}>Add Transaction</Text>
          <Text style={styles.subtitle}>Choose how to record</Text>
        </View>

        {}
        <View style={styles.modeRow}>
          {(['manual', 'ai', 'voice'] as InputMode[]).map((m) => {
            const icons = { manual: '✏️', ai: '🤖', voice: '🎙️' };
            const labels = { manual: 'Manual', ai: 'AI Chat', voice: 'Voice' };
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeChip, mode === m && styles.modeChipActive]}
                onPress={() => { setMode(m); recorder.reset(); }}
              >
                <Text style={styles.modeIcon}>{icons[m]}</Text>
                <Text style={[styles.modeLabel, mode === m && styles.modeLabelActive]}>
                  {labels[m]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {}
        {mode === 'manual' && (
          <View style={styles.section}>
            {}
            <Text style={styles.label}>Transaction Type</Text>
            <View style={styles.chipRow}>
              {DISPLAY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, manualType === t && styles.chipActive]}
                  onPress={() => setManualType(t)}
                >
                  <Text style={[styles.chipText, manualType === t && styles.chipTextActive]}>
                    {t === 'income' ? '💰 Income' : '💸 Expense'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {}
            <Text style={styles.label}>Amount (IDR)</Text>
            <TextInput
              style={styles.input}
              value={manualAmount}
              onChangeText={setManualAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#94A3B8"
            />

            {}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={manualDesc}
              onChangeText={setManualDesc}
              placeholder="What was this for?"
              placeholderTextColor="#94A3B8"
            />

            {}
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={manualDate}
              onChangeText={setManualDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
            />

            {}
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCategoryDropdown(true)}>
              <View style={styles.dropdownLeft}>
                <View style={[styles.dropdownIconWrap, { backgroundColor: CATEGORY_META[manualCategory].color + '20' }]}>
                  <Text style={styles.dropdownIcon}>{CATEGORY_META[manualCategory].icon}</Text>
                </View>
                <Text style={styles.dropdownValue}>{CATEGORY_META[manualCategory].label}</Text>
              </View>
              <Text style={styles.dropdownChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleManualSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>💾 Save Transaction</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {}
        {mode === 'ai' && (
          <View style={styles.section}>
            <View style={styles.aiBanner}>
              <Text style={styles.aiBannerTitle}>🤖 AI Financial Parser</Text>
              <Text style={styles.aiBannerSub}>
                Powered by Cerebras llama3.1-8b · Ultra-low latency
              </Text>
            </View>

            <Text style={styles.label}>Describe your transaction</Text>
            <TextInput
              style={[styles.input, styles.aiInput]}
              value={aiText}
              onChangeText={setAiText}
              placeholder={'e.g. "Spent 45000 on lunch at Warung Padang today"'}
              placeholderTextColor="#4A5070"
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.saveBtn, (aiLoading || !aiText.trim()) && styles.saveBtnDisabled]}
              onPress={handleAiSubmit}
              disabled={aiLoading || !aiText.trim()}
            >
              {aiLoading ? (
                <View style={styles.row}>
                  <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Parsing with AI…</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>✨ Parse & Review</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>
              💡 Try: "Transferred 200K savings yesterday" or "Bought game voucher 50K"
            </Text>
          </View>
        )}

        {}
        {mode === 'voice' && (
          <View style={[styles.section, styles.voiceSection]}>
            <View style={styles.aiBanner}>
              <Text style={styles.aiBannerTitle}>🎙️ Voice + AI</Text>
              <Text style={styles.aiBannerSub}>
                Whisper STT → Cerebras AI → Auto-parsed
              </Text>
            </View>

            <View style={styles.voiceCenter}>
              <VoiceRecordButton
                state={recorder.state}
                onPress={handleVoiceToggle}
              />
            </View>

            {recorder.recordingUri && (
              <View style={styles.playbackCard}>
                <View style={styles.playbackHeader}>
                  <Text style={styles.playbackTitle}>
                    {recorder.state === 'error' ? '✅ Recording Captured Successfully' : '🔊 Voice Recording'}
                  </Text>
                  <Text style={styles.playbackSubtitle}>
                    {recorder.state === 'error'
                      ? ''
                      : 'Listen to your voice recording'}
                  </Text>
                </View>

                <View style={styles.playbackRow}>
                  <TouchableOpacity
                    style={[styles.playBtn, recorder.isPlaying && styles.playBtnActive]}
                    onPress={recorder.isPlaying ? recorder.stopPlayback : recorder.playRecording}
                  >
                    <Text style={styles.playBtnText}>
                      {recorder.isPlaying ? '⏸️ Stop Playback' : '▶️ Play Recording'}
                    </Text>
                  </TouchableOpacity>

                  {recorder.isPlaying ? (
                    <View style={styles.playingIndicator}>
                      <View style={[styles.waveBar, styles.waveBar1]} />
                      <View style={[styles.waveBar, styles.waveBar2]} />
                      <View style={[styles.waveBar, styles.waveBar3]} />
                      <View style={[styles.waveBar, styles.waveBar4]} />
                    </View>
                  ) : (
                    <Text style={styles.recordingStatusText}>Recording Ready</Text>
                  )}
                </View>
              </View>
            )}

            {recorder.error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorCardText}>{recorder.error}</Text>
                {recorder.error.includes('quota') || recorder.error.includes('API key') ? (
                  <TouchableOpacity
                    style={styles.errorCardBtn}
                    onPress={() => { recorder.reset(); setMode('ai'); }}
                  >
                    <Text style={styles.errorCardBtnText}>Switch to AI Chat →</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {recorder.state === 'done' && recorder.transcript && (
              <View style={styles.transcriptPreview}>
                <Text style={styles.transcriptLabel}>📝 Transcript</Text>
                <Text style={styles.transcriptText}>"{recorder.transcript}"</Text>
              </View>
            )}

            <Text style={styles.hint}>
              💡 Speak clearly: "Beli bensin 80 ribu tadi pagi"
            </Text>
          </View>
        )}
      </ScrollView>

      {}
      <Modal visible={showCategoryDropdown} transparent animationType="slide">
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownSheet}>
            <View style={styles.dropdownHandle} />
            <Text style={styles.dropdownTitle}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const meta = CATEGORY_META[item];
                const active = manualCategory === item;
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                    onPress={() => { setManualCategory(item); setShowCategoryDropdown(false); }}
                  >
                    <View style={[styles.dropdownItemIcon, { backgroundColor: meta.color + '20' }]}>
                      <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                    </View>
                    <Text style={[styles.dropdownItemLabel, active && { color: '#2563EB', fontWeight: '700' }]}>
                      {meta.label}
                    </Text>
                    {active && <Text style={styles.dropdownCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity style={styles.dropdownCancel} onPress={() => setShowCategoryDropdown(false)}>
              <Text style={styles.dropdownCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <ConfirmTransactionSheet
        visible={sheetVisible}
        parsed={sheetParsed}
        transcript={sheetTranscript}
        onConfirm={handleSheetConfirm}
        onCancel={() => {
          setSheetVisible(false);
          recorder.reset();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F0F5FF' },
  content: { paddingBottom: 60 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : (StatusBar.currentHeight ?? 24) + 12,
    paddingBottom: 20,
    backgroundColor: '#2563EB',
  },
  title: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 },
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 5,
    gap: 4,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 3,
  },
  modeChipActive: { backgroundColor: '#2563EB' },
  modeIcon: { fontSize: 18 },
  modeLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  modeLabelActive: { color: '#FFF' },
  section: { paddingHorizontal: 16 },
  voiceSection: { alignItems: 'stretch' },
  voiceCenter: { alignItems: 'center', paddingVertical: 40 },
  label: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    color: '#1E293B',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  aiInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF' },
  catChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    marginRight: 6,
  },
  catChipText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  aiBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    marginBottom: 4,
  },
  aiBannerTitle: { color: '#1E293B', fontSize: 15, fontWeight: '700' },
  aiBannerSub: { color: '#64748B', fontSize: 12, marginTop: 3 },
  hint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: '#EF4444', fontSize: 13 },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorCardText: {
    color: '#DC2626',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  errorCardBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  errorCardBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  playbackCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
    shadowColor: '#0F766E',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  playbackHeader: {
    marginBottom: 12,
  },
  playbackTitle: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700',
  },
  playbackSubtitle: {
    color: '#0D9488',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  playBtnActive: {
    backgroundColor: '#0F766E',
  },
  playBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 16,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#0D9488',
    borderRadius: 1.5,
  },
  waveBar1: { height: 12 },
  waveBar2: { height: 16 },
  waveBar3: { height: 10 },
  waveBar4: { height: 14 },
  recordingStatusText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '500',
  },
  transcriptPreview: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  transcriptLabel: { color: '#2563EB', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  transcriptText: { color: '#64748B', fontSize: 13, fontStyle: 'italic' },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dropdownIcon: { fontSize: 18 },
  dropdownValue: { color: '#1E293B', fontSize: 15, fontWeight: '600' },
  dropdownChevron: { color: '#94A3B8', fontSize: 20, fontWeight: '300' },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  dropdownSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 32,
    maxHeight: '70%',
  },
  dropdownHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 12 },
  dropdownTitle: { color: '#1E293B', fontSize: 17, fontWeight: '700', paddingHorizontal: 20, marginBottom: 8 },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 13,
  },
  dropdownItemActive: { backgroundColor: '#EFF6FF' },
  dropdownItemIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dropdownItemLabel: { flex: 1, color: '#475569', fontSize: 15, fontWeight: '500' },
  dropdownCheck: { color: '#2563EB', fontSize: 16, fontWeight: '700' },
  dropdownCancel: {
    margin: 16, marginTop: 8, backgroundColor: '#F1F5F9',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  dropdownCancelText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
