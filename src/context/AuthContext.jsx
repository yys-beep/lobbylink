import { createContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword 
} from 'firebase/auth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(name, email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Attach the display name to the newly created Firebase user
    await updateProfile(userCredential.user, { displayName: name });
    setCurrentUser({ ...userCredential.user, displayName: name });
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  async function updateUserPassword(newPassword) {
    if (!auth.currentUser) throw new Error("No user logged in.");
    return updatePassword(auth.currentUser, newPassword);
  }

  // ADDED: Live Database Profile Mutation Function
  async function updateProfileName(name) {
    if (!auth.currentUser) throw new Error("No authenticated user found");
    
    // 1. Commit the change permanently to the Firebase database
    await updateProfile(auth.currentUser, { displayName: name });
    
    // 2. Force a state update locally so React updates the layout everywhere instantly
    setCurrentUser({ ...auth.currentUser });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout,
    updateProfileName,
    updateUserPassword // EXPOSED HERE
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}