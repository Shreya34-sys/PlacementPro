import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
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
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error('Firebase is not configured yet. Add the VITE_FIREBASE_* values to .env.local.');
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);

    if (!firestoreDb) {
      return {
        id: result.user.uid,
        name: result.user.displayName || normalizedEmail.split('@')[0],
        email: result.user.email || normalizedEmail,
        role: 'student',
      };
    }
    
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
    if (error instanceof FirebaseError) {
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'The email or password is incorrect. Check both and try again.',
        'auth/invalid-login-credentials': 'The email or password is incorrect. Check both and try again.',
        'auth/user-not-found': 'No account exists for this email. Register first or check the email address.',
        'auth/wrong-password': 'The password is incorrect. Try again or reset your password.',
        'auth/too-many-requests': 'Too many failed attempts. Wait a few minutes before trying again.',
        'auth/user-disabled': 'This account has been disabled. Contact your placement administrator.',
        'auth/network-request-failed': 'Unable to reach Firebase. Check your internet connection and try again.',
      };
      throw new Error(messages[error.code] || 'Login failed. Please check your credentials and try again.');
    }

    throw new Error(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
  }
};
