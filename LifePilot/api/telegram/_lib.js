import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function telegramUrl(method) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function telegram(method, body = {}) {
  const response = await fetch(telegramUrl(method), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    const description = data?.description || `Telegram API ${response.status}`;
    const error = new Error(description);
    error.telegram = data;
    throw error;
  }
  return data.result;
}

export async function json(res, status, payload) {
  res.status(status).setHeader('content-type', 'application/json; charset=utf-8').end(JSON.stringify(payload));
}

export function isAuthorizedCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.authorization || '';
  return auth === `Bearer ${secret}` || req.headers['x-cron-secret'] === secret;
}

export async function getSettings(db) {
  const { data, error } = await db.from('telegram_bot_settings').select('*').eq('id', true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensureOwner(db, user) {
  const settings = await getSettings(db);
  if (!settings?.owner_user_id) {
    const username = user?.username ? `@${user.username}` : null;
    const { data, error } = await db.from('telegram_bot_settings').upsert({
      id: true,
      owner_user_id: user.id,
      bot_username: username,
      enabled: true,
    }).select().single();
    if (error) throw error;
    return data;
  }
  return settings;
}

export function ownerOnly(settings, userId) {
  return Boolean(settings?.owner_user_id && Number(settings.owner_user_id) === Number(userId));
}

export function commandArgs(text = '') {
  const parts = text.trim().split(/\s+/);
  return { command: (parts.shift() || '').toLowerCase().split('@')[0], args: parts };
}

export function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
