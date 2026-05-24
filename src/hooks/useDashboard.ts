import { useState, useCallback, useEffect } from 'react';
import {
  getDailyData,
  getChartData,
  getCategoryDataRange,
} from '../db/transactionRepository';
import { DailyData, GroupBy, ChartPoint, CategorySummary } from '../types/transaction';



function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]; 
}

function getRangeForGroupBy(groupBy: GroupBy, anchorDate: Date): { start: string; end: string } {
  const d = new Date(anchorDate);
  if (groupBy === 'daily') {
    
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    return { start: toDateStr(start), end: toDateStr(d) };
  }
  if (groupBy === 'monthly') {
    
    const start = new Date(d.getFullYear() - 1, d.getMonth() + 1, 1);
    return { start: toDateStr(start), end: toDateStr(d) };
  }
  
  const start = new Date(d.getFullYear() - 4, 0, 1);
  return { start: toDateStr(start), end: toDateStr(d) };
}



export function useDashboard() {
  const today = new Date();

  
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  
  const [groupBy, setGroupBy] = useState<GroupBy>('monthly');

  
  const [dailyData, setDailyData]       = useState<DailyData>({ income: 0, expense: 0, saving: 0 });
  const [chartData, setChartData]       = useState<ChartPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const refresh = useCallback(async (date: Date = selectedDate, gb: GroupBy = groupBy) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = toDateStr(date);
      const { start, end } = getRangeForGroupBy(gb, date);

      const [daily, chart, category] = await Promise.all([
        getDailyData(dateStr),
        getChartData(gb, start, end),
        getCategoryDataRange(start, end),
      ]);

      setDailyData(daily);
      setChartData(chart);
      setCategoryData(category);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, groupBy]);

  
  useEffect(() => {
    refresh(selectedDate, groupBy);
  }, [selectedDate, groupBy]);

  const changeDate = useCallback((delta: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }, []);

  const changeGroupBy = useCallback((gb: GroupBy) => {
    setGroupBy(gb);
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    groupBy,
    dailyData,
    chartData,
    categoryData,
    loading,
    error,
    refresh,
    changeDate,
    changeGroupBy,
  };
}
