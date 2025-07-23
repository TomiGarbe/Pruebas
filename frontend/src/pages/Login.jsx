import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from '../services/firebase';
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
      await logOut();
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
    } catch (err) {
      console.error("Error en inicio de sesión con Google:", err);
      setError(err.message || 'Error al iniciar sesión con Google');
      await logOut();
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