import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';

const ADMIN_EMAIL = 'malikakshay075@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  adminPinAuth: boolean;
  setAdminPinAuth: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminRole, setIsAdminRole] = useState<boolean>(false);
  const [adminPinAuth, setAdminPinAuth] = useState<boolean>(() => {
    return sessionStorage.getItem('ad_nutrition_admin_auth') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        let isUserAdmin = false;
        // 1. Check primary admin email
        if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          isUserAdmin = true;
        } else {
          // 2. Check /admins/{uid} in Firestore
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
              isUserAdmin = true;
            }
          } catch {
            // Ignored - regular user
          }
        }
        setIsAdminRole(isUserAdmin);

        // Sync user profile document in Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email || '',
              displayName: user.displayName || 'Customer',
              photoURL: user.photoURL || '',
              role: isUserAdmin ? 'admin' : 'customer',
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Could not sync user profile to Firestore:', e);
        }
      } else {
        setIsAdminRole(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      sessionStorage.removeItem('ad_nutrition_admin_auth');
      setAdminPinAuth(false);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const effectiveIsAdmin = isAdminRole || adminPinAuth;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: effectiveIsAdmin,
        isLoading,
        signInWithGoogle,
        logout,
        adminPinAuth,
        setAdminPinAuth: (val: boolean) => {
          setAdminPinAuth(val);
          if (val) {
            sessionStorage.setItem('ad_nutrition_admin_auth', 'true');
          } else {
            sessionStorage.removeItem('ad_nutrition_admin_auth');
          }
        },
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
