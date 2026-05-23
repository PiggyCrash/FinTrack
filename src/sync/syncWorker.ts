import { getPendingTransactions, markAsSynced } from '../db/transactionRepository';
import { upsertTransactionsToFirestore } from '../firebase/firestoreSync';

let isSyncing = false;


export async function runSync(): Promise<{
  synced: number;
  failed: number;
  error?: string;
}> {
  if (isSyncing) {
    console.log('[Sync] Already running, skipping.');
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;

  try {
    const pending = await getPendingTransactions();

    if (pending.length === 0) {
      console.log('[Sync] Nothing to sync.');
      return { synced: 0, failed: 0 };
    }

    console.log(`[Sync] Pushing ${pending.length} pending transaction(s) to Firestore...`);

    
    const syncedIds = await upsertTransactionsToFirestore(pending);

    await markAsSynced(syncedIds);

    console.log(`[Sync] ✓ Synced ${syncedIds.length} transaction(s) to Firestore.`);
    return { synced: syncedIds.length, failed: 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Sync] ✗ Firestore sync failed:', message);
    return { synced: 0, failed: 1, error: message };
  } finally {
    isSyncing = false;
  }
}
