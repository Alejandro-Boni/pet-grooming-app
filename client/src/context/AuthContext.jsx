import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = todavía cargando
  const [profile, setProfile] = useState(null); // { id, role, name, email, phone }
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const { user: syncedUser } = await api.get('/api/auth/me');
          setProfile(syncedUser);
        } catch (err) {
          setError(err.message);
        }
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  async function login(email, password) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Correo o contraseña incorrectos');
      throw err;
    }
  }

  async function signup(email, password) {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('No se pudo crear la cuenta. ¿Ya tienes una?');
      throw err;
    }
  }

  async function logout() {
    await signOut(auth);
  }

  const value = {
    firebaseUser,
    profile,
    isLoading: firebaseUser === undefined,
    isAuthenticated: !!firebaseUser,
    isAdmin: profile?.role === 'admin',
    error,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
