import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db, isConfigValid } from '../firebase/firebase';

const AuthContext = createContext();
 
export const getAppBaseUrl = () => {
  // 1. If running in browser, dynamically use current window.location.origin (e.g. http://localhost:5173 locally or deployed origin in production)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  // 2. Fallback to explicit environment variable if configured
  const envUrl = import.meta.env.VITE_APP_URL || import.meta.env.VITE_SITE_URL || import.meta.env.VITE_PUBLIC_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return '';
};

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // SEED MOCK USERS IN LOCAL STORAGE (if not present or if admin config changes)
  useEffect(() => {
    if (!isConfigValid) {
      const mockUsers = localStorage.getItem('mediquick_users');
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@mediquick.com';
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

      let users = [];
      if (mockUsers) {
        try {
          users = JSON.parse(mockUsers);
        } catch (_e) {
          users = [];
        }
      }

      // Check if admin user exists in list, update details or append
      const adminIdx = users.findIndex(u => u.role === 'admin');
      const adminUser = {
        uid: 'admin-uid',
        email: adminEmail,
        password: adminPassword,
        displayName: 'Administrator',
        role: 'admin',
        phone: '9876543210',
        gender: 'Male',
        dob: '1990-01-01',
      };

      if (adminIdx !== -1) {
        users[adminIdx] = adminUser;
      } else {
        users.push(adminUser);
      }

      // Seed a default test standard user if no other users exist
      if (!users.some(u => u.role === 'user' || u.role === 'customer')) {
        users.push({
          uid: 'user-uid',
          email: 'user@mediquick.com',
          password: 'password123',
          displayName: 'John Doe',
          role: 'user',
          phone: '9876543211',
          gender: 'Male',
          dob: '1995-05-15',
        });
      }

      localStorage.setItem('mediquick_users', JSON.stringify(users));
    }
  }, []);

  // Track authentication state
  useEffect(() => {
    if (isConfigValid && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Get user details/role from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            if (userData.isBlocked) {
              await signOut(auth);
              setCurrentUser(null);
              localStorage.removeItem('mediquick_current_user');
              setLoading(false);
              return;
            }
            const fullUser = {
              uid: user.uid,
              email: user.email,
              displayName: userData.fullName || user.displayName || '',
              fullName: userData.fullName || user.displayName || '',
              role: userData.role || 'user',
              mobileNumber: userData.mobileNumber || '',
              gender: userData.gender || '',
              dateOfBirth: userData.dateOfBirth || '',
              createdAt: userData.createdAt || new Date().toISOString()
            };
            setCurrentUser(fullUser);
          } catch (e) {
            console.error("Error fetching user metadata:", e);
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              fullName: user.displayName || '',
              role: 'user',
              mobileNumber: '',
              gender: '',
              dateOfBirth: '',
              createdAt: new Date().toISOString()
            });
          }
        } else {
          const storedUser = localStorage.getItem('mediquick_current_user');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              if (parsed && parsed.role === 'admin') {
                setCurrentUser(parsed);
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error("Error parsing admin session:", e);
            }
          }
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Mock Auth State Check
      const storedUser = localStorage.getItem('mediquick_current_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Check mock user blocking status
        const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
        const matched = users.find(u => u.uid === parsed.uid);
        if (matched && matched.isBlocked) {
          localStorage.removeItem('mediquick_current_user');
          setCurrentUser(null);
        } else {
          setCurrentUser(parsed);
        }
      }
      setLoading(false);
    }
  }, []);

  // Real-time blocker observer for active sessions
  useEffect(() => {
    let unsubscribe;
    if (isConfigValid && db && auth && currentUser?.uid && currentUser?.role !== 'admin') {
      unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data && data.isBlocked) {
            await signOut(auth);
            setCurrentUser(null);
            localStorage.removeItem('mediquick_current_user');
          }
        }
      });
    } else if (!isConfigValid || !auth) {
      // Mock mode blocking monitor
      const checkBlocked = () => {
        if (currentUser?.uid && currentUser?.role !== 'admin') {
          const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
          const matched = users.find(u => u.uid === currentUser.uid);
          if (matched && matched.isBlocked) {
            setCurrentUser(null);
            localStorage.removeItem('mediquick_current_user');
          }
        }
      };
      checkBlocked();
      window.addEventListener('storage', checkBlocked);
      return () => window.removeEventListener('storage', checkBlocked);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid]);

  const login = async (email, password) => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@mediquick.com';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

    // Intercept Admin credentials check
    if (email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
      if (password === adminPassword) {
        const adminSession = {
          uid: 'admin-uid',
          email: adminEmail,
          displayName: 'Administrator',
          role: 'admin'
        };
        localStorage.setItem('mediquick_current_user', JSON.stringify(adminSession));
        setCurrentUser(adminSession);
        return adminSession;
      } else {
        throw new Error('Invalid admin credentials.');
      }
    }

    if (isConfigValid && auth) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      if (userData && userData.isBlocked) {
        await signOut(auth);
        throw new Error('Your account has been blocked by the administrator. Please contact support for assistance.');
      }
      
      const fullUser = { 
        uid: firebaseUser.uid, 
        email: firebaseUser.email, 
        role: (userData && userData.role) || 'user',
        ...userData 
      };
      setCurrentUser(fullUser);
      return fullUser;
    } else {
      // Mock Login
      const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!user) {
        throw new Error('No account found with this email or password.');
      }
      if (user.isBlocked) {
        throw new Error('Your account has been blocked by the administrator. Please contact support for assistance.');
      }
      const userSession = { 
        uid: user.uid, 
        email: user.email, 
        displayName: user.displayName, 
        role: user.role || 'user', 
        phone: user.phone 
      };
      localStorage.setItem('mediquick_current_user', JSON.stringify(userSession));
      setCurrentUser(userSession);
      return userSession;
    }
  };

  const register = async (email, password, displayName, profileData = {}) => {
    if (isConfigValid && auth) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userProfile = {
        fullName: displayName || profileData.fullName || '',
        email: user.email,
        mobileNumber: profileData.mobileNumber || '',
        gender: profileData.gender || '',
        dateOfBirth: profileData.dateOfBirth || '',
        role: 'user', // Enforce secure role 'user' from backend/context
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      setCurrentUser({ uid: user.uid, ...userProfile });
      return { uid: user.uid, ...userProfile };
    } else {
      // Mock Register
      const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email is already registered.');
      }

      const newUser = {
        uid: `mock-uid-${Date.now()}`,
        fullName: displayName || profileData.fullName || '',
        email,
        password,
        mobileNumber: profileData.mobileNumber || '',
        gender: profileData.gender || '',
        dateOfBirth: profileData.dateOfBirth || '',
        role: 'user', // Enforce secure role 'user'
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('mediquick_users', JSON.stringify(users));

      const userSession = { 
        uid: newUser.uid, 
        email: newUser.email, 
        displayName: newUser.fullName, 
        fullName: newUser.fullName,
        role: 'user',
        mobileNumber: newUser.mobileNumber,
        gender: newUser.gender,
        dateOfBirth: newUser.dateOfBirth,
        createdAt: newUser.createdAt
      };
      localStorage.setItem('mediquick_current_user', JSON.stringify(userSession));
      setCurrentUser(userSession);
      return userSession;
    }
  };

  // Logout Function
  const logout = async () => {
    localStorage.removeItem('mediquick_current_user');
    sessionStorage.clear();
    
    // Clear all cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }

    if (isConfigValid && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Error during Firebase signOut:", err);
      }
    }
    setCurrentUser(null);
  };

  // Google Login / Signup
  const loginWithGoogle = async () => {
    if (isConfigValid && auth) {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Query collection 'users' to check if user's email already exists
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Log the user back out immediately
        await signOut(auth);
        throw new Error("This Google account is not registered. Please sign up first or use a registered account.");
      }

      let userProfile = {};
      querySnapshot.forEach((docSnap) => {
        userProfile = { uid: docSnap.id, ...docSnap.data() };
      });

      if (userProfile.isBlocked) {
        await signOut(auth);
        throw new Error('Your account has been blocked by the administrator. Please contact support for assistance.');
      }

      setCurrentUser(userProfile);
      return userProfile;
    } else {
      // Mock Google Login - check if mock user is registered
      const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
      const registeredUser = users.find(u => u.email.toLowerCase() === 'googleuser@mediquick.com');
      if (!registeredUser) {
        throw new Error("This Google account is not registered. Please sign up first or use a registered account.");
      }
      if (registeredUser.isBlocked) {
        throw new Error('Your account has been blocked by the administrator. Please contact support for assistance.');
      }
      const userSession = { 
        uid: registeredUser.uid, 
        email: registeredUser.email, 
        displayName: registeredUser.fullName, 
        role: registeredUser.role || 'user' 
      };
      localStorage.setItem('mediquick_current_user', JSON.stringify(userSession));
      setCurrentUser(userSession);
      return userSession;
    }
  };

  // Apple Login / Signup
  const loginWithApple = async () => {
    const userSession = { 
      uid: 'apple-mock-uid', 
      email: 'appleuser@mediquick.com', 
      displayName: 'Apple User', 
      role: 'user' 
    };
    localStorage.setItem('mediquick_current_user', JSON.stringify(userSession));
    setCurrentUser(userSession);
    return userSession;
  };

  // Forgot Password helper
  const sendPasswordReset = async (email) => {
    if (!email || typeof email !== 'string') {
      const err = new Error('Registered email address is required.');
      err.code = 'auth/invalid-email';
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(cleanEmail)) {
      const err = new Error('The email address is invalid.');
      err.code = 'auth/invalid-email';
      throw err;
    }

    if (isConfigValid && auth) {
      let isRegistered = false;

      // 1. Check if email matches configured admin email
      const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@mediquick.com').trim().toLowerCase();
      if (cleanEmail === adminEmail) {
        isRegistered = true;
      }

      // 2. Check Firestore 'users' collection for registered email
      if (!isRegistered && db) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            isRegistered = true;
          } else {
            // Also check original case if entered differently
            const originalEmail = email.trim();
            if (originalEmail !== cleanEmail) {
              const qExact = query(collection(db, 'users'), where('email', '==', originalEmail));
              const exactSnapshot = await getDocs(qExact);
              if (!exactSnapshot.empty) {
                isRegistered = true;
              }
            }
          }
        } catch (dbErr) {
          console.warn("[AuthContext] Firestore check for registered user warning:", dbErr);
        }
      }

      // 3. Check Firebase Auth sign-in methods
      if (!isRegistered) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
          if (methods && methods.length > 0) {
            isRegistered = true;
          }
        } catch (authErr) {
          if (authErr.code === 'auth/user-not-found') {
            isRegistered = false;
          } else if (authErr.code === 'auth/invalid-email') {
            const err = new Error('The email address is invalid.');
            err.code = 'auth/invalid-email';
            throw err;
          }
        }
      }

      // 4. Fallback check for local mock users if present
      if (!isRegistered) {
        const mockUsers = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
        if (mockUsers.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
          isRegistered = true;
        }
      }

      // If user is not registered in the system, do NOT send reset email and throw error
      if (!isRegistered) {
        const notFoundError = new Error('No account found with this email address.');
        notFoundError.code = 'auth/user-not-found';
        throw notFoundError;
      }

      try {
        const baseUrl = getAppBaseUrl();
        const actionCodeSettings = {
          url: `${baseUrl}/reset-password`,
          handleCodeInApp: true
        };
        await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
      } catch (error) {
        console.error("[Firebase Auth] Firebase error sending password reset:", error);
        throw error;
      }
    } else {
      // Mock Auth Mode
      const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@mediquick.com').trim().toLowerCase();
      const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
      const matched = users.find(u => u.email && u.email.toLowerCase() === cleanEmail) || (cleanEmail === adminEmail ? { email: adminEmail } : null);
      
      if (!matched) {
        const notFoundError = new Error('No account found with this email address.');
        notFoundError.code = 'auth/user-not-found';
        throw notFoundError;
      }

      const baseUrl = getAppBaseUrl();
      const mockCode = `mock-code-${Date.now()}`;
      const mockResetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(cleanEmail)}&oobCode=${mockCode}`;
      console.log(`[Mock Reset Password Link]: ${mockResetUrl}`);
      window.latestMockResetUrl = mockResetUrl;
      if (typeof window !== 'undefined' && window.location?.origin) {
        window.latestLocalMockResetUrl = `${window.location.origin}/reset-password?email=${encodeURIComponent(cleanEmail)}&oobCode=${mockCode}`;
      }
    }
  };

  // Verify Reset Code helper
  const verifyResetCode = async (oobCode) => {
    const usedCodes = JSON.parse(sessionStorage.getItem('mediquick_used_mock_codes') || '[]');
    if (oobCode && usedCodes.includes(oobCode)) {
      throw new Error('This password reset link is invalid or has expired. Please request a new reset link.');
    }

    if (isConfigValid && auth) {
      if (oobCode && oobCode.startsWith('mock-code')) {
        return 'user@mediquick.com';
      }
      try {
        return await verifyPasswordResetCode(auth, oobCode);
      } catch (err) {
        if (oobCode && oobCode.startsWith('mock-code')) {
          return 'user@mediquick.com';
        }
        throw err;
      }
    } else {
      if (oobCode && oobCode.startsWith('mock-code')) {
        return 'user@mediquick.com';
      }
      return 'user@mediquick.com';
    }
  };

  // Reset Password code validator/handler
  const resetPassword = async (oobCode, newPassword, mockEmail) => {
    const usedCodes = JSON.parse(sessionStorage.getItem('mediquick_used_mock_codes') || '[]');
    if (oobCode && usedCodes.includes(oobCode)) {
      throw new Error('This password reset link is invalid or has expired. Please request a new reset link.');
    }

    if (isConfigValid && auth && oobCode && !oobCode.startsWith('mock-code')) {
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        return;
      } catch (error) {
        console.error("[Firebase Auth] Failed to confirm password reset:", error);
        throw error;
      }
    }

    // Mock / Local user reset
    const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
    const emailToFind = mockEmail || 'user@mediquick.com';
    let userIndex = users.findIndex(u => u.email && u.email.toLowerCase() === emailToFind.toLowerCase());
    if (userIndex === -1) {
      if (users.length > 0) {
        userIndex = 0;
      } else {
        users.push({
          uid: 'user-uid',
          email: emailToFind,
          password: newPassword,
          displayName: 'John Doe',
          role: 'user'
        });
        userIndex = 0;
      }
    }
    users[userIndex].password = newPassword;
    localStorage.setItem('mediquick_users', JSON.stringify(users));
    
    // Invalidate code upon successful reset
    if (oobCode) {
      usedCodes.push(oobCode);
      sessionStorage.setItem('mediquick_used_mock_codes', JSON.stringify(usedCodes));
    }
  };

  const updateUserProfile = (updatedFields) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      const storedUser = localStorage.getItem('mediquick_current_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem('mediquick_current_user', JSON.stringify({ ...parsed, ...updatedFields }));
        } catch (_e) {}
      }
      return updated;
    });
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithApple,
    sendPasswordReset,
    verifyResetCode,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
