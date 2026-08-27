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
} from 'firebase/auth';     //why we didnt import it from utils,firebase? bcz we need to use the firebase auth instance that is initialized in the utils/firebase.ts file, and we also need to use the firebase auth functions that are provided by the firebase/auth package, so we import them from there.

import {
  doc,
  getDoc,
} from 'firebase/firestore'; //inbuilt firestore functions

import {
  firebaseAuth,
  firestoreDb,
} from '../utils/firebase';

interface AdminAuthContextType {   //used to define the shape of the context value that will be provided by the AdminAuthProvider component, and it also defines the types of the functions that will be used to login, send magic link, complete magic link login, and logout.
  adminUser: User | null;    //used to store the admin user object
  isAdminAuthenticated: boolean;  //used to check if the admin is authenticated
  loading: boolean;    //used to show loading state

  login: (
    email: string,
    password: string
  ) => Promise<void>;    //work of promise is to handle asynchronous operations, allowing the function to return a value in the future, and enabling the caller to use .then() and .catch() for handling success and error cases respectively.

  sendMagicLink: (
    email: string
  ) => Promise<void>;

  completeMagicLinkLogin: () => Promise<void>;    //used to complete the magic link login process after the user clicks the link in their email

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
      throw new Error(             //used to check if firestore is initialized or not
        'Firestore is not configured.'
      );
    }

    const db = firestoreDb;

    const adminRef = doc(    //used to create a reference to the admin document in firestore
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

      const result =          //This is the first major backend connection.
        await signInWithEmailAndPassword(
          firebaseAuth,
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