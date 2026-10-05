import type { VercelRequest, VercelResponse } from '@vercel/node';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE;
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE;

const ALLOWED_FIELDS = new Set([
  'Submitted At',
  'Role',
  'Setting',
  'Experience',
  'Approach',
  'Engaging Rating',
  'Frustrations',
  'HELI Useful',
  'Prototype Interest',
  'Email',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE || !AIRTABLE_TABLE) {
    return res.status(500).send('Server misconfigured');
  }

  let rawFields: Record<string, unknown>;
  try {
    rawFields = req.body?.fields;
    if (!rawFields || typeof rawFields !== 'object') throw new Error();
  } catch {
    return res.status(400).send('Invalid request body');
  }

  const fields: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(rawFields)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    if (typeof value === 'number' && Number.isFinite(value)) {
      fields[key] = value;
    } else if (typeof value === 'string') {
      fields[key] = value.slice(0, 5000);
    }
  }
  if (Object.keys(fields).length === 0) return res.status(400).send('No valid fields');

  const airtableRes = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  );

  if (!airtableRes.ok) {
    const err = await airtableRes.text();
    console.error('Airtable error', airtableRes.status, err);
    return res.status(502).send('Submission failed');
  }

  return res.status(200).send('OK');
}
