import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Asegúrate de que Navigate esté importado
import { auth } from './services/firebase';
import Login from './pages/Login';
import Home from './pages/Home';
// Importa otras páginas aquí (Users, Sucursales, etc.)

const App = () => {
  const ProtectedRoute = ({ children }) => {
    const user = auth.currentUser;
    if (!user) {
      return <Navigate to="/login" />; // Navigate ya debería estar definido
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        {/* Agrega otras rutas protegidas aquí */}
        {/* Ejemplo de otras rutas: */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <div>Usuarios</div> {/* Reemplaza con tu componente Users */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/sucursales"
          element={
            <ProtectedRoute>
              <div>Sucursales</div> {/* Reemplaza con tu componente Sucursales */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/cuadrillas"
          element={
            <ProtectedRoute>
              <div>Cuadrillas</div> {/* Reemplaza con tu componente Cuadrillas */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/preventivos"
          element={
            <ProtectedRoute>
              <div>Preventivos</div> {/* Reemplaza con tu componente Preventivos */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos-preventivos"
          element={
            <ProtectedRoute>
              <div>Mantenimientos Preventivos</div> {/* Reemplaza con tu componente MantenimientosPreventivos */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos-correctivos"
          element={
            <ProtectedRoute>
              <div>Mantenimientos Correctivos</div> {/* Reemplaza con tu componente MantenimientosCorrectivos */}
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;