import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiSearch, FiFilter } from "react-icons/fi";
import ClienteFormModal from "../components/ClienteFormModal";
import "../index.css";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const API = "http://localhost:8080/api/clientes";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setClientes(data || []);
    } catch (e) {
      console.error(e);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar cliente?")) return;
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (error) {
      alert("Error al eliminar cliente");
    }
  };

  const handleSave = async (cliente) => {
    const method = cliente.id ? "PUT" : "POST";
    const url = cliente.id ? `${API}/${cliente.id}` : API;
    
    try {
      await fetch(url, {
        method,
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(cliente),
      });
      setModalOpen(false);
      setEditing(null);
      fetchAll();
    } catch (error) {
      alert("Error al guardar cliente");
    }
  };

  // Filtrar clientes
  const filteredClientes = clientes.filter(cliente => {
    return cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cliente.documento?.includes(searchTerm) ||
           cliente.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="mercaderia-container">
      {/* Header de la página */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <FiUser />
            </div>
            <div>
              <h1>Gestión de Clientes</h1>
              <p>Administrá la información de tus clientes</p>
            </div>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-primary"
          >
            <FiPlus />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Panel de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiUser />
          </div>
          <div className="stat-info">
            <h3>{clientes.length}</h3>
            <p>Total Clientes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FiUser />
          </div>
          <div className="stat-info">
            <h3>{clientes.filter(c => c.email).length}</h3>
            <p>Con Email</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stock">
            <FiUser />
          </div>
          <div className="stat-info">
            <h3>{clientes.filter(c => c.telefono).length}</h3>
            <p>Con Teléfono</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon out-of-stock">
            <FiUser />
          </div>
          <div className="stat-info">
            <h3>{clientes.filter(c => c.documento).length}</h3>
            <p>Con Documento</p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="filters-bar">
        <div className="search-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar clientes por nombre, documento o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filtros
          </button>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="empty-state">
            <FiUser />
            <h3>No se encontraron clientes</h3>
            <p>{searchTerm ? 'Intenta ajustar los términos de búsqueda' : 'Comienza agregando tu primer cliente'}</p>
            {!searchTerm && (
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="btn-primary"
              >
                <FiPlus />
                Agregar Primer Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map(cliente => (
                  <tr key={cliente.id}>
                    <td className="product-cell">
                      <div className="product-info">
                        <h4>{cliente.nombre}</h4>
                        {cliente.notas && (
                          <p>{cliente.notas}</p>
                        )}
                      </div>
                    </td>
                    <td className="sku-cell">
                      <span className="sku-badge">{cliente.documento || '-'}</span>
                    </td>
                    <td className="unit-cell">
                      {cliente.telefono || '-'}
                    </td>
                    <td className="unit-cell">
                      {cliente.email || '-'}
                    </td>
                    <td className="unit-cell">
                      {cliente.direccion || '-'}
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => { setEditing(cliente); setModalOpen(true); }}
                          className="icon-btn edit"
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="icon-btn delete"
                          title="Eliminar"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ClienteFormModal
          cliente={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}