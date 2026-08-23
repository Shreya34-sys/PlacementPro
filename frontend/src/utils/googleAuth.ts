import { browserLocalPersistence, setPersistence, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { UserProfile } from '../types';
import { firebaseAuth, googleProvider, isFirebaseConfigured } from './firebase';
import { saveUserToFirestore } from './saveUserToFirestore';
export interface GoogleProfile {   //used for defining the structure of a Google user profile object, which includes the user's name, email, and optional avatar URL
  name: string;
  email: string;
  avatarUrl?: string;
}

const getGoogleUserProfile = (email: string | null, displayName: string | null, photoURL: string | null): GoogleProfile => {  //used for extracting the user's profile information from the Google authentication response and returning it as a GoogleProfile object
  const safeEmail = email || 'student.google@placementpro.edu';     //used for providing a default email address if the email is null, ensuring that the profile always has a valid email
  const safeName = displayName || safeEmail.split('@')[0].replace(/[._]/g, ' ') || 'Google Student'; //used for providing a default name if the displayName is null, extracting the name from the email address by splitting it at the '@' symbol and replacing dots and underscores with spaces, or using 'Google Student' as a fallback name

  if (!email) {
    throw new Error('Google account did not include an email address.');
  }

  return {
    name: safeName,
    email: safeEmail,
    avatarUrl: photoURL || undefined,
  };
};

export const signInWithGoogle = async (): Promise<GoogleProfile> => { //used for handling the Google sign-in process, including authentication, profile extraction, and saving the user to Firestore
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error('Google sign-in is not configured yet. Add the VITE_FIREBASE_* values to .env.local.');
  }

  try {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(firebaseAuth, googleProvider); //used for initiating the Google sign-in process using a popup window, allowing the user to authenticate with their Google account
    const profile = getGoogleUserProfile(result.user.email, result.user.displayName, result.user.photoURL); //used for extracting the user's profile information from the Google authentication response and creating a GoogleProfile object

    try {
      await saveUserToFirestore({
        uid: result.user.uid,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      });
    } catch (error) {
      console.error('Google user profile could not be saved:', error);
    }

    return profile;
  } catch (error) {
    const messages: Record<string, string> = {
      'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled. Please try again.',
      'auth/cancelled-popup-request': 'A Google sign-in window is already open. Complete it or close it before trying again.',
      'auth/unauthorized-domain': 'This site is not authorized for Google sign-in. Add its domain in Firebase Authentication settings.',
      'auth/operation-not-allowed': 'Google sign-in is disabled. Enable the Google provider in Firebase Authentication settings.',
      'auth/network-request-failed': 'Unable to reach Firebase. Check your internet connection and try again.',
    };
    let message = 'Google authentication failed. Please try again.';
    if (error instanceof FirebaseError) {
      message = messages[error.code] || error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    throw new Error(message);
  }
};

export const createGoogleUserProfile = (  //used for creating a user profile object based on the GoogleProfile and any additional overrides provided, returning a Partial<UserProfile> object that can be used for registration or authentication purposes

  profile: GoogleProfile, //used for providing the GoogleProfile object containing the user's name, email, and optional avatar URL
  overrides: Partial<UserProfile> = {}
): Partial<UserProfile> => ({
  name: profile.name,  //used for setting the user's name in the UserProfile object based on the name extracted from the GoogleProfile
  email: profile.email,  //used for setting the user's email in the UserProfile object based on the email extracted from the GoogleProfile
  avatarUrl: profile.avatarUrl,
  role: 'student', //used for setting the user's role in the UserProfile object to 'student', indicating that the user is a student candidate in the PlacementPro application
  department: 'Computer Science & Engineering',
  batchYear: '2026',
  ...overrides,
});
