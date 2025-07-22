import React, { createContext, useState, useEffect, useRef } from 'react';
import { auth, onAuthStateChanged, signOut, getDeviceToken, messaging, deleteToken, getRedirectResult } from '../services/firebase';
import { saveToken } from '../services/notificaciones';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { googleClientId } from '../config';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || null);
  const [currentEntity, setCurrentEntity] = useState(() => JSON.parse(sessionStorage.getItem('currentEntity')) || JSON.parse(localStorage.getItem('currentEntity')) || null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();
  const isVerifyingRef = useRef(false);
  const isVerifiedRef = useRef(!!sessionStorage.getItem('isVerified') || !!localStorage.getItem('isVerified'));
  const fcmSentRef = useRef(!!sessionStorage.getItem('fcmSent') || !!localStorage.getItem('fcmSent'));

  useEffect(() => {
    alert('AuthProvider initialized in ' + (window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser') + ' mode');
  }, []);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const idToken = await result.user.getIdToken(true);
          sessionStorage.setItem('authToken', idToken);
          localStorage.setItem('authToken', idToken);
          await verifyUser(result.user, idToken);
          navigate('/');
        }
      } catch (error) {
        console.error("Redirect error:", error);
        setError(error.message || "Error en redirección de inicio de sesión.");
      }
    };

    checkRedirect();
  }, []);

  const verifyUser = async (user, idToken) => {
    isVerifyingRef.current = true;
    let attempts = 0;
    const maxAttempts = 3; // Define max attempts
    try {
      setLoading(true);
      setVerifying(true);
      alert('Verifying user with idToken: Starting verification');

      let response;
      do {
        try {
          response = await api.post('/auth/verify', {}, { headers: { Authorization: `Bearer ${idToken}` }, credentials: 'include' });
          break;
        } catch (error) {
          attempts++;
          const errorDetail = error.response?.data?.detail || error.message;
          alert(`Verification attempt ${attempts} failed: ${errorDetail}`);
          if (attempts === maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Retry delay
        }
      } while (attempts < maxAttempts);

      await new Promise(resolve => setTimeout(resolve, 1000)); // Initial delay

      isVerifiedRef.current = true;
      setCurrentUser(user);
      setCurrentEntity(response.data);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('currentEntity', JSON.stringify(response.data));
      sessionStorage.setItem('isVerified', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user)); // Persistent backup
      localStorage.setItem('currentEntity', JSON.stringify(response.data)); // Persistent backup
      localStorage.setItem('isVerified', 'true'); // Persistent backup
      alert('User verified successfully');

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
        alert(`Saving FCM token: ${JSON.stringify(token_data)}`);
        sessionStorage.setItem('fcmSent', 'true');
        localStorage.setItem('fcmSent', 'true'); // Persistent backup
      }

      return { success: true, data: response.data };
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message;
      alert('Final verification error: ' + errorDetail);
      try {
        await signOut(auth);
        sessionStorage.clear();
        localStorage.clear(); // Clear both on failure
      } catch (signOutError) {
        alert('Sign-out failed: ' + signOutError.message);
      }
      setCurrentUser(null);
      setCurrentEntity(null);
      isVerifiedRef.current = false;
      const errorMessage =
        error.response?.status === 403
          ? 'Usuario no registrado. Por favor, crea una cuenta.'
          : error.response?.status === 401
          ? `Token de autenticación inválido: ${errorDetail}`
          : 'Error al verificar el usuario.';
      navigate('/login', { state: { error: errorMessage } });
      return { success: false, data: null };
    } finally {
      isVerifyingRef.current = false;
      setLoading(false);
      setVerifying(false);
    }
  };

  const logOut = async () => {
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
    await signOut(auth);
    sessionStorage.clear();
    localStorage.clear();
    setCurrentUser(null);
    setCurrentEntity(null);
    setLoading(false);
    setVerifying(false);
    isVerifyingRef.current = false;
    isVerifiedRef.current = false;
    navigate('/login');
  }

  const signInWithGoogleForRegistration = async () => {
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
              const emailResponse = await fetch(
                `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
              );
              const tokenInfo = await emailResponse.json();
              if (tokenInfo.email) {
                const user = { uid: tokenInfo.sub, email: tokenInfo.email };
                await verifyUser(user, idToken);
                resolve({ idToken, email: tokenInfo.email });
              } else {
                reject(new Error('Failed to retrieve email from Google ID token'));
              }
            } catch (error) {
              console.error('Error processing Google ID token:', error);
              reject(error);
            }
          },
        });
        window.google.accounts.id.prompt();
      };
      script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK'));
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !isVerifyingRef.current && !isVerifiedRef.current) {
        try {
          const idToken = await user.getIdToken(true);
          sessionStorage.setItem('authToken', idToken);
          localStorage.setItem('authToken', idToken);
          await verifyUser(user, idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
          await signOut(auth);
          sessionStorage.clear();
          localStorage.clear();
          setCurrentUser(null);
          setCurrentEntity(null);
          setLoading(false);
          setVerifying(false);
          isVerifiedRef.current = false;
          navigate('/login', { state: { error: 'Error al obtener el token de autenticación.' } });
        }
      } else if (!user) {
        sessionStorage.clear();
        localStorage.clear();
        setCurrentUser(null);
        setCurrentEntity(null);
        setLoading(false);
        setVerifying(false);
        isVerifiedRef.current = false;
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, verifyUser, signInWithGoogleForRegistration, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };