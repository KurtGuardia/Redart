import admin from 'firebase-admin'

// --- Firebase Admin SDK Initialization ---
// This file initializes the Firebase Admin SDK for SERVER-SIDE operations.
// It uses Application Default Credentials (ADC) via the GOOGLE_APPLICATION_CREDENTIALS
// environment variable. This is the recommended, secure way for server environments.

// HOW TO SET UP LOCALLY:
// 1. Download your Firebase project's Service Account Key JSON file.
//    (Firebase Console > Project Settings > Service accounts > Generate new private key)
// 2. Save the key file somewhere safe (e.g., outside your project folder).
//    IMPORTANT: DO NOT commit this key file to Git.
// 3. Create a `.env.local` file in your project root (if it doesn't exist).
// 4. Add the following line to `.env.local`, replacing with the ACTUAL ABSOLUTE PATH:
//    GOOGLE_APPLICATION_CREDENTIALS="/full/path/to/your/service-account-key.json"
// 5. Ensure `.env.local` is in your `.gitignore` file.
// 6. Restart your Next.js development server (`npm run dev` or `yarn dev`).

// WHY THIS METHOD?
// - Security: Keeps sensitive credentials out of your codebase.
// - Simplicity for Deployment: Hosting providers (like Vercel) allow setting environment
//   variables easily. You set GOOGLE_APPLICATION_CREDENTIALS there with your production
//   key, and this code works without changes.
// - Standard Practice: It's the standard Google Cloud approach.

// ALTERNATIVE (Less Secure / More Complex for Env Switching):
/*
import serviceAccount from '../path/to/your-service-account-key.json'; // Adjust path, BE CAREFUL NOT TO COMMIT KEY

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK Initialized via explicit cert()');
  } catch (error) {
    console.error('Firebase Admin SDK (cert) initialization error:', error.stack);
  }
}
*/

// Initialize using Application Default Credentials (ADC)
console.log(
  '[firebase-admin] Attempting Firebase Admin Init...',
) // Log entry

if (!admin.apps.length) {
  try {
    console.log(
      '[firebase-admin] ADC Init: Entering Try block...',
    ) // Log step
    admin.initializeApp()
    console.log(
      '[firebase-admin] ADC Init: SUCCESS - Firebase Admin SDK Initialized using ADC',
    ) // Log success
  } catch (error) {
    console.error(
      '[firebase-admin] ADC Init: FAILED - Firebase Admin SDK initialization error (using ADC). Did you set GOOGLE_APPLICATION_CREDENTIALS correctly?',
    )
    // --- Log the specific initialization error ---
    console.error(
      '[firebase-admin] ADC Init Error Object:',
      error,
    )
    // ---------------------------------------------
    // Depending on your app, you might want to throw the error
    // or allow the app to continue with limited functionality.
    // throw error; // Uncomment to make initialization failure critical
  }
} else {
  console.log(
    '[firebase-admin] ADC Init: Skipped - Already initialized.',
  ) // Log skip
}

let dbAdmin = null
try {
  dbAdmin = admin.firestore()
  console.log(
    '[firebase-admin] Firestore instance obtained successfully.',
  ) // Log firestore success
} catch (firestoreError) {
  console.error(
    '[firebase-admin] FAILED to get Firestore instance:',
    firestoreError,
  ) // Log firestore failure
  // dbAdmin remains null, subsequent calls will likely fail
}

export { dbAdmin }
