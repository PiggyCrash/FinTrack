import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category } from '../types/transaction';
import { CATEGORY_META } from '../constants/categories';

interface Props {
  category: Category;
  small?: boolean;
}

export default function CategoryBadge({ category, small }: Props) {
  const meta = CATEGORY_META[category];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.color + '28' },
        small && styles.small,
      ]}
    >
      <Text style={[styles.text, { color: meta.color }, small && styles.smallText]}>
        {meta.icon} {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smallText: {
    fontSize: 10,
  },
});
