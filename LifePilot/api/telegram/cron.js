import { supabaseAdmin, telegram, json, isAuthorizedCron } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { ok: false });
  if (!isAuthorizedCron(req)) return json(res, 401, { ok: false, error: 'Unauthorized' });

  const db = supabaseAdmin();
  const { data: settings, error: settingsError } = await db.from('telegram_bot_settings').select('enabled').eq('id', true).maybeSingle();
  if (settingsError) return json(res, 500, { ok: false, error: settingsError.message });
  if (settings && settings.enabled === false) return json(res, 200, { ok: true, sent: 0, disabled: true });

  const { data: jobs, error } = await db.rpc('claim_telegram_due_schedules', { p_limit: 50 });
  if (error) return json(res, 500, { ok: false, error: error.message });

  let sent = 0;
  let failed = 0;

  for (const job of jobs || []) {
    try {
      const result = await telegram('sendMessage', {
        chat_id: job.chat_id,
        text: job.message,
        disable_web_page_preview: true,
      });
      await db.from('telegram_delivery_log').insert({
        schedule_id: job.id,
        destination_id: job.destination_id,
        status: 'sent',
        telegram_message_id: result?.message_id || null,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = String(error?.message || 'Telegram send failed').slice(0, 1000);
      await db.from('telegram_delivery_log').insert({
        schedule_id: job.id,
        destination_id: job.destination_id,
        status: 'failed',
        error_text: message,
      });
      console.error('Telegram scheduled send failed', job.id, message);
    }
  }

  return json(res, 200, { ok: true, claimed: jobs?.length || 0, sent, failed });
}
