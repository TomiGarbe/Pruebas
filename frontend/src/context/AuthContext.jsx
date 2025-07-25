import React, { createContext, useState, useEffect, useRef } from 'react';
import { auth, onAuthStateChanged, signOut, getDeviceToken, messaging, deleteToken, signInWithCredential, GoogleAuthProvider } from '../services/firebase';
import { saveToken } from '../services/notificaciones';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { googleClientId } from '../config';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
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
        console.log('FCM token saved:', fcmToken);
      }

      return navigate('/');
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
    if (error) {
      navigate('/login', { state: { error: error } });
    } else {
      navigate('/login');
    }
  }

  const signInWithGoogle = async () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        const config = {
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const idToken = response.credential;
              localStorage.setItem('googleIdToken', idToken);
              sessionStorage.setItem('googleIdToken', idToken);
              const emailResponse = await fetch(
                `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
              );
              const tokenInfo = await emailResponse.json();
              if (tokenInfo.email) {
                resolve({ idToken, email: tokenInfo.email });
              } else {
                reject(new Error('Failed to retrieve email from Google ID token'));
              }
            } catch (error) {
              console.error('Error processing Google ID token:', error);
              reject(error);
            }
          },
          ux_mode: 'redirect', // Force redirect mode
          login_uri: window.location.href, // Return to the same page
        };

        window.google.accounts.id.initialize(config);
        window.google.accounts.id.prompt();
      };
      script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK'));
      document.body.appendChild(script);
    });
  };

  const handleStoredToken = async () => {
    const idToken = sessionStorage.getItem('googleIdToken') || localStorage.getItem('googleIdToken');
    if (idToken) {
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } catch (err) {
        console.error('Error signing in with stored credential:', err);
        localStorage.removeItem('googleIdToken');
        sessionStorage.removeItem('googleIdToken');
        await logOut();
      }
    } else {
      await logOut();
    }
  };

  useEffect(() => {
    handleStoredToken();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !isVerifyingRef.current && !isVerifiedRef.current) {
        try {
          const idToken = await user.getIdToken(true);
          localStorage.setItem('authToken', idToken);
          sessionStorage.setItem('authToken', idToken);
          await verifyUser(user, idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
          await logOut(error);
        }
      } else if (!user) {
        await logOut();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, signInWithGoogle, logOut, handleStoredToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };


/*import React, { createContext, useState, useEffect, useRef } from 'react';
import { auth, onAuthStateChanged, signOut, getDeviceToken, messaging, deleteToken, getRedirectResult, signInWithCredential, GoogleAuthProvider } from '../services/firebase';
import { saveToken } from '../services/notificaciones';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { googleClientId } from '../config';
import { isIOS, isInStandaloneMode } from '../utils/platform';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
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
        console.log('FCM token saved:', fcmToken);
      }

      return { success: true, data: response.data };
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message;
      console.error('Final verification error:', errorDetail);
      try {
        await signOut(auth);
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
      } catch (signOutError) {
        console.error('Sign-out failed:', signOutError);
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
      const fcmToken = await getDeviceToken();
      if (fcmToken) {
        await deleteToken(messaging);
        console.log('FCM token deleted on logout');
      }
    } catch (err) {
      console.error('Error deleting FCM token:', err);
    }
    await signOut(auth);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    setCurrentUser(null);
    setCurrentEntity(null);
    setLoading(false);
    setVerifying(false);
    isVerifyingRef.current = false;
    isVerifiedRef.current = false;
    navigate('/login');
  };

  const signInWithGoogleForRegistration = async () => {
    const existingToken = localStorage.getItem('googleIdToken'); // Check stored token
    if (existingToken) {
      const emailResponse = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${existingToken}`
      );
      const tokenInfo = await emailResponse.json();
      if (tokenInfo.email) {
        return { idToken: existingToken, email: tokenInfo.email };
      }
      throw new Error('Invalid stored Google ID token');
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        const config = {
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const idToken = response.credential;
              localStorage.setItem('googleIdToken', idToken); // Store token immediately
              const emailResponse = await fetch(
                `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
              );
              const tokenInfo = await emailResponse.json();
              if (tokenInfo.email) {
                resolve({ idToken, email: tokenInfo.email });
              } else {
                reject(new Error('Failed to retrieve email from Google ID token'));
              }
            } catch (error) {
              console.error('Error processing Google ID token:', error);
              reject(error);
            }
          },
          ux_mode: 'redirect', // Force redirect mode
          login_uri: window.location.href, // Return to the same page
        };

        window.google.accounts.id.initialize(config);
        window.google.accounts.id.prompt();
      };
      script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK'));
      document.body.appendChild(script);
    });
  };

  const handleStoredToken = async () => {
    const idToken = localStorage.getItem('googleIdToken');
    console.log('Stored token on load:', idToken);
    if (idToken) {
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        const verificationResult = await verifyUser(result.user, idToken);
        if (verificationResult.success) {
          navigate('/');
        } else {
          localStorage.removeItem('googleIdToken');
        }
      } catch (err) {
        console.error('Error signing in with stored credential:', err);
        localStorage.removeItem('googleIdToken');
      }
    }
  };

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log('onAuthStateChanged:', JSON.stringify(user));
    if (user && !isVerifyingRef.current && !isVerifiedRef.current) {
      try {
        const idToken = await user.getIdToken(true);
        console.log('ID Token from onAuthStateChanged:', idToken);
        localStorage.setItem('authToken', idToken);
        sessionStorage.setItem('authToken', idToken);
        const verificationResult = await verifyUser(user, idToken);
        if (verificationResult.success) {
          navigate('/');
        } else {
          setError('Error al verificar el usuario');
          await logOut();
        }
      } catch (error) {
        console.error('Error getting ID token:', error);
        setLoading(false);
        setVerifying(false);
        isVerifiedRef.current = false;
        navigate('/login', { state: { error: 'Error al obtener el token de autenticación.' } });
      }
    } else if (!user) {
      setLoading(false);
      setVerifying(false);
      isVerifiedRef.current = false;
    }
  });

  useEffect(() => {
    if (isIOS() && isInStandaloneMode()) {
      return () => handleStoredToken();
    }
    else {
      return () => unsubscribe();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, verifyUser, signInWithGoogleForRegistration, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };*/