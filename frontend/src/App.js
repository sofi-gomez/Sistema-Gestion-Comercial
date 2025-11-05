import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import HomePage from "./pages/Homepage";
import Clientespage from "./pages/Clientespage";
import Mercaderiapage from "./pages/Mercaderiapage";
import Proveedorespage from './pages/Proveedorespage';
import Ventaspage from './pages/Ventaspage';
import Tesoreriapage from './pages/Tesoreriapage';
import Remitospage from './pages/Remitospage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clientes" element={<Clientespage />} />
        <Route path="/mercaderia" element={<Mercaderiapage />} />
        <Route path="/proveedores" element={<Proveedorespage />} />
        <Route path="/ventas" element={<Ventaspage />} />
        <Route path="/tesoreria" element={<Tesoreriapage />} />
        <Route path="/remitos" element={<Remitospage />} />
      </Routes>
    </Router>
  );
}


export default App;
