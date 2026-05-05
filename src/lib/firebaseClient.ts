import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export const PLAYGROUND_ADMIN_EMAIL = 'artediemcalabria@gmail.com';

export interface FirebaseClientServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  googleProvider: GoogleAuthProvider;
}

let servicesPromise: Promise<FirebaseClientServices> | null = null;

export function getFirebaseClientServices() {
  servicesPromise ??= initializeFirebaseClient();
  return servicesPromise;
}

async function initializeFirebaseClient(): Promise<FirebaseClientServices> {
  const config = await loadFirebaseConfig();
  const app = getApps()[0] ?? initializeApp(config);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    googleProvider,
  };
}

async function loadFirebaseConfig(): Promise<FirebaseOptions> {
  if (import.meta.env.PROD) {
    try {
      const response = await fetch('/__/firebase/init.json', { cache: 'no-store' });
      if (response.ok) {
        return await response.json() as FirebaseOptions;
      }
    } catch {
      // GitHub Pages does not expose Firebase Hosting reserved config URLs.
    }
  }

  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  if (envConfig.apiKey && envConfig.appId && envConfig.authDomain && envConfig.projectId && envConfig.storageBucket) {
    return envConfig;
  }

  return {
    apiKey: 'AIzaSyBO4psTA-YLfH1zqKMXwSlFUEhlu1B91Ho',
    appId: '1:1076832850995:web:b889a398b29cae0d5c7f46',
    authDomain: 'games-are-no-joke.firebaseapp.com',
    projectId: 'games-are-no-joke',
    storageBucket: 'games-are-no-joke.firebasestorage.app',
    messagingSenderId: '1076832850995',
    measurementId: 'G-6WGNT071D9',
  };
}
