import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, verifyUserWithBackend } from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      const idToken = await signInWithGoogle();
      await verifyUserWithBackend(idToken);
      navigate('/');
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      const idToken = await signInWithEmail(email, password);
      await verifyUserWithBackend(idToken);
      navigate('/');
    } catch (error) {
      console.error('Error al iniciar sesión con email:', error);
      setError('Error al iniciar sesión con email. Por favor, verifica tus credenciales.');
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      {error && <p className="error">{error}</p>}
      <div className="login-options">
        <button onClick={handleGoogleSignIn} className="google-btn">
          Iniciar sesión con Google
        </button>
        <div className="email-login">
          <h3>O usa tu email y contraseña</h3>
          <form onSubmit={handleEmailSignIn}>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Contraseña:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Iniciar Sesión</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;