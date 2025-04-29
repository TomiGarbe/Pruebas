import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Users from './pages/Users';
import Sucursales from './pages/Sucursales';
import Cuadrillas from './pages/Cuadrillas';
import Preventivos from './pages/Preventivos';
import MantenimientosPreventivos from './pages/MantenimientosPreventivos';
import MantenimientosCorrectivos from './pages/MantenimientosCorrectivos';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<Users />} />
            <Route path="/sucursales" element={<Sucursales />} />
            <Route path="/cuadrillas" element={<Cuadrillas />} />
            <Route path="/preventivos" element={<Preventivos />} />
            <Route path="/mantenimientos-preventivos" element={<MantenimientosPreventivos />} />
            <Route path="/mantenimientos-correctivos" element={<MantenimientosCorrectivos />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;