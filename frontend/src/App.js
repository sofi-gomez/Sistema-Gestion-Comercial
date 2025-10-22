import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ClientesPage from './pages/Clientespage';
import HomePage from './pages/Homepage';

function App() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <h1>Sistema de Gestión Comercial</h1>
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '10px' }}>Inicio</Link>
          <Link to="/clientes">Clientes</Link>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/clientes" element={<ClientesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
