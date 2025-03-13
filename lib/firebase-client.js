'use client'

import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

let app
let auth
let db
let storage

try {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  }

  // Initialize Firebase only on client side
  if ( typeof window !== 'undefined' ) {
    app = initializeApp( firebaseConfig )
    auth = getAuth( app )
    db = getFirestore( app )
    storage = getStorage( app )

    // Set persistence (wrapped in try/catch as it's async)
    setPersistence( auth, browserLocalPersistence ).catch( ( error ) => {
      console.error( 'Error setting auth persistence:', error )
    } )
  }
} catch ( error ) {
  console.error( 'Error initializing Firebase:', error )
}

export { auth, db, storage }
