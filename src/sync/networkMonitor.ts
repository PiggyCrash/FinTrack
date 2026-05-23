import * as Network from 'expo-network';
import { runSync } from './syncWorker';

type NetworkState = Awaited<ReturnType<typeof Network.getNetworkStateAsync>>;

let _lastConnected: boolean | null = null;
let _subscription: ReturnType<typeof Network.addNetworkStateListener> | null = null;


export function startNetworkMonitor(): void {
  if (_subscription) return; 

  _subscription = Network.addNetworkStateListener(async (state: NetworkState) => {
    const isConnected = state.isConnected && state.isInternetReachable !== false;

    if (isConnected && _lastConnected === false) {
      console.log('[NetworkMonitor] Connection restored — triggering sync...');
      await runSync();
    }

    _lastConnected = isConnected ?? false;
  });

  
  Network.getNetworkStateAsync().then(async (state) => {
    const isConnected = state.isConnected && state.isInternetReachable !== false;
    _lastConnected = isConnected ?? false;
    if (isConnected) {
      console.log('[NetworkMonitor] Online at startup — triggering sync...');
      await runSync();
    }
  });

  console.log('[NetworkMonitor] Listening for network changes.');
}


export function stopNetworkMonitor(): void {
  _subscription?.remove();
  _subscription = null;
  _lastConnected = null;
}
