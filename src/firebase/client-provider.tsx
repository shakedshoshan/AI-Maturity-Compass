'use client';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

// This provider is intended to be used in the root layout of your application.
// It ensures that Firebase is initialized only once on the client-side.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseApp, firestore } = initializeFirebase();
  
  // Provide null values if initialization failed
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
