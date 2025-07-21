import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LocationProvider from './context/LocationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Users from './pages/Users';
import Sucursales from './pages/Sucursales';
import Cuadrillas from './pages/Cuadrillas';
import Mantenimiento from './pages/Mantenimiento';
import MantenimientoPreventivo from './pages/MantenimientosPreventivos';
import MantenimientoCorrectivo from './pages/MantenimientosCorrectivos';
import Preventivo from './pages/Preventivo';
import Correctivo from './pages/Correctivo';
import Login from './pages/Login';
import Mapa from './pages/Mapa';
import Ruta from './pages/Ruta';
import { mapsApiKey } from './config';
import { LoadScript } from '@react-google-maps/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const googleMapsLibraries = ['places'];

const ProtectedRoute = ({ children, adminOnly, usersOnly }) => {
  const { currentEntity, loading, verifying } = useContext(AuthContext);

  if (loading || verifying) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!currentEntity) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (currentEntity.type !== 'usuario' || currentEntity.data.rol !== 'Administrador')) {
    return <Navigate to="/" replace />;
  }

  if (usersOnly && currentEntity.type !== 'usuario') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentEntity, loading, verifying } = useContext(AuthContext);
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    if (currentEntity && !loading && !verifying && isLoginPage) {
      navigate('/', { replace: true });
    }
  }, [currentEntity, loading, verifying, isLoginPage, navigate]);

  return (
    <LoadScript googleMapsApiKey={mapsApiKey} libraries={googleMapsLibraries}>
      <div className="d-flex flex-column min-vh-100">
        {!isLoginPage && <Navbar />}
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/mantenimiento" element={<ProtectedRoute><Mantenimiento /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
            <Route path="/sucursales" element={<ProtectedRoute usersOnly><Sucursales /></ProtectedRoute>} />
            <Route path="/cuadrillas" element={<ProtectedRoute usersOnly><Cuadrillas /></ProtectedRoute>} />
            <Route path="/mantenimientos-preventivos" element={<ProtectedRoute><MantenimientoPreventivo /></ProtectedRoute>} />
            <Route path="/mantenimientos-correctivos" element={<ProtectedRoute><MantenimientoCorrectivo /></ProtectedRoute>} />
            <Route path="/preventivo" element={<ProtectedRoute><Preventivo /></ProtectedRoute>} />
            <Route path="/correctivo" element={<ProtectedRoute><Correctivo /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/mapa" element={<ProtectedRoute usersOnly><Mapa /></ProtectedRoute>} />
            <Route path="/ruta" element={<ProtectedRoute><Ruta /></ProtectedRoute>} />
          </Routes>
        </main>
        {!isLoginPage && <Footer />}
      </div>
    </LoadScript>
  );
};

function App() {
  useEffect(() => {
    const promptAddToHomeScreen = () => {
      if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
        alert('To install this app, tap the Share button in Safari, then select "Add to Home Screen".');
      }
    };
    promptAddToHomeScreen();
  }, []);

  return (
    <Router>
      <AuthProvider>
          <LocationProvider>
            <AppContent />
          </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;