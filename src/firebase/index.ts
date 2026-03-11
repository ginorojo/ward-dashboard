'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp;
  try {
    // 1. Attempt automatic initialization (for Firebase App Hosting)
    firebaseApp = initializeApp();
  } catch (e) {
    // 2. Fallback to manual config (for Vercel, local dev, etc.)
    // We check for apiKey to ensure the config is not empty
    if (firebaseConfig.apiKey) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      // If no config is available, we still attempt to initialize with whatever we have
      // but we log a more helpful message in non-production environments.
      if (process.env.NODE_ENV !== 'production') {
        console.warn("Firebase configuration is missing. Ensure NEXT_PUBLIC_FIREBASE_... environment variables are set.");
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
