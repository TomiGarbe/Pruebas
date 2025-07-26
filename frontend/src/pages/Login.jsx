import { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import '../styles/login.css';
import logoInversur from '../assets/logo_inversur.png';

const Login = () => {
  const [error, setError] = useState(null);
  const location = useLocation();
  const { verifying, logOut, signInWithGoogle, handleStoredToken } = useContext(AuthContext);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await logOut();
      await signInWithGoogle();
      await handleStoredToken();
    } catch (err) {
      console.error("Error en inicio de sesión con Google:", err);
      setError(err.message || 'Error al iniciar sesión con Google');
      await logOut(err.message);
    }
  };

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


/*import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import '../styles/login.css';
import logoInversur from '../assets/logo_inversur.png';

const Login = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyUser, verifying, logOut, signInWithGoogleForRegistration } = useContext(AuthContext);

  const handleGoogleSignIn = async () => {
    console.log('Intento de iniciar sesion');
    setError(null);
    try {
      await signInWithGoogleForRegistration();
    } catch (err) {
      console.error('Error en inicio de sesión con Google:', err);
      setError(err.message || 'Error al iniciar sesión con Google');
      await logOut();
    }
  };

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

export default Login;*/