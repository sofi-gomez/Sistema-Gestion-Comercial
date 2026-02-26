import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Homepage";
import ClientesPage from "./pages/Clientespage";
import MercaderiaPage from "./pages/Mercaderiapage";
import ProveedoresPage from './pages/Proveedorespage';
import TesoreriaPage from './pages/Tesoreriapage';
import RemitosPage from './pages/Remitospage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/mercaderia" element={<MercaderiaPage />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="/tesoreria" element={<TesoreriaPage />} />
        <Route path="/remitos" element={<RemitosPage />} />
      </Routes>
    </Router>
  );
}

export default App;