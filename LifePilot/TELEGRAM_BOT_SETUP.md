# LifePilot Telegram Scheduler

## What is implemented

- Telegram Bot API webhook at `/api/telegram`.
- One-minute Vercel cron at `/api/telegram/cron`.
- Supabase persistence for destinations, schedules and delivery logs.
- Concurrent cron protection through a Postgres `SKIP LOCKED` claim function.
- Destination registration only after verifying that the bot is an administrator/creator in the group.
- Commands: `/start`, `/help`, `/addchat`, `/schedulehere`, `/schedules`, `/pause`, `/resume`, `/delete`, `/removechat`.

## Required Vercel environment variables

- `TELEGRAM_BOT_TOKEN` — token from BotFather.
- `SUPABASE_URL` — LifePilot Supabase URL.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key. Keep server-side only.
- `CRON_SECRET` — long random secret used to protect cron/setup endpoints.

## First activation

1. Create the bot with BotFather and copy its token.
2. Add the bot to a target group and make it an administrator with permission to post messages.
3. Open the bot privately and send `/start`. The first private `/start` claims the bot for that Telegram user.
4. In the target group, send `/addchat`.
5. In that group, send `/schedulehere 60 Test message` to schedule a message every 60 minutes.
6. After the production deployment is live, call the protected setup endpoint with the same `CRON_SECRET` to register the Telegram webhook.

The scheduler is intentionally restricted to verified destinations where the bot has administrative posting permission; it does not use a user account or bypass Telegram permissions.
