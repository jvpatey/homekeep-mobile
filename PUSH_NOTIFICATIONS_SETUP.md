# Push Notifications Setup Guide

## Overview

This guide explains how to set up and test push notifications for your HomeKeep mobile app.

## Prerequisites

- Expo Go app installed on your device
- Supabase project with edge functions enabled
- Physical device (push notifications don't work in simulators)

## Setup Steps

### 1. Database Updates

Run the SQL script in `database-updates.sql` in your Supabase SQL editor to create the necessary tables and fields.

### 2. Edge Functions

Make sure your Supabase edge functions are deployed:

- `send-push-notification` - Sends individual push notifications
- `process-scheduled-notifications` - Processes scheduled notifications

### 3. Environment Variables

Ensure your app has the correct environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing Push Notifications

### Method 1: In-App Test Button

1. Open the app and navigate to Profile Menu → Notification Settings
2. If notifications are enabled, you'll see a "Send Test Notification" button
3. Tap the button to send a test notification
4. You should receive a push notification on your device

### Method 2: Direct Edge Function Call

You can test by calling your edge function directly:

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/send-push-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_anon_key" \
  -d '{
    "userId": "your_user_id",
    "title": "Test Notification",
    "body": "This is a test notification!",
    "data": {"type": "test"}
  }'
```

### Method 3: Expo Push Tool

1. Go to [Expo Push Tool](https://expo.dev/notifications)
2. Enter your Expo push token (check console logs)
3. Send a test notification

## Troubleshooting

### Common Issues

1. **"No push token available"**

   - Make sure you're testing on a physical device
   - Check that notification permissions are granted
   - Verify the app.json configuration

2. **Notifications not showing**

   - Check device notification settings
   - Ensure the app is not in the foreground (notifications are handled differently)
   - Verify your edge function is working

3. **Database errors**
   - Run the database-updates.sql script
   - Check that RLS policies are correct
   - Verify table structure matches the schema

### Debug Steps

1. Check console logs for push token generation
2. Verify the push token is saved to the database
3. Test edge function response
4. Check notification permission status

## How It Works

1. **App Startup**: The app requests notification permissions and generates an Expo push token
2. **Token Storage**: The push token is saved to the user's profile in the database
3. **Preferences**: Users can configure notification settings per category
4. **Scheduled Processing**: Your edge function processes scheduled notifications based on user preferences
5. **Delivery**: Notifications are sent via Expo's push service to the user's device

## Next Steps

- Implement notification history
- Add quiet hours functionality
- Customize notification sounds and icons
- Add notification actions (e.g., mark as read, complete task)
