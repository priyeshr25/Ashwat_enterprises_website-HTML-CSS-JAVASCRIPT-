/* =========================================================
   ASHWAT ENTERPRISES — server.js
   Serves the site + a /api/book endpoint that forwards
   booking submissions to Telegram. The bot token never
   reaches the browser — it only lives in .env on this server.
   ========================================================= */
require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn(
    '\n⚠️  TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.\n' +
    '   Copy .env.example to .env and fill both in, then restart.\n'
  );
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function makeRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'ASH-';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function escapeMarkdown(str) {
  return String(str).replace(/([_*[\]()`])/g, '\\$1');
}

app.post('/api/book', async (req, res) => {
  try {
    const { name, phone, email, address, service, date, time, notes } = req.body || {};

    if (!name || !phone || !email || !address || !service || !date || !time) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }
    if (!/^[0-9+\-\s()]{7,15}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number.' });
    }

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ success: false, error: 'Server is not configured yet.' });
    }

    const ref = makeRef();

    const text =
      `🐎 *New Booking — Ashwat Enterprises*\n\n` +
      `*Ref:* ${escapeMarkdown(ref)}\n` +
      `*Name:* ${escapeMarkdown(name)}\n` +
      `*Phone:* ${escapeMarkdown(phone)}\n` +
      `*Email:* ${escapeMarkdown(email)}\n` +
      `*Address:* ${escapeMarkdown(address)}\n` +
      `*Service:* ${escapeMarkdown(service)}\n` +
      `*Date:* ${escapeMarkdown(date)}\n` +
      `*Time:* ${escapeMarkdown(time)}` +
      (notes ? `\n*Notes:* ${escapeMarkdown(notes)}` : '');

    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' })
    });

    const tgJson = await tgResp.json();

    if (!tgJson.ok) {
      console.error('Telegram API error:', tgJson);
      return res.status(502).json({ success: false, error: 'Could not send notification.' });
    }

    res.json({ success: true, ref });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ success: false, error: 'Unexpected server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Ashwat Enterprises site running at http://localhost:${PORT}`);
});
