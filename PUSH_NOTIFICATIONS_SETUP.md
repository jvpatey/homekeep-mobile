# Push Notifications Setup Guide

## Architecture

- **Mobile app** — registers Expo push token → `profiles.push_token`; seeds `notification_preferences` on login.
- **`send-push-notification`** — authenticated test endpoint; sends one push to the JWT user.
- **`notification-worker`** — hourly job; sends at **per-user local times** with deduplication via `notification_deliveries`.
- **`notify-household-event`** — one-shot join/leave alerts to remaining household members.
- **`process-scheduled-notifications`** — deprecated wrapper (bypasses hour check); use `notification-worker` instead.

### Local delivery schedule (user timezone)

| Local time | Notification type |
|------------|-------------------|
| 8:00 | Morning — overdue and/or due today (one batched push) |
| 8:00 Saturday | Weekly summary (optional; replaces Saturday morning) |
| 18:00 | Upcoming — due tomorrow (one batched push) |

Timezone comes from `user_settings.timezone` (synced on sign-in and when the app returns to the foreground).

Household members with notifications on each get the same home reminder, scoped by `household_id` (or `user_id` if they are not in a household).

## Prerequisites

- Physical device for push (not simulator)
- EAS **APNs key** for TestFlight/production ([Expo credentials](https://expo.dev/accounts/jeffreyvpatey/projects/homekeep-mobile/credentials))
- `notification_deliveries` table in Supabase (see migration)

## Deploy edge functions

From the project root, use the **local** CLI (global `supabase` is optional):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF

npx supabase functions deploy send-push-notification
npx supabase functions deploy notification-worker
npx supabase functions deploy notify-household-event
npx supabase functions deploy process-scheduled-notifications
```

Or deploy all:

```bash
npm run functions:deploy
```

**If `brew install supabase` fails** (e.g. outdated Xcode Command Line Tools), use `npx supabase` or `npm run supabase -- <args>` instead.

**Dashboard deploy error (`Module not found ../_shared/...`):** `send-push-notification` is self-contained. Do not paste imports to `_shared` in the Dashboard. For `notification-worker` and `notify-household-event`, deploy from this git repo with the CLI commands above.

## Schedule the hourly worker (Supabase)

**Dashboard (recommended):**

1. **Edge Functions** → `notification-worker`
2. **Schedules** → Add cron: `0 * * * *` (every hour at :00 UTC)

The worker checks each user's **local hour** and only runs matching notification types.

Invoke with the **service role** key or `x-cron-secret` (if `CRON_SECRET` is set). A user JWT may force types for that user only.

## Environment variables

**Mobile (EAS production):**

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Edge functions** (auto-injected by Supabase): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.

## Testing

### 1. `send-push-notification` (primary device check)

Use the signed-in user's access token (not the anon key):

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/send-push-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \
  -d '{
    "title": "Server Test",
    "body": "From send-push-notification",
    "data": {"type": "test"}
  }'
```

### 2. `notification-worker` (forced type, single user)

```bash
curl -X POST \
  "https://YOUR_PROJECT.supabase.co/functions/v1/notification-worker?user_id=YOUR_USER_UUID&force_type=upcoming" \
  -H "Authorization: Bearer SERVICE_ROLE_OR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{}'
```

`force_type` values: `upcoming`, `morning`, `weekly` (legacy aliases: `due_soon`, `daily`, `overdue`).

Run twice the same day — second run should send **0** additional pushes (dedupe).

### 3. SQL verification

```sql
SELECT push_token FROM profiles WHERE id = 'YOUR_USER_UUID';

SELECT count(*) FROM notification_preferences WHERE user_id = 'YOUR_USER_UUID';

SELECT * FROM notification_deliveries
WHERE user_id = 'YOUR_USER_UUID'
ORDER BY sent_at DESC LIMIT 10;
```

## Test matrix

| Step | Expected |
|------|----------|
| Fresh user login | ~9 `notification_preferences` rows, `push_token` set after enabling notifications |
| `send-push-notification` curl | 200 + `push_notifications` row; device shows alert if backgrounded |
| `notification-worker?force_type=upcoming` | One due-tomorrow batch if tasks exist; dedupe on repeat |
| Local hour 18 (or `force_type=upcoming`) | One upcoming push for the home |
| Local hour 8 (or `force_type=morning`) | One morning push if overdue or due today |
| Member joins household | Other members (master on) get “Name joined your home.” |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `InvalidCredentials` (Expo) | Add APNs key in EAS; rebuild TestFlight |
| `User not found or no push token` | Open app, enable notifications, sign in |
| Scheduled sends never fire | Confirm `notification-worker` schedule in Supabase dashboard; invoke with service role |
| No upcoming/morning | Check `notification_preferences.enabled` and task due dates |
| Duplicate pushes | Check `notification_deliveries` unique constraint exists |
| `Unauthorized` | Use a user JWT, service role, or `x-cron-secret` |

## Dedupe keys

| Type | Key pattern |
|------|-------------|
| upcoming | `upcoming:{user_id}:{local_date}` |
| morning / Saturday weekly | `morning:{user_id}:{local_date}` |
| household join | `household_join:{household_id}:{actor_id}` |
| household leave | `household_leave:{household_id}:{actor_id}` |
