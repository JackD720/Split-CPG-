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
        
        // Check if user has a company in Firestore
        let foundCompany = null;
        try {
          const companyDoc = await getDoc(doc(db, 'companies', firebaseUser.uid));
          if (companyDoc.exists()) {
            foundCompany = { id: companyDoc.id, ...companyDoc.data() };
            console.log('Company found in Firestore:', foundCompany.name);
          }
        } catch (error) {
          console.error('Error fetching company from Firestore:', error);
        }
        
        // If not in Firestore, check localStorage as backup
        if (!foundCompany) {
          const storedCompany = localStorage.getItem('split_company');
          if (storedCompany) {
            try {
              const parsed = JSON.parse(storedCompany);
              // Verify this company belongs to this user
              if (parsed.userId === firebaseUser.uid || parsed.id === firebaseUser.uid) {
                foundCompany = parsed;
                console.log('Company found in localStorage:', foundCompany.name);
                
                // Try to sync to Firestore
                try {
                  await setDoc(doc(db, 'companies', firebaseUser.uid), {
                    ...foundCompany,
                    userId: firebaseUser.uid,
                    syncedAt: new Date().toISOString()
                  }, { merge: true });
                  console.log('Synced localStorage company to Firestore');
                } catch (syncError) {
                  console.error('Failed to sync to Firestore:', syncError);
                }
              }
            } catch (parseError) {
              console.error('Error parsing stored company:', parseError);
            }
          }
        }
        
        setCompany(foundCompany);
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
    if (!user) {
      console.error('setCurrentCompany called without user');
      return;
    }
    
    const companyWithMeta = {
      ...companyData,
      id: user.id,
      userId: user.id,
      updatedAt: new Date().toISOString()
    };
    
    // Save to Firestore first
    try {
      const companyRef = doc(db, 'companies', user.id);
      await setDoc(companyRef, companyWithMeta, { merge: true });
      console.log('Company saved to Firestore successfully');
    } catch (error) {
      console.error('Error saving company to Firestore:', error);
      // Continue anyway - we'll save to localStorage as backup
    }
    
    // Update local state
    setCompany(companyWithMeta);
    
    // Save to localStorage as backup
    localStorage.setItem('split_company', JSON.stringify(companyWithMeta));
    console.log('Company saved to localStorage');
  };

  const updateCompany = async (updates) => {
    if (!user || !company) return;
    
    const updated = { 
      ...company, 
      ...updates, 
      userId: user.id,
      updatedAt: new Date().toISOString() 
    };
    
    try {
      const companyRef = doc(db, 'companies', user.id);
      await setDoc(companyRef, updated, { merge: true });
      console.log('Company updated in Firestore');
    } catch (error) {
      console.error('Error updating company in Firestore:', error);
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