import {
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from './client';
import { Transaction } from '../types/transaction';

const COLLECTION = 'transactions';


export async function upsertTransactionsToFirestore(
  rows: Transaction[]
): Promise<string[]> {
  if (rows.length === 0) return [];

  const db = getFirestoreDb();
  const BATCH_LIMIT = 500; 
  const syncedIds: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = rows.slice(i, i + BATCH_LIMIT);

    for (const row of chunk) {
      const ref = doc(db, COLLECTION, row.id);

      
      const { sync_status: _s, ...rest } = row;

      batch.set(
        ref,
        {
          ...rest,
          sync_status: 'synced',
          
          updated_at: Timestamp.fromDate(new Date(row.updated_at)),
          created_at: Timestamp.fromDate(new Date(row.created_at)),
        },
        { merge: true }   
      );
    }

    await batch.commit();
    syncedIds.push(...chunk.map((r) => r.id));
    console.log(`[Firestore] Batch committed: ${chunk.length} docs`);
  }

  return syncedIds;
}
