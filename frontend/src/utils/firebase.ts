import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

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
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : undefined;            //used to get the firebase authentication instance
export const googleProvider = new GoogleAuthProvider();
export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : undefined;       //used to get the firestore database instance

export const saveUserToFirestore = async (user: {    //used to save the user data to firestore after successful login
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
}) => {
  if (!firestoreDb) {   //used to check if firestore is initialized or not
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to .env.local.');
  }

  await setDoc(                //await is used bcz setDoc is an asynchronous function that returns a promise, and we want to wait for the promise to resolve before continuing with the execution of the code
    doc(firestoreDb, 'users', user.uid),
    {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      role: 'student',                //role means the role of the user in the application, it can be student or admin
      provider: 'google',             //provider means the authentication provider used to login the user
      updatedAt: serverTimestamp(),   //updatedAt means the time when the user is updated in the firestore
      createdAt: serverTimestamp(),  //createdAt means the time when the user is created in the firestore
    },
    { merge: true }         //merge: true means that if the document already exists, it will be merged with the new data instead of overwriting it
  );
};
