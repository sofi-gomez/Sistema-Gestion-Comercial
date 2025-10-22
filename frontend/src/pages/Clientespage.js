import React, { useState, useEffect } from 'react';
import api from '../api';
import ClienteForm from '../components/ClienteForm';

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);

  const fetchClientes = () => {
    api.get('/api/clientes')
      .then(res => setClientes(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return (
    <div>
      <h2>Clientes</h2>
      <ClienteForm onClienteAdded={fetchClientes} />
      <table border="1" style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.nombre}</td>
              <td>{c.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientesPage;
