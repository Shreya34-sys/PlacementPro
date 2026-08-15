import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from './firebase';
import { saveUserToFirestore } from './saveUserToFirestore';
import { UserProfile } from '../types';

export const registerWithEmail = async (name: string, email: string, password: string): Promise<Partial<UserProfile>> => {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error('Firebase is not configured yet. Add the VITE_FIREBASE_* values to .env.local.');
  }

  try {
    const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    
    await saveUserToFirestore({
      uid: result.user.uid,
      name,
      email,
      provider: 'email'
    });

    return {
      id: result.user.uid,
      name,
      email,
      role: 'student',
      department: 'Computer Science & Engineering',
      batchYear: '2026',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
    throw new Error(message);
  }
};

export const loginWithEmail = async (email: string, password: string): Promise<Partial<UserProfile>> => {
  if (!isFirebaseConfigured || !firebaseAuth || !firestoreDb) {
    throw new Error('Firebase is not configured yet. Add the VITE_FIREBASE_* values to .env.local.');
  }

  try {
    const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
    
    // Fetch user profile from Firestore
    const userDoc = await getDoc(doc(firestoreDb, 'users', result.user.uid));
    const userData = userDoc.data();

    if (!userData) {
      // If user doc doesn't exist for some reason, return basic info
      return {
        id: result.user.uid,
        name: email.split('@')[0],
        email,
        role: 'student',
      };
    }

    return {
      id: result.user.uid,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'student',
      avatarUrl: userData.avatarUrl,
      department: userData.department || 'Computer Science & Engineering',
      batchYear: userData.batchYear || '2026',
      cgpa: userData.cgpa,
      phone: userData.phone,
      companyName: userData.companyName,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
    throw new Error(message);
  }
};
