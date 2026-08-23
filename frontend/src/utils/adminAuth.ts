import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import { firebaseAuth, firestoreDb } from './firebase';

const ADMIN_GOOGLE_DOMAIN =
  import.meta.env.VITE_ADMIN_GOOGLE_DOMAIN || '';

const getMagicLinkSettings = () => ({
  url: `${window.location.origin}/#admin`,
  handleCodeInApp: true,
});

/**
 * Check whether Firebase user is an admin.
 */
export const isAdminUser = async (
  user: User
): Promise<boolean> => {
  if (!firestoreDb) {
    throw new Error('Firestore is not initialized.');
  }

  const userRef = doc(
    firestoreDb,
    'users',
    user.uid
  );

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return false;
  }

  return userSnap.data()?.role === 'admin';
};


/**
 * Email + Password Admin Login
 */
export const adminLoginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {

  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  await setPersistence(
    firebaseAuth,
    browserLocalPersistence
  );

  const result =
    await signInWithEmailAndPassword(
      firebaseAuth,
      email.trim(),
      password
    );

  const allowed =
    await isAdminUser(result.user);

  if (!allowed) {
    await signOut(firebaseAuth);

    throw new Error(
      'Access denied. This account is not authorized as an administrator.'
    );
  }

  return result.user;
};


/**
 * Google Admin Login
 */
export const adminLoginWithGoogle =
  async (): Promise<User> => {

    if (!firebaseAuth) {
      throw new Error(
        'Firebase Authentication is not initialized.'
      );
    }

    const provider =
      new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account',
    });

    await setPersistence(
      firebaseAuth,
      browserLocalPersistence
    );

    const result =
      await signInWithPopup(
        firebaseAuth,
        provider
      );

    const email =
      result.user.email?.toLowerCase() || '';

    if (
      !ADMIN_GOOGLE_DOMAIN ||
      !email.endsWith(
        `@${ADMIN_GOOGLE_DOMAIN.toLowerCase()}`
      )
    ) {

      await signOut(firebaseAuth);

      throw new Error(
        `Access denied. Please use your official ${ADMIN_GOOGLE_DOMAIN} Google account.`
      );
    }

    const allowed =
      await isAdminUser(result.user);

    if (!allowed) {

      await signOut(firebaseAuth);

      throw new Error(
        'Your account has the correct email domain, but it is not registered as an administrator.'
      );
    }

    return result.user;
  };


/**
 * Send Admin Magic Link
 */
export const sendAdminMagicLink = async (
  email: string
): Promise<void> => {

  if (!firebaseAuth) {
    throw new Error(
      'Firebase Authentication is not initialized.'
    );
  }

  const cleanEmail =
    email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error(
      'Please enter your email address.'
    );
  }

  /*
   * Remember the email so Firebase can
   * complete the passwordless login.
   */
  localStorage.setItem(
    'adminMagicLinkEmail',
    cleanEmail
  );

  await sendSignInLinkToEmail(
    firebaseAuth,
    cleanEmail,
    getMagicLinkSettings()
  );
};


/**
 * Complete Admin Magic Link Login
 */
export const completeAdminMagicLinkLogin =
  async (): Promise<User | null> => {

    if (!firebaseAuth) {
      throw new Error(
        'Firebase Authentication is not initialized.'
      );
    }

    const currentUrl =
      window.location.href;

    /*
     * IMPORTANT:
     * Do nothing for normal password login.
     */
    if (
      !isSignInWithEmailLink(
        firebaseAuth,
        currentUrl
      )
    ) {
      return null;
    }

    let email =
      localStorage.getItem(
        'adminMagicLinkEmail'
      );

    if (!email) {
      email =
        window.prompt(
          'Enter your admin email to complete sign-in:'
        )?.trim() || '';
    }

    if (!email) {
      throw new Error(
        'Admin email is required to complete sign-in.'
      );
    }

    try {

      const result =
        await signInWithEmailLink(
          firebaseAuth,
          email,
          currentUrl
        );

      localStorage.removeItem(
        'adminMagicLinkEmail'
      );

      /*
       * Remove Firebase oobCode/actionCode
       * from browser URL immediately.
       */
      window.history.replaceState(
        {},
        document.title,
        `${window.location.origin}/#admin`
      );

      const allowed =
        await isAdminUser(result.user);

      if (!allowed) {

        await signOut(firebaseAuth);

        throw new Error(
          'Access denied. This account is not authorized as an administrator.'
        );
      }

      return result.user;

    } catch (error) {

      /*
       * Remove the old/invalid magic link
       * from the browser URL.
       */
      window.history.replaceState(
        {},
        document.title,
        `${window.location.origin}/#admin`
      );

      localStorage.removeItem(
        'adminMagicLinkEmail'
      );

      throw error;
    }
  };


/**
 * Logout Admin
 */
export const adminLogout = async (): Promise<void> => {

  if (!firebaseAuth) {
    return;
  }

  await signOut(firebaseAuth);

  localStorage.removeItem(
    'adminMagicLinkEmail'
  );
};