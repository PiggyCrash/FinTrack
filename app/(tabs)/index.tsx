import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import Svg, { G, Path, Rect, Text as SvgText, Line } from 'react-native-svg';
import { useDashboard } from '../../src/hooks/useDashboard';
import { CATEGORY_META } from '../../src/constants/categories';
import { CategorySummary, ChartPoint, GroupBy } from '../../src/types/transaction';

const { width } = Dimensions.get('window');
const CHART_W = width - 48;



function formatIDR(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${Math.round(n)}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isToday(d: Date): boolean {
  return d.toDateString() === new Date().toDateString();
}



function DonutChart({ data }: { data: CategorySummary[] }) {
  const SIZE = CHART_W * 0.62;
  const R = SIZE / 2 - 10;
  const INNER_R = R * 0.58;
  const CX = SIZE / 2, CY = SIZE / 2;
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) return null;

  let startAngle = -Math.PI / 2;
  const slices = data.map(d => {
    const angle = (d.total / total) * 2 * Math.PI;
    const s = { ...d, startAngle, endAngle: startAngle + angle };
    startAngle += angle;
    return s;
  });

  const arc = (sa: number, ea: number, r: number, ir: number) => {
    const x1 = CX + r * Math.cos(sa), y1 = CY + r * Math.sin(sa);
    const x2 = CX + r * Math.cos(ea), y2 = CY + r * Math.sin(ea);
    const ix1 = CX + ir * Math.cos(ea), iy1 = CY + ir * Math.sin(ea);
    const ix2 = CX + ir * Math.cos(sa), iy2 = CY + ir * Math.sin(sa);
    const lg = ea - sa > Math.PI ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${ix1},${iy1} A${ir},${ir} 0 ${lg},0 ${ix2},${iy2} Z`;
  };

  return (
    <View style={styles.donutWrap}>
      <Svg width={SIZE} height={SIZE}>
        {slices.map((s, i) => {
          const color = CATEGORY_META[s.category]?.color ?? '#3B82F6';
          const mid = (s.startAngle + s.endAngle) / 2;
          const lx = CX + R * 0.76 * Math.cos(mid);
          const ly = CY + R * 0.76 * Math.sin(mid);
          const pct = Math.round((s.total / total) * 100);
          return (
            <G key={i}>
              <Path d={arc(s.startAngle, s.endAngle, R, INNER_R)} fill={color} />
              {pct >= 8 && (
                <SvgText x={lx} y={ly} textAnchor="middle" fill="#FFF" fontSize={9} fontWeight="700">{pct}%</SvgText>
              )}
            </G>
          );
        })}
        <SvgText x={CX} y={CY - 6} textAnchor="middle" fill="#94A3B8" fontSize={9}>Total</SvgText>
        <SvgText x={CX} y={CY + 10} textAnchor="middle" fill="#1E293B" fontSize={12} fontWeight="700">
          {formatIDR(total)}
        </SvgText>
      </Svg>
      <View style={styles.donutLegend}>
        {slices.map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: CATEGORY_META[s.category]?.color ?? '#3B82F6' }]} />
            <Text style={styles.legendText} numberOfLines={1}>{CATEGORY_META[s.category]?.label ?? s.category}</Text>
            <Text style={styles.legendVal}>{formatIDR(s.total)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}



function BarChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <View style={styles.chartEmptyWrap}>
        <Text style={styles.chartEmptyText}>No data for this period</Text>
      </View>
    );
  }
  const H = 150, PAD_L = 44, PAD_B = 22;
  const chartH = H - PAD_B;
  const BAR_W = Math.max(5, Math.min(14, (CHART_W - PAD_L) / (data.length * 3)));
  const GAP = 3;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const colW = (CHART_W - PAD_L) / data.length;

  return (
    <Svg width={CHART_W} height={H}>
      {[0, 0.5, 1].map((f, i) => {
        const y = PAD_B / 2 + chartH * (1 - f);
        return (
          <G key={i}>
            <SvgText x={PAD_L - 4} y={y + 4} textAnchor="end" fill="#CBD5E1" fontSize={8}>{formatIDR(maxVal * f)}</SvgText>
            <Line x1={PAD_L} y1={y} x2={CHART_W} y2={y} stroke="#F1F5F9" strokeWidth={1} />
          </G>
        );
      })}
      {data.map((d, i) => {
        const x = PAD_L + i * colW + colW / 2;
        const incH = Math.max(2, (d.income / maxVal) * chartH);
        const expH = Math.max(2, (d.expense / maxVal) * chartH);
        const baseY = chartH + PAD_B / 2;
        return (
          <G key={i}>
            <Rect x={x - BAR_W - GAP / 2} y={baseY - incH} width={BAR_W} height={incH} fill="#3B82F6" rx={3} />
            <Rect x={x + GAP / 2}          y={baseY - expH} width={BAR_W} height={expH} fill="#F87171" rx={3} />
            <SvgText x={x} y={H - 4} textAnchor="middle" fill="#CBD5E1" fontSize={8}>
              {data.length <= 12 ? d.label : (i % 2 === 0 ? d.label : '')}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}



function SummaryCard({ label, value, color, icon, delay = 0 }: {
  label: string; value: number; color: string; icon: string; delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, [value]);
  return (
    <Animated.View style={[styles.summaryCard, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
    }]}>
      <View style={[styles.summaryIconWrap, { backgroundColor: color + '15' }]}>
        <Text style={styles.summaryIconText}>{icon}</Text>
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{formatIDR(value)}</Text>
    </Animated.View>
  );
}



const GROUP_OPTIONS: GroupBy[] = ['daily', 'monthly', 'yearly'];

export default function DashboardScreen() {
  const {
    selectedDate, setSelectedDate, groupBy,
    dailyData, chartData, categoryData,
    loading, refresh, changeDate, changeGroupBy,
  } = useDashboard();

  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(React.useCallback(() => { refresh(); }, []));

  const netToday = dailyData.income - dailyData.expense;
  const isPositive = netToday >= 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {}
      <View style={styles.dateStrip}>
        <TouchableOpacity style={styles.dateArrowBtn} onPress={() => changeDate(-1)}>
          <Text style={styles.dateArrow}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.datePill} onPress={() => setShowPicker(true)}>
          <Text style={styles.datePillText}>
            {isToday(selectedDate) ? '📅  Today' : `📅  ${formatDate(selectedDate)}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateArrowBtn, isToday(selectedDate) && { opacity: 0.3 }]}
          onPress={() => changeDate(1)}
          disabled={isToday(selectedDate)}
        >
          <Text style={styles.dateArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {}
      {showPicker && (
        Platform.OS === 'android' ? (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="calendar"
            maximumDate={new Date()}
            onChange={(_, date) => {
              setShowPicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        ) : (
          <Modal transparent animationType="fade">
            <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
              <View style={styles.pickerCard}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="inline"
                  maximumDate={new Date()}
                  onChange={(_, date) => { if (date) setSelectedDate(date); }}
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )
      )}

      {}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh()} tintColor="#2563EB" />}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>
            {isPositive ? '▲ Net Income' : '▼ Net Expense'}  ·  {formatDate(selectedDate)}
          </Text>
          <Text style={[styles.amountValue, { color: isPositive ? '#16A34A' : '#DC2626' }]}>
            {formatIDR(Math.abs(netToday))}
          </Text>
        </View>

        {}
        <View style={styles.summaryRow}>
          <SummaryCard label="Income"  value={dailyData.income}  color="#2563EB" icon="💰" delay={0}   />
          <SummaryCard label="Expense" value={dailyData.expense} color="#EF4444" icon="💸" delay={100} />
        </View>

        {}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Overview</Text>
            <View style={styles.toggleRow}>
              {GROUP_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.toggleBtn, groupBy === opt && styles.toggleBtnActive]}
                  onPress={() => changeGroupBy(opt)}
                >
                  <Text style={[styles.toggleText, groupBy === opt && styles.toggleTextActive]}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <BarChart data={chartData} />
          <View style={styles.chartLegend}>
            {[{ color: '#3B82F6', label: 'Income' }, { color: '#F87171', label: 'Expense' }].map(l => (
              <View key={l.label} style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: l.color }]} />
                <Text style={styles.chartLegendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          <Text style={styles.cardSub}>
            {groupBy === 'daily' ? 'This month' : groupBy === 'monthly' ? 'Last 12 months' : 'Last 5 years'}
          </Text>
          {categoryData.length > 0
            ? <DonutChart data={categoryData} />
            : <View style={styles.chartEmptyWrap}><Text style={styles.chartEmptyText}>No data for this period</Text></View>
          }
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}



const STATUS_BAR_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
const STRIP_PAD_TOP = Platform.OS === 'ios' ? 52 : STATUS_BAR_H + 12;

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F0F5FF' },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },

  
  dateStrip: {
    backgroundColor: '#2563EB',
    paddingTop: STRIP_PAD_TOP,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateArrowBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  dateArrow: { color: '#FFF', fontSize: 20, lineHeight: 24 },
  datePill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7,
    alignItems: 'center',
  },
  datePillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  pickerCard: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', width: width - 40 },
  pickerDone: { backgroundColor: '#2563EB', margin: 14, borderRadius: 12, padding: 14, alignItems: 'center' },
  pickerDoneText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  
  amountCard: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 12,
    backgroundColor: '#FFF', borderRadius: 20, padding: 20,
    alignItems: 'center',
    shadowColor: '#1E3A8A', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
  },
  amountLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  amountValue: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },

  
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 14,
  },
  summaryCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    shadowColor: '#1E3A8A', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
  },
  summaryIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryIconText: { fontSize: 17 },
  summaryLabel: { color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 17, fontWeight: '800' },

  
  card: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: '#FFF',
    borderRadius: 20, padding: 18,
    shadowColor: '#1E3A8A', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle:  { color: '#1E293B', fontSize: 15, fontWeight: '700' },
  cardSub:    { color: '#94A3B8', fontSize: 12, marginTop: 2, marginBottom: 12 },

  
  toggleRow: { flexDirection: 'row', gap: 3, backgroundColor: '#F1F5F9', borderRadius: 10, padding: 3 },
  toggleBtn: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  toggleText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  toggleTextActive: { color: '#FFF' },

  
  chartEmptyWrap: { height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFF', borderRadius: 12, marginVertical: 4 },
  chartEmptyText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartLegendDot: { width: 8, height: 8, borderRadius: 4 },
  chartLegendLabel: { color: '#64748B', fontSize: 12 },

  
  donutWrap:   { alignItems: 'center' },
  donutLegend: { width: '100%', marginTop: 8 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendText:  { flex: 1, color: '#475569', fontSize: 12 },
  legendVal:   { color: '#1E293B', fontSize: 12, fontWeight: '700' },
});
