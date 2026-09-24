export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://corinnaakr.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const fields = req.body;
  if (!fields || typeof fields !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE}/${process.env.AIRTABLE_TABLE}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!airtableRes.ok) {
      const body = await airtableRes.text();
      console.error('Airtable error:', airtableRes.status, body);
      return res.status(502).json({ error: 'Failed to save response' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
