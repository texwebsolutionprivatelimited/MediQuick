import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db, isConfigValid } from '../firebase/firebase';

const AuthContext = createContext();

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
    const cleanEmail = email.trim().toLowerCase();
    if (isConfigValid && auth) {
      try {
        const actionCodeSettings = {
          url: `${window.location.origin}/reset-password`,
          handleCodeInApp: false
        };
        await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
      } catch (error) {
        console.error("[Firebase Auth] Firebase error sending password reset:", error);
        throw error;
      }
    } else {
      const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
      const matched = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (!matched) {
        throw new Error('No account found with this email.');
      }
      const mockResetUrl = `${window.location.origin}/reset-password?email=${encodeURIComponent(cleanEmail)}&oobCode=mock-code-${Date.now()}`;
      console.log(`[Mock Reset Password Link]: ${mockResetUrl}`);
      window.latestMockResetUrl = mockResetUrl;
    }
  };

  // Verify Reset Code helper
  const verifyResetCode = async (oobCode) => {
    if (isConfigValid && auth) {
      return await verifyPasswordResetCode(auth, oobCode);
    } else {
      const usedCodes = JSON.parse(sessionStorage.getItem('mediquick_used_mock_codes') || '[]');
      if (usedCodes.includes(oobCode)) {
        throw new Error('This password reset link is invalid or has expired. Please request a new reset link.');
      }
      if (oobCode && oobCode.startsWith('mock-code')) {
        return 'user@mediquick.com';
      }
      throw new Error('This password reset link is invalid or has expired. Please request a new reset link.');
    }
  };

  // Reset Password code validator/handler
  const resetPassword = async (oobCode, newPassword, mockEmail) => {
    if (isConfigValid && auth) {
      await confirmPasswordReset(auth, oobCode, newPassword);
    } else {
      const usedCodes = JSON.parse(sessionStorage.getItem('mediquick_used_mock_codes') || '[]');
      if (usedCodes.includes(oobCode)) {
        throw new Error('This password reset link is invalid or has expired. Please request a new reset link.');
      }
      const users = JSON.parse(localStorage.getItem('mediquick_users') || '[]');
      const emailToFind = mockEmail || 'user@mediquick.com';
      const userIndex = users.findIndex(u => u.email.toLowerCase() === emailToFind.toLowerCase());
      if (userIndex === -1) {
        throw new Error('User account not found.');
      }
      users[userIndex].password = newPassword;
      localStorage.setItem('mediquick_users', JSON.stringify(users));
      
      // Invalidate code upon successful reset
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
