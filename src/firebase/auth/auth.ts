'use client';

import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

export async function loginWithGoogle(auth: Auth) {
  if (!auth) throw new Error('Auth not initialized');
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
}

export async function logout(auth: Auth) {
  if (!auth) throw new Error('Auth not initialized');
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}
