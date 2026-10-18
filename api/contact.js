// Contact form → email via Resend.
// Runs as a Vercel serverless function, so the Resend key never reaches the browser.
//
// Environment variables (set them in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   the key from resend.com (starts with "re_")      — required
//   CONTACT_EMAIL    where new enquiries are sent                      — required
//   RESEND_FROM      sender, e.g. "DBIZ <hello@your-domain.co.il>"     — optional;
//                    until a domain is verified in Resend, the default
//                    onboarding@resend.dev can only send to the email the Resend account was opened with
//   ALLOWED_ORIGIN   site allowed to call this function                — optional

const DEFAULT_ORIGIN = 'https://belladzimitrovski.github.io';
const DEFAULT_FROM = 'DBIZ אתר <onboarding@resend.dev>';

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (ch) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));
const clip = (value, max) => String(value ?? '').trim().slice(0, max);
const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const row = (label, value) => value
  ? `<tr><td style="padding:8px 0;color:#7b8388;width:110px;vertical-align:top">${label}</td>` +
    `<td style="padding:8px 0;color:#2b2e30;font-weight:600;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
  : '';

module.exports = async (req, res) => {
  const allowed = process.env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' });

  const { RESEND_API_KEY, CONTACT_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_EMAIL) {
    return res.status(500).json({ ok: false, error: 'server is missing RESEND_API_KEY or CONTACT_EMAIL' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Bots fill every field, people never see this one — pretend it worked and drop it
  if (clip(body.website, 200)) return res.status(200).json({ ok: true });

  const name = clip(body.name, 120);
  const phone = clip(body.phone, 40);
  const email = clip(body.email, 160);
  const message = clip(body.message, 4000);
  if (!name || !phone) return res.status(400).json({ ok: false, error: 'name and phone are required' });

  const when = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
  const html = `
<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e8edee;border-radius:16px">
  <h2 style="margin:0 0 4px;color:#159a9d;font-size:20px">פנייה חדשה מהאתר</h2>
  <p style="margin:0 0 18px;color:#7b8388;font-size:13px">${escapeHtml(when)}</p>
  <table style="width:100%;border-collapse:collapse;font-size:15px">
    ${row('שם', name)}
    ${row('טלפון', phone)}
    ${row('דוא״ל', email)}
    ${row('מה קורה בעסק', message)}
  </table>
  <p style="margin:22px 0 0;color:#7b8388;font-size:12px">נשלח מטופס צרו קשר · DBIZ</p>
</div>`;

  const text = [`פנייה חדשה מהאתר (${when})`, `שם: ${name}`, `טלפון: ${phone}`,
    email && `דוא״ל: ${email}`, message && `מה קורה בעסק: ${message}`].filter(Boolean).join('\n');

  const mail = {
    from: process.env.RESEND_FROM || DEFAULT_FROM,
    to: CONTACT_EMAIL.split(',').map((s) => s.trim()).filter(Boolean),
    subject: `פנייה חדשה מהאתר: ${name}`,
    html,
    text,
  };
  // Replying to the notification goes straight to the person who filled in the form
  if (looksLikeEmail(email)) mail.reply_to = email;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(mail),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error('Resend error', r.status, detail);
      return res.status(502).json({ ok: false, error: 'email provider rejected the message' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend request failed', err);
    return res.status(502).json({ ok: false, error: 'could not reach email provider' });
  }
};
