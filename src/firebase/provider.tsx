import React, { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseApp: null,
  firestore: null,
});

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
}> = ({ children, firebaseApp, firestore }) => {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  return useContext(FirebaseContext);
};

export const useFirebaseApp = () => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider.');
  }
  return firebaseApp;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  return firestore; // Return null if not available, let components handle it
};
