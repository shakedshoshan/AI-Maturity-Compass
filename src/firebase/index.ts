import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Export hooks and providers
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';


// We need to use this to keep track of the initialized app,
// otherwise we get an error.
let firebaseApp: FirebaseApp;
let firestore: Firestore;

/**
 * Initializes Firebase and returns the app and firestore instances.
 * This function is idempotent, meaning it will only initialize the app once.
 */
export function initializeFirebase() {
  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      firestore = getFirestore(firebaseApp);
    } else {
      // Get existing app and firestore if already initialized
      firebaseApp = getApps()[0];
      firestore = getFirestore(firebaseApp);
    }
    return { firebaseApp, firestore };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return { firebaseApp: null, firestore: null };
  }
}
