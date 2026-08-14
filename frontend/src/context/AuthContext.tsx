import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  setRole: (role: UserRole) => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  login: (email: string, role?: UserRole) => boolean;
  register: (user: Partial<UserProfile>) => void;
  continueWithGoogle: (user: Partial<UserProfile>) => void;
  logout: () => void;
}

const generateJwtToken = (user: UserProfile): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  }));
  const signature = 'placementpro_jwt_signature_secure_key';
  return `${header}.${payload}.${signature}`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('placementpro_user');
      const savedToken = localStorage.getItem('placementpro_token');
      if (savedUser && savedToken) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Error parsing stored auth session:', e);
    }
    // Default student user for active session preview
    const initial = mockUsers[0];
    const initialToken = generateJwtToken(initial);
    localStorage.setItem('placementpro_user', JSON.stringify(initial));
    localStorage.setItem('placementpro_token', initialToken);
    return initial;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('placementpro_token') || (currentUser ? generateJwtToken(currentUser) : null);
  });

  useEffect(() => {
    if (currentUser) {
      const jwt = generateJwtToken(currentUser);
      setToken(jwt);
      localStorage.setItem('placementpro_user', JSON.stringify(currentUser));
      localStorage.setItem('placementpro_token', jwt);
    }
  }, [currentUser]);

  const setRole = (role: UserRole) => {
    const found = mockUsers.find((u) => u.role === role) || {
      id: `usr-${Date.now()}`,
      name: role === 'tpo' ? 'Placement Officer' : role === 'recruiter' ? 'Recruiter User' : 'Student Candidate',
      email: `${role}@placementpro.edu`,
      role,
    };
    const jwt = generateJwtToken(found);
    setToken(jwt);
    setCurrentUser(found);
    localStorage.setItem('placementpro_user', JSON.stringify(found));
    localStorage.setItem('placementpro_token', jwt);
  };

  const login = (email: string, role?: UserRole) => {
    let found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found && role) {
      found = mockUsers.find((u) => u.role === role);
    }
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
    const jwt = generateJwtToken(found);
    setToken(jwt);
    setCurrentUser(found);
    localStorage.setItem('placementpro_user', JSON.stringify(found));
    localStorage.setItem('placementpro_token', jwt);
    return true;
  };

  const register = (newUser: Partial<UserProfile>) => {
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
    const jwt = generateJwtToken(user);
    setToken(jwt);
    setCurrentUser(user);
    localStorage.setItem('placementpro_user', JSON.stringify(user));
    localStorage.setItem('placementpro_token', jwt);
  };

  const continueWithGoogle = (googleUser: Partial<UserProfile>) => {
    const email = googleUser.email || 'student.google@placementpro.edu';
    const existing = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const user: UserProfile = {
      ...(existing || {
        id: `usr-${Date.now()}`,
        role: 'student',
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

    if (!existing) {
      mockUsers.push(user);
    }

    const jwt = generateJwtToken(user);
    setToken(jwt);
    setCurrentUser(user);
    localStorage.setItem('placementpro_user', JSON.stringify(user));
    localStorage.setItem('placementpro_token', jwt);
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('placementpro_user');
    localStorage.removeItem('placementpro_token');
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
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
        isAuthenticated: currentUser !== null,
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

