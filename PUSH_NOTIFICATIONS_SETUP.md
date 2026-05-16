# Push Notifications Setup Guide

## Architecture

- **Mobile app** — registers Expo push token → `profiles.push_token`; seeds `notification_preferences` on login.
- **`send-push-notification`** — manual/test HTTP endpoint; sends one push to a user.
- **`notification-worker`** — hourly job; sends at **per-user local times** with deduplication via `notification_deliveries`.
- **`process-scheduled-notifications`** — deprecated wrapper (bypasses hour check); use `notification-worker` instead.

### Local delivery schedule (user timezone)

| Local time | Notification type |
|------------|-------------------|
| 8:00 | Daily digest |
| 9:00 | Overdue reminders (once per task per day) |
| 9:00 Monday | Weekly summary |
| 18:00 | Due tomorrow |

Timezone comes from `user_settings.timezone` (synced on sign-in).

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
npx supabase functions deploy process-scheduled-notifications
```

Or deploy all three:

```bash
npm run functions:deploy
```

**If `brew install supabase` fails** (e.g. outdated Xcode Command Line Tools), use `npx supabase` or `npm run supabase -- <args>` instead.

**Dashboard deploy error (`Module not found ../_shared/...`):** `send-push-notification` is self-contained. Do not paste imports to `_shared` in the Dashboard. For `notification-worker`, deploy from this git repo with the CLI commands above.

## Schedule the hourly worker (Supabase)

**Dashboard (recommended):**

1. **Edge Functions** → `notification-worker`
2. **Schedules** → Add cron: `0 * * * *` (every hour at :00 UTC)

The worker checks each user's **local hour** and only runs matching notification types.

**Optional:** Set `CRON_SECRET` in function secrets and pass `x-cron-secret` on manual HTTP calls. Not required for Supabase's built-in scheduler.

GitHub Actions cron (`.github/workflows/notifications.yml`) has been removed; use Supabase schedule only.

## Environment variables

**Mobile (EAS production):**

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Edge functions** (auto-injected by Supabase): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.

## Testing

### 1. `send-push-notification` (primary device check)

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/send-push-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "userId": "YOUR_USER_UUID",
    "title": "Server Test",
    "body": "From send-push-notification",
    "data": {"type": "test"}
  }'
```

### 2. `notification-worker` (forced type, single user)

```bash
curl -X POST \
  "https://YOUR_PROJECT.supabase.co/functions/v1/notification-worker?user_id=YOUR_USER_UUID&force_type=due_soon" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Run twice the same day — second run should send **0** additional pushes for the same task (dedupe).

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
| Fresh user login | ~8 `notification_preferences` rows, `push_token` set |
| `send-push-notification` curl | 200 + `push_notifications` row; device shows alert if backgrounded |
| `notification-worker?force_type=daily` | Digest if tasks exist; dedupe on repeat |
| Local hour 18 (or `force_type=due_soon`) | Due-tomorrow task reminders |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `InvalidCredentials` (Expo) | Add APNs key in EAS; rebuild TestFlight |
| `User not found or no push token` | Open app, enable notifications, sign in |
| Scheduled sends never fire | Confirm `notification-worker` schedule in Supabase dashboard |
| No due-soon/overdue | Check `notification_preferences` rows and task due dates |
| Duplicate pushes | Check `notification_deliveries` unique constraint exists |

## Dedupe keys

| Type | Key pattern |
|------|-------------|
| due_soon | `due_soon:{instance_id}:{local_date}` |
| overdue | `overdue:{instance_id}:{local_date}` |
| daily_digest | `daily_digest:{user_id}:{local_date}` |
| weekly_summary | `weekly_summary:{user_id}:{week_start}` |
