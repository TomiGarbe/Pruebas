import { initializeApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import { firebaseConfig } from '../config';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup };