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

function getAuthErrorMessage(error, action) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'Este correo ya tiene una cuenta. Inicia sesión en lugar de crear otra.';
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'El registro con correo y contraseña no está habilitado en Firebase.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Firebase. Revisa tu conexión a internet e inténtalo de nuevo.';
    case 'auth/too-many-requests':
      return 'Hubo demasiados intentos. Espera un momento antes de volver a intentarlo.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada. Contacta al administrador.';
    default:
      return action === 'signup'
        ? 'No se pudo crear la cuenta. Inténtalo de nuevo.'
        : 'No se pudo iniciar sesión. Inténtalo de nuevo.';
  }
}

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
      setError(getAuthErrorMessage(err, 'login'));
      throw err;
    }
  }

  async function signup(email, password) {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'signup'));
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
    clearError: () => setError(null),
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
