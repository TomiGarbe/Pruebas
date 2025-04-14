import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const idToken = await user.getIdToken();
  return idToken;
};

const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const idToken = await user.getIdToken();
  return idToken;
};

const verifyUserWithBackend = async (idToken) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!response.ok) {
    throw new Error('No se pudo verificar el usuario en el backend');
  }

  const data = await response.json();
  localStorage.setItem('userRole', data.role);
};

const signOutUser = async () => {
  await auth.signOut();
  localStorage.removeItem('userRole');
};

export { signInWithGoogle, signInWithEmail, verifyUserWithBackend, signOutUser };