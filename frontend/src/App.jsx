import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow-1">
                  <Home />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow-1">
                  <Home />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow-1">
                  <Users />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sucursales"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow-1">
                  <Sucursales />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cuadrillas"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow-1">
                  <Cuadrillas />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preventivos"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow-1">
                  <Preventivos />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mantenimientos-preventivos"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow-1">
                  <MantenimientosPreventivos />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mantenimientos-correctivos"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow-1">
                  <MantenimientosCorrectivos />
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;