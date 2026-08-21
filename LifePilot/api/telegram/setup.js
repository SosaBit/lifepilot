import { telegram, json, isAuthorizedCron } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return json(res, 405, { ok: false });
  if (!isAuthorizedCron(req)) return json(res, 401, { ok: false, error: 'Unauthorized' });

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return json(res, 400, { ok: false, error: 'Missing host' });
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const webhookUrl = `${protocol}://${host}/api/telegram`;
  const result = await telegram('setWebhook', { url: webhookUrl, allowed_updates: ['message'] });
  const info = await telegram('getWebhookInfo');
  return json(res, 200, { ok: true, webhookUrl, telegram: result, webhookInfo: info });
}
