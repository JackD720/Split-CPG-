import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL
        };
        setUser(userData);
        
        // Check if user has a company
        try {
          const companyDoc = await getDoc(doc(db, 'companies', firebaseUser.uid));
          if (companyDoc.exists()) {
            setCompany({ id: companyDoc.id, ...companyDoc.data() });
          } else {
            const storedCompany = localStorage.getItem('split_company');
            if (storedCompany) {
              setCompany(JSON.parse(storedCompany));
            }
          }
        } catch (error) {
          console.error('Error fetching company:', error);
          const storedCompany = localStorage.getItem('split_company');
          if (storedCompany) {
            setCompany(JSON.parse(storedCompany));
          }
        }
      } else {
        setUser(null);
        setCompany(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up with email/password
  const signup = async (email, password, name) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  };

  // Login with email/password
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // Login with Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setCompany(null);
    localStorage.removeItem('split_company');
  };

  // Create/update company in Firestore
  const setCurrentCompany = async (companyData) => {
    if (!user) return;
    
    try {
      const companyRef = doc(db, 'companies', user.id);
      await setDoc(companyRef, {
        ...companyData,
        userId: user.id,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setCompany({ id: user.id, ...companyData });
      localStorage.setItem('split_company', JSON.stringify({ id: user.id, ...companyData }));
    } catch (error) {
      console.error('Error saving company:', error);
      setCompany({ id: user.id, ...companyData });
      localStorage.setItem('split_company', JSON.stringify({ id: user.id, ...companyData }));
    }
  };

  const updateCompany = async (updates) => {
    if (!user || !company) return;
    
    const updated = { ...company, ...updates, updatedAt: new Date().toISOString() };
    
    try {
      const companyRef = doc(db, 'companies', user.id);
      await setDoc(companyRef, updated, { merge: true });
    } catch (error) {
      console.error('Error updating company:', error);
    }
    
    setCompany(updated);
    localStorage.setItem('split_company', JSON.stringify(updated));
  };

  const value = {
    user,
    company,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    setCurrentCompany,
    updateCompany,
    isAuthenticated: !!user,
    hasCompany: !!company
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
