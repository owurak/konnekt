# Konnekt

Konnekt is Firebase-ready. If Firebase environment variables are missing, the app uses local demo data so the UI can still be explored. Once the variables are present, authentication, Firestore, and profile photo uploads use your live Firebase project.

Demo mode starts on the login screen. Use the member or admin demo credentials only when you want to preview seeded data locally.

## Make It Live

1. Create a Firebase project.
2. Enable Email/Password in Firebase Authentication.
3. Create Cloud Firestore in production or test mode.
4. Create Firebase Storage.
5. Copy `.env.example` to `.env.local` and fill in your Firebase web app values.
6. Deploy or paste `firestore.rules` and `storage.rules` in Firebase Console.
7. Register your owner account in the app.
8. In Firebase Console, open Firestore, find your document in `users`, and change `role` from `member` to `admin`.
9. Build and deploy the app.

## Firebase Collections

- `users`
- `connections`
- `opportunities`
- `notifications`
- `messages`

The `messages` collection is included because the MVP requires one-to-one messaging.

## Profile Photo Uploads

Profile photos upload to Firebase Storage at `profile-photos/{userId}/...`. If uploads fail on a hosted app, check these first:

- Firebase Storage is enabled for the project.
- `VITE_FIREBASE_STORAGE_BUCKET` exactly matches the bucket in your Firebase web app config.
- The latest `storage.rules` file has been deployed.
- The selected image is JPG, PNG, WebP, or GIF.

The app optimizes large profile photos before upload and Storage rules block non-image files.

## Admin Bootstrap

For live Firebase, public registration always creates a normal `member` account. Nobody can make themselves an admin through the web app.

To create the first admin, register your account, then update that user's Firestore document from Firebase Console:

- Collection: `users`
- Document: your Firebase Auth UID
- Field: `role`
- Value: `admin`

The included Firestore rules prevent non-admin users from changing `role`, `verified`, or `suspended` from the browser.

For a hardened production launch, move admin role assignment to Firebase custom claims or a trusted backend function.