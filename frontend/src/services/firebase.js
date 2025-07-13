import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, firebaseVapidKey } from '../config';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

// Solicita permiso y obtiene el token FCM del dispositivo
const getDeviceToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: firebaseVapidKey
    });

    return currentToken;
  } catch (err) {
    console.error('Error al obtener token de dispositivo:', err);
    return null;
  }
};

export { database, auth, messaging, getDeviceToken, onMessage, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup };