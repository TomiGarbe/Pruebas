import { useState, useContext, useEffect } from 'react';
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
  const { verifyUser, verifying, logOut } = useContext(AuthContext);

  const handleGoogleSignIn = async () => {
    console.log('Intento de iniciar sesion');
    setError(null);
    try {
      /*await logOut();
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');*/
      console.log('Auth instance:', auth);

      if (isIOS() && isInStandaloneMode()) {
        alert('PWA con ios');
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithRedirect(auth, googleProvider);
        /*const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken(true);
        localStorage.setItem('authToken', idToken);
        sessionStorage.setItem('authToken', idToken);
        const verificationResult = await verifyUser(result.user, idToken);
        if (verificationResult.success) {
          navigate('/');
        } else {
          setError('Error al verificar el usuario');
          await logOut();
        }*/
      }
    } catch (err) {
      console.error("Error en inicio de sesión con Google:", err);
      setError(err.message || 'Error al iniciar sesión con Google');
      await logOut();
    }
  };

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        console.log('Auth instance:', auth);
        const result = await getRedirectResult(auth);
        console.log(result);
        if (result) {
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
        console.error('Error al recuperar resultado del redirect:', err);
        setError(err.message || 'Error al recuperar resultado del redirect');
        await logOut();
      }
    };

    checkRedirectResult();
  }, []);

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

export default Login;




/*import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert } from 'react-bootstrap';
import { auth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from '../services/firebase';
import '../styles/login.css';

const Login = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const handledRedirect = useRef(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.addScope('profile');
      googleProvider.addScope('email');
      console.log('Initiating signInWithRedirect on localhost');
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.error('Error in signInWithRedirect:', err);
      setError(err.message || 'Error initiating Google Sign-In');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      localStorage.setItem('redirectAttempt', 'true');
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.error('Error in signInWithRedirect:', err);
      setError(err.message || 'Error initiating Google Sign-In');
    }
  };

  useEffect(() => {
    if (handledRedirect.current) return;
    handledRedirect.current = true;

    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        console.log('getRedirectResult result:', result);
        if (result?.user) {
          const idToken = await result.user.getIdToken(true);
          console.log('User ID Token:', idToken);
          localStorage.setItem('authToken', idToken);
          navigate('/home');
        } else {
          console.log('No user from getRedirectResult');
        }
      } catch (err) {
        console.error('Error in getRedirectResult:', err);
        setError(err.message || 'Error processing redirect result');
      }
    };

    handleRedirectResult();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('onAuthStateChanged:', user);
      if (user) {
        console.log('User detected post-redirect:', user);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (localStorage.getItem('redirectAttempt') === 'true') {
      localStorage.removeItem('redirectAttempt');
      getRedirectResult(auth).then((result) => {
        console.log('Custom redirect result:', result);
        if (result?.user) {
          const idToken = result.user.getIdToken(true);
          console.log('ID Token:', idToken);
          navigate('/home');
        }
      }).catch((err) => {
        console.error('Error in custom redirect:', err);
        setError(err.message);
      });
    }
  }, [navigate]);

  return (
    <div className="main-bg">
      <div className="login-container text-c animated flipInX">
        <div>
          <h2>Login Test</h2>
        </div>
        <div className="container-content">
          {error && <Alert variant="danger">{error}</Alert>}
          <Button
            className="form-button button-l margin-b d-flex align-items-center justify-content-center gap-2"
            onClick={handleGoogleSignIn}
          >
            Iniciar Sesión con Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;*/