import { supabaseAdmin, telegram, json, getSettings, ensureOwner, ownerOnly, commandArgs, escapeHtml } from './_lib.js';

function help() {
  return [
    '<b>LifePilot Telegram Scheduler</b>',
    '',
    'Comandi:',
    '<code>/start</code> — attiva il tuo account proprietario',
    '<code>/addchat</code> — registra questo gruppo (il bot deve essere admin)',
    '<code>/schedulehere 60 testo</code> — invia il testo ogni 60 minuti',
    '<code>/schedules</code> — mostra le programmazioni',
    '<code>/pause ID</code> — mette in pausa una programmazione',
    '<code>/resume ID</code> — riattiva una programmazione',
    '<code>/delete ID</code> — elimina una programmazione',
    '<code>/removechat</code> — rimuove questo gruppo dal bot',
    '',
    'Il sistema pubblica solo nelle chat registrate e verificate dove il bot dispone dei permessi necessari.',
  ].join('\n');
}

async function reply(chatId, text) {
  return telegram('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });
}

async function ensureGroupAdmin(chatId, botUserId) {
  const member = await telegram('getChatMember', { chat_id: chatId, user_id: botUserId });
  return ['administrator', 'creator'].includes(member.status);
}

async function getBotUser() {
  return telegram('getMe');
}

async function listSchedules(db) {
  const { data, error } = await db.from('telegram_schedules')
    .select('id,message,interval_minutes,active,next_run_at,last_run_at,telegram_destinations(title,chat_id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 200, { ok: true, service: 'telegram-webhook' });

  try {
    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message?.text || !message.chat) return json(res, 200, { ok: true, ignored: true });

    const db = supabaseAdmin();
    const { command, args } = commandArgs(message.text);
    const user = message.from;
    const chat = message.chat;
    const settings = await getSettings(db);

    if (command === '/start') {
      if (chat.type !== 'private') return json(res, 200, { ok: true });
      const claimed = await ensureOwner(db, user);
      if (Number(claimed.owner_user_id) !== Number(user.id)) {
        await reply(chat.id, 'Questo bot è già associato al suo proprietario.');
        return json(res, 200, { ok: true });
      }
      await reply(chat.id, '✅ Account proprietario attivato.\n\n' + help());
      return json(res, 200, { ok: true });
    }

    if (!settings || !ownerOnly(settings, user?.id)) return json(res, 200, { ok: true, ignored: true });

    if (command === '/help') {
      await reply(chat.id, help());
      return json(res, 200, { ok: true });
    }

    if (command === '/addchat') {
      if (!['group', 'supergroup'].includes(chat.type)) {
        await reply(chat.id, 'Usa /addchat direttamente nel gruppo che vuoi registrare.');
        return json(res, 200, { ok: true });
      }
      const bot = await getBotUser();
      const allowed = await ensureGroupAdmin(chat.id, bot.id);
      if (!allowed) {
        await reply(chat.id, '❌ Non posso registrare questo gruppo: il bot deve essere amministratore.');
        return json(res, 200, { ok: true });
      }
      const { data, error } = await db.from('telegram_destinations').upsert({
        chat_id: String(chat.id),
        title: chat.title || String(chat.id),
        chat_type: chat.type,
        active: true,
        verified_admin: true,
        created_by: user.id,
      }, { onConflict: 'chat_id' }).select().single();
      if (error) throw error;
      await reply(chat.id, `✅ Gruppo registrato: <b>${escapeHtml(data.title)}</b>\nOra puoi usare:\n<code>/schedulehere 60 Il tuo messaggio</code>`);
      return json(res, 200, { ok: true });
    }

    if (command === '/removechat') {
      if (!['group', 'supergroup'].includes(chat.type)) return json(res, 200, { ok: true });
      const { error } = await db.from('telegram_destinations').update({ active: false }).eq('chat_id', String(chat.id));
      if (error) throw error;
      await reply(chat.id, '🛑 Gruppo disattivato.');
      return json(res, 200, { ok: true });
    }

    if (command === '/schedulehere') {
      if (!['group', 'supergroup'].includes(chat.type)) {
        await reply(chat.id, 'Usa /schedulehere direttamente nel gruppo.');
        return json(res, 200, { ok: true });
      }
      const minutes = Number(args.shift());
      const text = args.join(' ').trim();
      if (!Number.isInteger(minutes) || minutes < 1 || !text) {
        await reply(chat.id, 'Formato: <code>/schedulehere 60 Messaggio da inviare</code>');
        return json(res, 200, { ok: true });
      }
      const { data: destination, error: destinationError } = await db.from('telegram_destinations').select('*').eq('chat_id', String(chat.id)).eq('active', true).maybeSingle();
      if (destinationError) throw destinationError;
      if (!destination) {
        await reply(chat.id, 'Prima registra il gruppo con /addchat.');
        return json(res, 200, { ok: true });
      }
      const { data: schedule, error } = await db.from('telegram_schedules').insert({
        destination_id: destination.id,
        message: text,
        interval_minutes: minutes,
        active: true,
        next_run_at: new Date(Date.now() + minutes * 60_000).toISOString(),
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      await reply(chat.id, `✅ Programmazione creata.\nID: <code>${schedule.id.slice(0, 8)}</code>\nIntervallo: <b>${minutes} min</b>\nProssimo invio: tra ${minutes} minuti.`);
      return json(res, 200, { ok: true });
    }

    if (command === '/schedules') {
      const schedules = await listSchedules(db);
      if (!schedules.length) {
        await reply(chat.id, 'Nessuna programmazione attiva.');
        return json(res, 200, { ok: true });
      }
      const lines = schedules.map((s) => {
        const title = s.telegram_destinations?.title || s.telegram_destinations?.chat_id || 'chat';
        const status = s.active ? '🟢' : '⏸️';
        return `${status} <code>${s.id.slice(0, 8)}</code> — ${escapeHtml(title)} — ogni ${s.interval_minutes} min\n${escapeHtml(s.message.slice(0, 120))}`;
      });
      await reply(chat.id, '<b>Programmazioni</b>\n\n' + lines.join('\n\n'));
      return json(res, 200, { ok: true });
    }

    if (['/pause', '/resume', '/delete'].includes(command)) {
      const prefix = (args.shift() || '').toLowerCase();
      if (!prefix) {
        await reply(chat.id, `Formato: <code>${command} ID</code>`);
        return json(res, 200, { ok: true });
      }
      const { data: candidates, error: findError } = await db.from('telegram_schedules').select('id').ilike('id', `${prefix}%`).limit(2);
      if (findError) throw findError;
      if (!candidates?.length) {
        await reply(chat.id, 'ID non trovato. Usa /schedules.');
        return json(res, 200, { ok: true });
      }
      if (candidates.length > 1) {
        await reply(chat.id, 'ID non univoco. Usa più caratteri dell’ID.');
        return json(res, 200, { ok: true });
      }
      const id = candidates[0].id;
      if (command === '/delete') {
        const { error } = await db.from('telegram_schedules').delete().eq('id', id);
        if (error) throw error;
        await reply(chat.id, '🗑️ Programmazione eliminata.');
      } else {
        const active = command === '/resume';
        const { error } = await db.from('telegram_schedules').update({ active, next_run_at: active ? new Date().toISOString() : undefined }).eq('id', id);
        if (error) throw error;
        await reply(chat.id, active ? '▶️ Programmazione riattivata.' : '⏸️ Programmazione messa in pausa.');
      }
      return json(res, 200, { ok: true });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('Telegram webhook error', error);
    try {
      const chatId = req.body?.message?.chat?.id;
      if (chatId) await reply(chatId, '⚠️ Si è verificato un errore. Controlla la configurazione del bot.');
    } catch {}
    return json(res, 200, { ok: false });
  }
}
