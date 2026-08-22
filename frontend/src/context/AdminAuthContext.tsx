import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import {
  firebaseAuth,
  firestoreDb,
} from '../utils/firebase';

interface AdminAuthContextType {
  adminUser: User | null;
  isAdminAuthenticated: boolean;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  sendMagicLink: (
    email: string
  ) => Promise<void>;

  completeMagicLinkLogin: () => Promise<void>;

  logout: () => Promise<void>;
}

const AdminAuthContext =
  createContext<AdminAuthContextType | undefined>(
    undefined
  );


export const AdminAuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  const [adminUser, setAdminUser] =
    useState<User | null>(null);

  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState(false);

  const [loading, setLoading] =
    useState(true);


  /*
   * Check whether the authenticated Firebase user
   * is actually an admin.
   */
  const verifyAdmin = async (
    user: User
  ): Promise<boolean> => {

    if (!firestoreDb) {
      throw new Error(
        'Firestore is not configured.'
      );
    }

    const db = firestoreDb;

    const adminRef = doc(
      db,
      'users',
      user.uid
    );

    const adminSnap = await getDoc(adminRef);

    if (
      adminSnap.exists() &&
      adminSnap.data()?.role === 'admin'
    ) {
      return true;
    }

    return false;
  };


  /*
   * Firebase authentication state listener
   */
  useEffect(() => {

    if (!firebaseAuth || !firestoreDb) {

      console.error(
        'Firebase Auth or Firestore is not configured.'
      );

      setLoading(false);
      return;
    }

    const auth = firebaseAuth;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          if (!user) {

            setAdminUser(null);
            setIsAdminAuthenticated(false);
            setLoading(false);

            return;
          }

          try {

            const isAdmin =
              await verifyAdmin(user);

            if (isAdmin) {

              setAdminUser(user);
              setIsAdminAuthenticated(true);

            } else {

              await signOut(auth);

              setAdminUser(null);
              setIsAdminAuthenticated(false);
            }

          } catch (error) {

            console.error(
              'Admin authentication check failed:',
              error
            );

            setAdminUser(null);
            setIsAdminAuthenticated(false);
          }

          setLoading(false);
        }
      );

    return unsubscribe;

  }, []);


  /*
   * EMAIL + PASSWORD LOGIN
   */
  const login = async (
    email: string,
    password: string
  ): Promise<void> => {

    if (!firebaseAuth || !firestoreDb) {

      throw new Error(
        'Firebase is not configured.'
      );
    }

    const auth = firebaseAuth;

    setLoading(true);

    try {

      const result =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = result.user;

      const isAdmin =
        await verifyAdmin(user);

      if (!isAdmin) {

        await signOut(auth);

        throw new Error(
          'Access denied. This account is not an admin.'
        );
      }

      setAdminUser(user);
      setIsAdminAuthenticated(true);

    } catch (error) {

      setAdminUser(null);
      setIsAdminAuthenticated(false);

      throw error;

    } finally {

      setLoading(false);
    }
  };


  /*
   * SEND MAGIC EMAIL LINK
   */
  const sendMagicLink = async (
    email: string
  ): Promise<void> => {

    if (!firebaseAuth || !firestoreDb) {

      throw new Error(
        'Firebase is not configured.'
      );
    }

    const auth = firebaseAuth;

    /*
     * IMPORTANT:
     * The URL must be an authorized Firebase domain.
     */
    const actionCodeSettings = {
      url: `${window.location.origin}/#admin`,
      handleCodeInApp: true,
    };

    /*
     * Before sending the link, check whether
     * this email belongs to an admin.
     *
     * We cannot query users by email here because
     * Firestore rules may restrict that query.
     *
     * Firebase itself will send the link only to
     * an existing/authenticated email account when
     * configured accordingly.
     */
    await sendSignInLinkToEmail(
      auth,
      email,
      actionCodeSettings
    );

    /*
     * Save email temporarily so that when the admin
     * clicks the link we know which email was used.
     */
    window.localStorage.setItem(
      'adminMagicLinkEmail',
      email
    );
  };


  /*
   * COMPLETE MAGIC LINK LOGIN
   */
  const completeMagicLinkLogin =
    async (): Promise<void> => {

      if (!firebaseAuth || !firestoreDb) {

        throw new Error(
          'Firebase is not configured.'
        );
      }

      const auth = firebaseAuth;

      /*
       * Check whether the current URL contains
       * a Firebase email sign-in link.
       */
      if (
        !isSignInWithEmailLink(
          auth,
          window.location.href
        )
      ) {
        return;
      }

      setLoading(true);

      try {

        let email =
          window.localStorage.getItem(
            'adminMagicLinkEmail'
          );

        /*
         * If email is not available in localStorage,
         * ask the admin to enter it.
         */
        if (!email) {

          email = window.prompt(
            'Please enter your email address to complete login:'
          );

          if (!email) {

            throw new Error(
              'Email address is required to complete login.'
            );
          }
        }

        /*
         * Complete Firebase passwordless login.
         */
        const result =
          await signInWithEmailLink(
            auth,
            email,
            window.location.href
          );

        const user = result.user;

        /*
         * Remove saved email after successful login.
         */
        window.localStorage.removeItem(
          'adminMagicLinkEmail'
        );

        /*
         * Verify Firestore admin role.
         */
        const isAdmin =
          await verifyAdmin(user);

        if (!isAdmin) {

          await signOut(auth);

          throw new Error(
            'Access denied. This account is not an admin.'
          );
        }

        setAdminUser(user);
        setIsAdminAuthenticated(true);

        /*
         * Remove Firebase email-link parameters
         * from browser URL.
         */
        window.history.replaceState(
          {},
          document.title,
          '/#admin'
        );

      } catch (error) {

        setAdminUser(null);
        setIsAdminAuthenticated(false);

        throw error;

      } finally {

        setLoading(false);
      }
    };


  /*
   * LOGOUT
   */
  const logout = async (): Promise<void> => {

    if (firebaseAuth) {

      await signOut(firebaseAuth);
    }

    setAdminUser(null);
    setIsAdminAuthenticated(false);
  };


  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminAuthenticated,
        loading,
        login,
        sendMagicLink,
        completeMagicLinkLogin,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};


export const useAdminAuth =
  (): AdminAuthContextType => {

    const context =
      useContext(AdminAuthContext);

    if (!context) {

      throw new Error(
        'useAdminAuth must be used inside AdminAuthProvider'
      );
    }

    return context;
  };