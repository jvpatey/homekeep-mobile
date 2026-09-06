# App Store privacy (nutrition labels)

Fill **App Store Connect → App Privacy** to match this. Tracking: **No**.

Do not declare data used for advertising or third-party advertising.

| Data type | Collected | Linked to identity | Purpose |
|---|---|---|---|
| Email address | Yes | Yes | App functionality (account) |
| Name | Yes | Yes | App functionality |
| Physical address | Yes | Yes | App functionality (home) |
| Precise location | Yes (from address geocode, not GPS) | Yes | App functionality (weather) |
| Photos | Yes (user-chosen) | Yes | App functionality |
| User ID | Yes | Yes | App functionality |
| Device ID | Yes (push token) | Yes | App functionality |
| Purchase history | Yes (subscription status) | Yes | App functionality |
| Other user content | Yes (tasks, manuals, notes) | Yes | App functionality |

Product page **Privacy Policy URL**: host [`privacy.html`](./privacy.html) on HTTPS, then set the same URL in App Store Connect and:

```bash
eas env:set --name EXPO_PUBLIC_LEGAL_PRIVACY_URL --value 'https://YOUR-HOST/privacy.html' --environment production --visibility plaintext
```

Terms can stay Apple’s standard EULA (already the in-app fallback).
