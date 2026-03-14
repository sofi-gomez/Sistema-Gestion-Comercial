import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/Homepage";
import ClientesPage from "./pages/Clientespage";
import MercaderiaPage from "./pages/Mercaderiapage";
import ProveedoresPage from './pages/Proveedorespage';
import TesoreriaPage from './pages/Tesoreriapage';
import RemitosPage from './pages/Remitospage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import LoginPage from './pages/Loginpage';
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas */}
        <Route path="/" element={<ProtectedRoute><Layout><HomePage /></Layout></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Layout><ClientesPage /></Layout></ProtectedRoute>} />
        <Route path="/mercaderia" element={<ProtectedRoute><Layout><MercaderiaPage /></Layout></ProtectedRoute>} />
        <Route path="/proveedores" element={<ProtectedRoute><Layout><ProveedoresPage /></Layout></ProtectedRoute>} />
        <Route path="/tesoreria" element={<ProtectedRoute><Layout><TesoreriaPage /></Layout></ProtectedRoute>} />
        <Route path="/remitos" element={<ProtectedRoute><Layout><RemitosPage /></Layout></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Layout><ConfiguracionPage /></Layout></ProtectedRoute>} />

        {/* Capturar rutas inexistentes y redirigir al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
