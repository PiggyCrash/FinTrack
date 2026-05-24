import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { runMigrations } from '../src/db/migrations';
import { startNetworkMonitor } from '../src/sync/networkMonitor';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    
    
    runMigrations()
      .then(() => {
        startNetworkMonitor();
        setDbReady(true);
      })
      .catch((e) => {
        console.error('[DB] Migration failed:', e);
        
        setDbReady(true);
      });
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
