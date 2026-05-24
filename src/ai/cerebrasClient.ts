import OpenAI from 'openai';
import { ParsedTransaction, ParsedTransactionSchema, CATEGORIES, TRANSACTION_TYPES } from '../types/transaction';

const CEREBRAS_API_KEY = process.env.EXPO_PUBLIC_CEREBRAS_API_KEY ?? '';
const MODEL = 'llama3.1-8b';

const client = new OpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: CEREBRAS_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a structured data extractor for a financial tracker app used in Indonesia. Parse the user's input into JSON matching this exact schema:
{
  "transaction_type": "expense" | "income" | "saving" | "transfer",
  "amount": float,
  "currency": "IDR",
  "category": "investment" | "daily foods" | "laundry" | "fuel" | "additional foods" | "emergency" | "games" | "electronic services" | "administrial process" | "saving" | "transfer" | "other",
  "description": string,
  "confidence_score": float
}

CRITICAL RULES for amount parsing:
- "K" or "k" = multiply by 1,000. Example: "50K" = 50000, "200k" = 200000, "1.5K" = 1500
- "M" or "m" = multiply by 1,000,000. Example: "2M" = 2000000, "1.5m" = 1500000
- "rb" or "ribu" = multiply by 1,000 (Indonesian). Example: "50rb" = 50000, "200 ribu" = 200000
- "jt" or "juta" = multiply by 1,000,000 (Indonesian). Example: "2jt" = 2000000
- Always output amount as a plain integer or float, NEVER as a string.

OTHER RULES:
- Default currency is always IDR.
- Normalize category to one of the 12 allowed values. If unclear, use "other".
- "token listrik", "pulsa", "netflix", "spotify", "internet" → "electronic services"
- "makan", "warung", "kopi", "food", "lunch", "dinner" → "daily foods"
- "bensin", "bbm", "pertamina", "shell" → "fuel"
- Return ONLY valid JSON. No explanation, no markdown, no code blocks.
- confidence_score: 0.0–1.0. Set below 0.4 if the input is not a recognizable financial transaction (e.g. gibberish, questions, unrelated text).`;


function normalizeAmount(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase().replace(/,/g, '');
    const match = s.match(/^(\d+(?:\.\d+)?)\s*(k|rb|ribu|m|jt|juta|b)?$/);
    if (match) {
      const n = parseFloat(match[1]);
      const suffix = match[2] ?? '';
      if (suffix === 'k' || suffix === 'rb' || suffix === 'ribu') return n * 1_000;
      if (suffix === 'm' || suffix === 'jt' || suffix === 'juta') return n * 1_000_000;
      if (suffix === 'b') return n * 1_000_000_000;
      return n;
    }
  }
  return 0;
}


export async function parseTransactionText(
  input: string
): Promise<ParsedTransaction> {
  const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Current device time: ${now}\n\nUser input: "${input}"` },
    ],
    temperature: 0.1,
    max_tokens: 256,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('[Cerebras] Empty response from API.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`[Cerebras] Invalid JSON: ${raw}`);
  }

  
  const rawObj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  if ('amount' in rawObj) {
    rawObj.amount = normalizeAmount(rawObj.amount);
  }

  
  
  
  
  const rawConfidence = typeof rawObj.confidence_score === 'number' ? rawObj.confidence_score : 1;
  if (rawConfidence < 0.4) {
    throw new Error(
      "Hmm, I couldn't recognize a transaction in that text. Try something like:\n\n• \"Token listrik 50K\"\n• \"Makan siang 35000\"\n• \"Gaji bulan ini 5 juta\""
    );
  }

  const result = ParsedTransactionSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`[Cerebras] Schema validation failed: ${result.error.message}`);
  }

  return result.data;
}
