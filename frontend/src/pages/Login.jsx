/*import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from '../services/firebase';
import { FcGoogle } from 'react-icons/fc';
import '../styles/login.css';
import logoInversur from '../assets/logo_inversur.png';
import { isIOS, isInStandaloneMode } from '../utils/platform';

const Login = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const googleProvider = new GoogleAuthProvider();
  const { verifyUser, verifying, logOut, signInWithGoogleForRegistration } = useContext(AuthContext);

  const handleGoogleSignIn = async () => {
    console.log('Intento de iniciar sesion');
    setError(null);
    try {
      await logOut();
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');

      await signInWithRedirect(auth, googleProvider);

      if (isIOS() && isInStandaloneMode()) {
        alert('PWA con ios');
        const { idToken } = await signInWithGoogleForRegistration();
        const credential = googleProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        const firebaseToken = await result.user.getIdToken(true);
        localStorage.setItem('authToken', firebaseToken);
        sessionStorage.setItem('authToken', firebaseToken);
        const verificationResult = await verifyUser(result.user, firebaseToken);
        if (verificationResult.success) {
          navigate('/');
        } else {
          setError('Error al verificar el usuario');
          await logOut();
        }
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken(true);
        localStorage.setItem('authToken', idToken);
        sessionStorage.setItem('authToken', idToken);
        const verificationResult = await verifyUser(result.user, idToken);
        if (verificationResult.success) {
          navigate('/');
        } else {
          setError('Error al verificar el usuario');
          await logOut();
        }
      }
    } catch (err) {
      console.error("Error en inicio de sesión con Google:", err);
      setError(err.message || 'Error al iniciar sesión con Google');
      await logOut();
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('onAuthStateChanged:', user);
      const result = await getRedirectResult(auth);
      console.log('result:', result);
    });

    return () => unsubscribe();
  }, [navigate, verifyUser, logOut, verifying]);

  if (verifying) {
    return (
      <div className="main-bg">
        <div className="login-container text-c animated flipInX">
          <div>
            <img src={logoInversur} alt="Inversur Logo" className="logo" />
          </div>
          <div className="container-content d-flex justify-content-center align-items-center min-vh-50">
            <Spinner animation="border" role="status" style={{ color: 'white' }}>
              <span className="visually-hidden">Verificando...</span>
            </Spinner>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-bg">
      <div className="login-container text-c animated flipInX">
        <div>
          <img src={logoInversur} alt="Inversur Logo" className="logo" />
        </div>
        <div className="container-content">
          {(error || location.state?.error) && (
            <Alert variant="danger">{error || location.state.error}</Alert>
          )}
          <Button
            className="form-button button-l margin-b d-flex align-items-center justify-content-center gap-2 custom-login-btn"
            onClick={handleGoogleSignIn}
            disabled={verifying}
          >
            <FcGoogle size={20} />
            Iniciar Sesión con Google
          </Button>
          <p className="margin-t text-whitesmoke">
            <small>Inversur © 2025</small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;*/

import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { auth, GoogleAuthProvider, signInWithCredential } from '../services/firebase';
import { FcGoogle } from 'react-icons/fc';
import '../styles/login.css';
import logoInversur from '../assets/logo_inversur.png';
import { isIOS, isInStandaloneMode } from '../utils/platform';
import { googleClientId } from '../config';

const Login = () => {
  const [error, setError] = useState(null);
  const [btnWithImg, setBtnWithImg] = useState(null);
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyUser, verifying, logOut } = useContext(AuthContext);
  const isInitializedRef = useRef(false);

  const handleGoogleSignIn = () => {
    setError(null);
    if (!isInitializedRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const idToken = response.credential;
              const credential = GoogleAuthProvider.credential(idToken);
              const result = await signInWithCredential(auth, credential);
              const firebaseToken = await result.user.getIdToken(true);
              localStorage.setItem('authToken', firebaseToken);
              sessionStorage.setItem('authToken', firebaseToken);
              const verificationResult = await verifyUser(result.user, firebaseToken);
              if (verificationResult.success) {
                navigate('/');
              } else {
                setError('Error al verificar el usuario');
                await logOut();
              }
            } catch (err) {
              console.error('Error processing Google Sign-In:', err);
              setError(err.message || 'Error al iniciar sesión con Google');
              await logOut();
            }
          },
        });
        const container = document.getElementById('google-signin-button');
        if (container) {
          window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large' });
        }
        isInitializedRef.current = true;
      } catch (err) {
        console.error('Error initializing Google Sign-In:', err);
        setError(err.message || 'Error al iniciar sesión con Google');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('onAuthStateChanged:', user);
      setBtnWithImg(user);
      if (user && !verifying) {
        setUserIsLoggedIn(true);
        const idToken = await user.getIdToken(true);
        localStorage.setItem('authToken', idToken);
        sessionStorage.setItem('authToken', idToken);
        const verificationResult = await verifyUser(user, idToken);
        if (verificationResult.success) {
          navigate('/');
        } else {
          setError('Error al verificar el usuario');
          await logOut();
        }
      } else if (!user) {
        setUserIsLoggedIn(false);
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
      }
    });

    // Check for stored token on reload
    const storedToken = localStorage.getItem('authToken');
    if (storedToken && !verifying) {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const verificationResult = await verifyUser(user, storedToken);
          if (verificationResult.success) {
            navigate('/');
          } else {
            await logOut();
          }
        }
      });
    }

    return () => unsubscribe();
  }, [navigate, verifyUser, logOut, verifying]);

  if (verifying) {
    return (
      <div className="main-bg">
        <div className="login-container text-c animated flipInX">
          <div><img src={logoInversur} alt="Inversur Logo" className="logo" /></div>
          <div className="container-content d-flex justify-content-center align-items-center min-vh-50">
            <Spinner animation="border" role="status" style={{ color: 'white' }}>
              <span className="visually-hidden">Verificando...</span>
            </Spinner>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-bg">
      <div className="login-container text-c animated flipInX">
        <div><img src={logoInversur} alt="Inversur Logo" className="logo" /></div>
        <div className="container-content">
          {(error || location.state?.error) && <Alert variant="danger">{error || location.state.error}</Alert>}
          <div id="google-signin-button" style={{ marginBottom: '10px' }}></div>
          <Button
            className="form-button button-l margin-b d-flex align-items-center justify-content-center gap-2 custom-login-btn"
            onClick={handleGoogleSignIn}
            disabled={verifying}
          >
            <FcGoogle size={20} /> Iniciar Sesión con Google
          </Button>
          <p className="margin-t text-whitesmoke"><small>Inversur © 2025</small></p>
        </div>
      </div>
    </div>
  );
};

export default Login;