import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SyncStatus } from '../types/transaction';

interface Props {
  status: SyncStatus;
}

export default function SyncStatusBadge({ status }: Props) {
  const isSynced = status === 'synced';
  return (
    <View style={[styles.badge, isSynced ? styles.synced : styles.pending]}>
      <Text style={styles.dot}>{isSynced ? '●' : '●'}</Text>
      <Text style={[styles.label, isSynced ? styles.syncedText : styles.pendingText]}>
        {isSynced ? 'Synced' : 'Pending'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
  },
  synced: {
    backgroundColor: '#00D68F18',
  },
  pending: {
    backgroundColor: '#FFB30018',
  },
  dot: {
    fontSize: 7,
    lineHeight: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  syncedText: {
    color: '#00D68F',
  },
  pendingText: {
    color: '#FFB300',
  },
});
