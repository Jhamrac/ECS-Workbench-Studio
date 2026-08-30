import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle as googleSignIn,
  registerWithEmail as registerEmail,
  loginWithEmail as loginEmail,
  resetPasswordEmail as sendResetEmail,
  updateAccountPassword as updateAccPass,
  logoutUser,
  ensureUserProfile,
  subscribeToCloudPrograms,
  saveStationProgramToCloud,
  deleteStationProgramFromCloud,
  CloudStationProgram,
  getActiveLocalAccount,
  createMockUser
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isLoadingAuth: boolean;
  cloudPrograms: CloudStationProgram[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  loginWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  updateAccountPassword: (email: string, newPass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  saveCurrentToCloud: (program: {
    id: string;
    title: string;
    category?: string;
    description?: string;
    blocks: any[];
    links: any[];
    sequenceOfOperation?: string;
  }) => Promise<string | undefined>;
  deleteFromCloud: (programId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoadingAuth: true,
  cloudPrograms: [],
  isSyncing: false,
  lastSyncedAt: null,
  loginWithGoogle: async () => {},
  registerWithEmail: async () => {},
  loginWithEmail: async () => {},
  sendResetPasswordEmail: async () => {},
  updateAccountPassword: async () => false,
  logout: async () => {},
  saveCurrentToCloud: async () => undefined,
  deleteFromCloud: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [cloudPrograms, setCloudPrograms] = useState<CloudStationProgram[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          await ensureUserProfile(currentUser);
        } else {
          const local = getActiveLocalAccount();
          if (local) {
            setUser(createMockUser(local.uid, local.email, local.name));
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth state change handler notice:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to cloud programs when logged in
  useEffect(() => {
    if (!user) {
      setCloudPrograms([]);
      return;
    }

    setIsSyncing(true);
    const unsub = subscribeToCloudPrograms(
      user.uid,
      (progs) => {
        setCloudPrograms(progs);
        setIsSyncing(false);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      },
      (err) => {
        console.warn('Cloud program subscription notice:', err);
        setIsSyncing(false);
      }
    );

    return () => unsub();
  }, [user]);

  const loginWithGoogle = async () => {
    setIsSyncing(true);
    try {
      const gUser = await googleSignIn();
      if (gUser) setUser(gUser);
    } finally {
      setIsSyncing(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    setIsSyncing(true);
    try {
      const regUser = await registerEmail(email, pass, name);
      if (regUser) setUser(regUser);
    } finally {
      setIsSyncing(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsSyncing(true);
    try {
      const inUser = await loginEmail(email, pass);
      if (inUser) setUser(inUser);
    } finally {
      setIsSyncing(false);
    }
  };

  const sendResetPasswordEmail = async (email: string) => {
    await sendResetEmail(email);
  };

  const updateAccountPassword = async (email: string, newPass: string) => {
    return await updateAccPass(email, newPass);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const saveCurrentToCloud = async (program: {
    id: string;
    title: string;
    category?: string;
    description?: string;
    blocks: any[];
    links: any[];
    sequenceOfOperation?: string;
  }) => {
    if (!user) return undefined;
    setIsSyncing(true);
    try {
      const savedId = await saveStationProgramToCloud(user.uid, program);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return savedId;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteFromCloud = async (programId: string) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await deleteStationProgramFromCloud(user.uid, programId);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        cloudPrograms,
        isSyncing,
        lastSyncedAt,
        loginWithGoogle,
        registerWithEmail,
        loginWithEmail,
        sendResetPasswordEmail,
        updateAccountPassword,
        logout,
        saveCurrentToCloud,
        deleteFromCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
