/**
 * This file contains the Firebase configuration for Firestore only.
 * Authentication has been removed from this application.
 *
 * IMPORTANT: This is a public configuration. Do not include any sensitive data
 * such as database secrets or API keys that are not meant to be client-facing.
 *
 * The configuration is used to initialize the Firebase app on the client-side.
 * Security is enforced by Firebase Security Rules, not by keeping this
 * configuration private.
 *
 * Configuration values are loaded from environment variables with fallback to
 * hardcoded values for backward compatibility.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCDFzmcOhkbnTFiCGUAnEsa1IpHmdT4vtw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-7884707695-df969.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-7884707695-df969",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-7884707695-df969.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "978989728503",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:978989728503:web:5dd1d7eb83ccefb0a209f2"
};
