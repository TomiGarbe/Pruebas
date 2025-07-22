import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { firebaseConfig, firebaseVapidKey } from '../config';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Este código elimina todos los service workers registrados
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister().then(success => {
        if (success) {
          console.log('Service worker unregistered:', registration);
        }
      });
    }
  }).finally(() => {
    // Registrar el nuevo service worker
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('Nuevo service worker registrado:', registration);
      })
      .catch(error => {
        console.error('Error al registrar service worker:', error);
      });
  });
}

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
    console.log('FCM Token:', currentToken); // Debug log
    return currentToken;
  } catch (err) {
    console.error('Error al obtener token de dispositivo:', err);
    return null;
  }
};

onMessage(messaging, (payload) => {
  console.log('Foreground message received:', JSON.stringify(payload));
  try {
    const notificationTitle = payload.notification.title || 'Notification';
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icons/icon-192x192.png'
    };
    // Display notification for foreground messages
    if (Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
      console.log('Foreground notification displayed:', notificationTitle, notificationOptions);
    } else {
      console.warn('Notification permission not granted');
    }
  } catch (error) {
    console.error('Error displaying foreground notification:', error);
  }
});

export { database, auth, messaging, getDeviceToken, onMessage, deleteToken, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup, signInWithRedirect, getRedirectResult };