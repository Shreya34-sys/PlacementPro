import { signInWithPopup } from 'firebase/auth';
import { UserProfile } from '../types';
import { firebaseAuth, googleProvider, isFirebaseConfigured } from './firebase';
import { saveUserToFirestore } from './saveUserToFirestore';
export interface GoogleProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

const getGoogleUserProfile = (email: string | null, displayName: string | null, photoURL: string | null): GoogleProfile => {
  const safeEmail = email || 'student.google@placementpro.edu';
  const safeName = displayName || safeEmail.split('@')[0].replace(/[._]/g, ' ') || 'Google Student';

  if (!email) {
    throw new Error('Google account did not include an email address.');
  }

  return {
    name: safeName,
    email: safeEmail,
    avatarUrl: photoURL || undefined,
  };
};

export const signInWithGoogle = async (): Promise<GoogleProfile> => {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error('Google sign-in is not configured yet. Add the VITE_FIREBASE_* values to .env.local.');
  }

  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const profile = getGoogleUserProfile(result.user.email, result.user.displayName, result.user.photoURL);

    await saveUserToFirestore({
      uid: result.user.uid,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    });

    return profile;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google authentication failed. Please try again.';
    throw new Error(message);
  }
};

export const createGoogleUserProfile = (
  profile: GoogleProfile,
  overrides: Partial<UserProfile> = {}
): Partial<UserProfile> => ({
  name: profile.name,
  email: profile.email,
  avatarUrl: profile.avatarUrl,
  role: 'student',
  department: 'Computer Science & Engineering',
  batchYear: '2026',
  ...overrides,
});
