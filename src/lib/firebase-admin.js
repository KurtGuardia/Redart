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
if (!admin.apps.length) {
  try {
    admin.initializeApp()
  } catch (error) {
    console.error(
      'Firebase Admin SDK initialization error (using ADC). Did you set GOOGLE_APPLICATION_CREDENTIALS correctly?',
      error.stack,
    )
    // Depending on your app, you might want to throw the error
    // or allow the app to continue with limited functionality.
    // throw error; // Uncomment to make initialization failure critical
  }
}

const dbAdmin = admin.firestore()

export { dbAdmin }
