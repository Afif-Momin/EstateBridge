import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';

export const firebaseSignIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const firebaseSignUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const firebaseSignOut = () => signOut(auth);

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, callback);
