import { Transaction } from '../types/transaction';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

function headers(): HeadersInit {
  const h: HeadersInit = {
    'Content-Type': 'application/json',
    
    Prefer: 'resolution=merge-duplicates,return=minimal',
  };
  if (API_KEY) {
    h['Authorization'] = `Bearer ${API_KEY}`;
  }
  return h;
}


export async function upsertTransactions(
  rows: Transaction[]
): Promise<string[]> {
  if (rows.length === 0) return [];

  
  const payload = rows.map(({ sync_status: _s, ...rest }) => ({
    ...rest,
    sync_status: 'synced',
  }));

  const response = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[API] Upsert failed (${response.status}): ${errorText}`
    );
  }

  return rows.map((r) => r.id);
}
