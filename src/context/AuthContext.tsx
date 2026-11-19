import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, ADMIN_EMAIL } from '../firebase';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      setAuthError(null);

      if (!currentUser) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const isBootstrap =
        currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
        currentUser.emailVerified;

      if (isBootstrap) {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        setLoading(false);
        return;
      }

      setIsSuperAdmin(false);
      let granted = false;

      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        if (adminSnap.exists() && adminSnap.data()?.role === 'admin') {
          granted = true;
        }
      } catch {
        // Ignore if uid not in /admins
      }

      if (!granted && currentUser.emailVerified && currentUser.email) {
        try {
          const inviteSnap = await getDoc(
            doc(db, 'editorInvites', currentUser.email.toLowerCase())
          );
          if (inviteSnap.exists()) {
            granted = true;
          }
        } catch {
          // Ignore if email not invited
        }
      }

      setIsAdmin(granted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to sign in with Google.';
      setAuthError(msg);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin,
        loading,
        authError,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
