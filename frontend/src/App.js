import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import HomePage from "./pages/Homepage"; // Verificar casing
import ClientesPage from "./pages/Clientespage"; // Con P mayúscula
import MercaderiaPage from "./pages/Mercaderiapage"; // Verificar casing
import ProveedoresPage from './pages/Proveedorespage'; // Verificar casing
import VentasPage from './pages/Ventaspage'; // Verificar casing
import TesoreriaPage from './pages/Tesoreriapage'; // Verificar casing
import RemitosPage from './pages/Remitospage'; // Verificar casing

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/mercaderia" element={<MercaderiaPage />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/tesoreria" element={<TesoreriaPage />} />
        <Route path="/remitos" element={<RemitosPage />} />
      </Routes>
    </Router>
  );
}

export default App;