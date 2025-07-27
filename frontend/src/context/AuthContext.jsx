import React, { createContext, useState, useEffect, useRef } from 'react';
import { auth, signOut, getDeviceToken, messaging, deleteToken, signInWithCredential, GoogleAuthProvider } from '../services/firebase';
import { saveToken } from '../services/notificaciones';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { googleClientId } from '../config';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [singingIn, setSingingIn] = useState(false);
  const navigate = useNavigate();
  const isVerifyingRef = useRef(false);
  const isVerifiedRef = useRef(false);
  const fcmSentRef = useRef(false);

  const verifyUser = async (user, idToken) => {
    isVerifyingRef.current = true;
    try {
      setLoading(true);
      setVerifying(true);

      const response = await api.post(
        '/auth/verify',
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      isVerifiedRef.current = true;
      setCurrentUser(user);
      setCurrentEntity(response.data);
      
      fcmSentRef.current = false;
      const fcmToken = await getDeviceToken();
      if (fcmToken) {
        fcmSentRef.current = true;
        const token_data = {
          token: fcmToken,
          firebase_uid: response.data.data.uid,
          device_info: navigator.userAgent
        };
        await saveToken(token_data);
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message;
      console.error('Final verification error:', errorDetail);
      const errorMessage =
        error.response?.status === 403
          ? 'Usuario no registrado. Por favor, crea una cuenta.'
          : error.response?.status === 401
          ? `Token de autenticación inválido: ${errorDetail}`
          : 'Error al verificar el usuario.';
      await logOut(errorMessage);
      return { success: false, data: null };
    } finally {
      isVerifyingRef.current = false;
      setLoading(false);
      setVerifying(false);
    }
  };

  const logOut = async (error) => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('googleIdToken');
    sessionStorage.removeItem('googleIdToken');
    setCurrentUser(null);
    setCurrentEntity(null);
    setLoading(false);
    setVerifying(false);
    isVerifyingRef.current = false;
    isVerifiedRef.current = false;
    await signOut(auth);
    try {
      // Delete FCM token
      const fcmToken = await getDeviceToken();
      if (fcmToken) {
        await deleteToken(messaging);
        console.log('FCM token deleted on logout');
      }
    } catch (err) {
      console.error('Error deleting FCM token:', err);
    }
    if (error) {
      navigate('/login', { state: { error: error } });
    } else {
      navigate('/login');
    }
  };

  const signInWithGoogle = async () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const idToken = response.credential;
              localStorage.setItem('googleIdToken', idToken);
              sessionStorage.setItem('googleIdToken', idToken);
              setSingingIn(true);
              resolve(idToken);
            } catch (error) {
              console.error('Error processing Google ID token:', error);
              reject(error);
            }
          },
          ux_mode: 'popup',
        });
        window.google.accounts.id.prompt();
      };
      script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK'));
      document.body.appendChild(script);
    });
  };

  const handleGoogleSignIn = async () => {
    alert("handleGoogleSignIn");
    try {
      const idToken = sessionStorage.getItem('googleIdToken') || localStorage.getItem('googleIdToken');
      alert("idToken: " + idToken);
      if (!idToken) {
        return; // No token, no action
      }
      const credential = GoogleAuthProvider.credential(idToken);
      alert("credential: " + JSON.stringify(credential));
      const result = await signInWithCredential(auth, credential);
      alert("result: " + JSON.stringify(result));
      const user = result.user;
      alert("user: " + JSON.stringify(user));
      if (user) {
        const firebaseToken = await user.getIdToken();
        localStorage.setItem('authToken', firebaseToken);
        sessionStorage.setItem('authToken', firebaseToken);
        await verifyUser(user, firebaseToken);
        navigate('/');
      } else {
        await logOut('No se pudo obtener el usuario');
      }
    } catch (error) {
      console.error('Error en Google Sign-In:', error);
      await logOut(error.message);
    }
  };

  // Ejecutar al cargar la página
  useEffect(() => {
    handleGoogleSignIn();
  }, []);

  // Ejecutar cuando se establece un nuevo token
  useEffect(() => {
    if (singingIn) {
      setSingingIn(false); // Resetear para evitar bucles
      handleGoogleSignIn();
    }
  }, [singingIn]);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };