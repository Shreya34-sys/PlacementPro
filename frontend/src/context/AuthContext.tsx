import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  setRole: (role: UserRole) => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  login: (email: string, password?: string, role?: UserRole) => Promise<boolean>;
  register: (user: Partial<UserProfile>, password?: string) => Promise<void>;
  continueWithGoogle: (user: Partial<UserProfile>) => void;
  logout: () => void;
}

import { registerWithEmail, loginWithEmail } from '../utils/emailAuth';

// NOTE: This produces a client-side session token for development/demo use only.
// It is NOT cryptographically signed — do not use it for any server-side
// authentication decisions. Replace with Firebase ID tokens for production security.
const generateJwtToken = (user: UserProfile): string => {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  }));
  // UNSIGNED — for local session storage only, not for server verification
  return `${header}.${payload}.unsigned`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A minimal guest profile used as a placeholder when no session exists.
// isAuthenticated is false when this placeholder is active, so all protected
// routes still redirect to login. This prevents null-pointer crashes in
// components that were built assuming currentUser is always non-null.
const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'Guest',
  email: '',
  role: 'student',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Track whether the current session is genuinely authenticated (i.e. the user
  // explicitly logged in), separate from currentUser which may be a guest stub.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('placementpro_user');
      const savedToken = localStorage.getItem('placementpro_token');
      return !!(savedUser && savedToken);
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('placementpro_user');
      const savedToken = localStorage.getItem('placementpro_token');
      if (savedUser && savedToken) {
        return JSON.parse(savedUser) as UserProfile;
      }
    } catch (e) {
      console.error('Error parsing stored auth session:', e);
      localStorage.removeItem('placementpro_user');
      localStorage.removeItem('placementpro_token');
    }
    // No session — return a guest stub so components don't null-crash
    return GUEST_USER;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('placementpro_token') || (currentUser ? generateJwtToken(currentUser) : null);
  });

  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest') {
      const jwt = generateJwtToken(currentUser);
      setToken(jwt);
      localStorage.setItem('placementpro_user', JSON.stringify(currentUser));
      localStorage.setItem('placementpro_token', jwt);
    }
  }, [currentUser]);

  // Helper to fully sign in a user
  const signIn = (user: UserProfile) => {
    const jwt = generateJwtToken(user);
    setToken(jwt);
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('placementpro_user', JSON.stringify(user));
    localStorage.setItem('placementpro_token', jwt);
  };

  const setRole = (role: UserRole) => {
    const found = mockUsers.find((u) => u.role === role) || {
      id: `usr-${Date.now()}`,
      name: role === 'tpo' ? 'Placement Officer' : role === 'recruiter' ? 'Recruiter User' : 'Student Candidate',
      email: `${role}@placementpro.edu`,
      role,
    };
    signIn(found);
  };

  const login = async (email: string, password?: string, role?: UserRole) => {
    if (password) {
      try {
        const userProfile = await loginWithEmail(email, password);
        signIn(userProfile as UserProfile);
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    } else {
      let found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found && role) found = mockUsers.find((u) => u.role === role);
      if (!found) {
        found = {
          id: `usr-${Date.now()}`,
          name: email.split('@')[0].replace('.', ' ') || 'Student Candidate',
          email,
          role: role || 'student',
          department: 'Computer Science & Engineering',
          cgpa: 8.8,
          batchYear: '2026',
          phone: '+91 98765 43210',
        };
      }
      signIn(found);
      return true;
    }
  };

  const register = async (newUser: Partial<UserProfile>, password?: string) => {
    if (password && newUser.name && newUser.email) {
      try {
        const userProfile = await registerWithEmail(newUser.name, newUser.email, password);
        signIn(userProfile as UserProfile);
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    } else {
      const user: UserProfile = {
        id: `usr-${Date.now()}`,
        name: newUser.name || 'Student Candidate',
        email: newUser.email || 'student@placementpro.edu',
        role: newUser.role || 'student',
        avatarUrl: newUser.avatarUrl,
        department: newUser.department || 'Computer Science & Engineering',
        cgpa: newUser.cgpa || 8.5,
        batchYear: newUser.batchYear || '2026',
        phone: newUser.phone || '',
        companyName: newUser.companyName || '',
      };
      mockUsers.push(user);
      signIn(user);
    }
  };

  const continueWithGoogle = (googleUser: Partial<UserProfile>) => {
    const email = googleUser.email || 'student.google@placementpro.edu';
    const existing = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const user: UserProfile = {
      ...(existing || {
        id: `usr-${Date.now()}`,
        role: 'student' as UserRole,
        department: 'Computer Science & Engineering',
        cgpa: 8.5,
        batchYear: '2026',
        phone: '',
        companyName: '',
      }),
      ...googleUser,
      email,
      name: googleUser.name || existing?.name || email.split('@')[0].replace('.', ' '),
      role: googleUser.role || existing?.role || 'student',
    };
    if (!existing) mockUsers.push(user);
    signIn(user);
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
    localStorage.removeItem('placementpro_user');
    localStorage.removeItem('placementpro_token');
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser || currentUser.id === 'guest') return;
    const updatedUser = { ...currentUser, ...updated };
    const jwt = generateJwtToken(updatedUser);
    setCurrentUser(updatedUser);
    setToken(jwt);
    localStorage.setItem('placementpro_user', JSON.stringify(updatedUser));
    localStorage.setItem('placementpro_token', jwt);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        token,
        setRole,
        updateProfile,
        login,
        register,
        continueWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

