import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Users from './pages/Users';
import Sucursales from './pages/Sucursales';
import Cuadrillas from './pages/Cuadrillas';
import Preventivos from './pages/Preventivos';
import MantenimientosPreventivos from './pages/MantenimientosPreventivos';
import MantenimientosCorrectivos from './pages/MantenimientosCorrectivos';
import Login from './pages/Login';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/login.css';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { currentEntity, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!currentEntity) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (currentEntity.type !== 'usuario' || currentEntity.data.rol !== 'Administrador')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/users"
                element={
                  <ProtectedRoute adminOnly>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route path="/sucursales" element={<Sucursales />} />
              <Route
                path="/cuadrillas"
                element={
                  <ProtectedRoute adminOnly>
                    <Cuadrillas />
                  </ProtectedRoute>
                }
              />
              <Route path="/preventivos" element={<Preventivos />} />
              <Route path="/mantenimientos-preventivos" element={<MantenimientosPreventivos />} />
              <Route path="/mantenimientos-correctivos" element={<MantenimientosCorrectivos />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;