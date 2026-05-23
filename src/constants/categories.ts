import { Category } from '../types/transaction';

export interface CategoryMeta {
  label: string;
  color: string;
  icon: string; 
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  investment: {
    label: 'Investment',
    color: '#6C63FF',
    icon: '📈',
  },
  'daily foods': {
    label: 'Daily Foods',
    color: '#FF6B6B',
    icon: '🍱',
  },
  laundry: {
    label: 'Laundry',
    color: '#4ECDC4',
    icon: '👕',
  },
  fuel: {
    label: 'Fuel',
    color: '#FF9F43',
    icon: '⛽',
  },
  'additional foods': {
    label: 'Additional Foods',
    color: '#FD7272',
    icon: '🧃',
  },
  emergency: {
    label: 'Emergency',
    color: '#EE5A24',
    icon: '🚨',
  },
  games: {
    label: 'Games',
    color: '#A29BFE',
    icon: '🎮',
  },
  'electronic services': {
    label: 'Electronic Services',
    color: '#00B894',
    icon: '💻',
  },
  'administrial process': {
    label: 'Administration',
    color: '#0984E3',
    icon: '📋',
  },
  saving: {
    label: 'Saving',
    color: '#10B981',
    icon: '🏦',
  },
  transfer: {
    label: 'Transfer',
    color: '#F59E0B',
    icon: '🔄',
  },
  other: {
    label: 'Other',
    color: '#636E72',
    icon: '📦',
  },
};

export const CATEGORY_COLORS = Object.entries(CATEGORY_META).map(([key, val]) => ({
  category: key as Category,
  color: val.color,
}));
