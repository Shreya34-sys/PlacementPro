import { UserProfile } from '../types';

const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

export interface GoogleProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

const getGoogleClientId = () =>
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_GOOGLE_CLIENT_ID || '';

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const payload = token.split('.')[1];
  if (!payload) {
    throw new Error('Google did not return a valid credential.');
  }

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  );

  return JSON.parse(json);
};

const mapCredentialToProfile = (credential: string): GoogleProfile => {
  const payload = decodeJwtPayload(credential);
  const email = typeof payload.email === 'string' ? payload.email : '';

  if (!email) {
    throw new Error('Google account did not include an email address.');
  }

  return {
    name: typeof payload.name === 'string' ? payload.name : email.split('@')[0],
    email,
    avatarUrl: typeof payload.picture === 'string' ? payload.picture : undefined,
  };
};

const loadGoogleScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Google authentication.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Google authentication.'));
    document.head.appendChild(script);
  });

export const signInWithGoogle = async (): Promise<GoogleProfile> => {
  const clientId = getGoogleClientId();

  if (!clientId) {
    return {
      name: 'Google Student',
      email: 'student.google@placementpro.edu',
      avatarUrl: 'https://ui-avatars.com/api/?name=Google+Student&background=4285F4&color=fff',
    };
  }

  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const googleId = window.google?.accounts?.id;
    if (!googleId) {
      reject(new Error('Google authentication is unavailable right now.'));
      return;
    }

    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        try {
          if (!response.credential) {
            throw new Error('Google did not return a credential.');
          }
          resolve(mapCredentialToProfile(response.credential));
        } catch (error) {
          reject(error);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    googleId.prompt();
  });
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
