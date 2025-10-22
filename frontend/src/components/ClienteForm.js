import React, { useState } from 'react';
import api from '../api';

const ClienteForm = ({ onClienteAdded }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/clientes', { nombre, email })
      .then(() => {
        setNombre('');
        setEmail('');
        onClienteAdded(); // recargar la lista
      })
      .catch(err => console.error(err));
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Agregar Cliente</button>
    </form>
  );
};

export default ClienteForm;
