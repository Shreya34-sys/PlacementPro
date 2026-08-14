import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : undefined;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : undefined;
export const googleProvider = new GoogleAuthProvider();
export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : undefined;

export const saveUserToFirestore = async (user: {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
}) => {
  if (!firestoreDb) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to .env.local.');
  }

  await setDoc(
    doc(firestoreDb, 'users', user.uid),
    {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      role: 'student',
      provider: 'google',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};
