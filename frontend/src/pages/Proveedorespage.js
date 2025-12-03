import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiSearch, FiFilter } from "react-icons/fi";
import ProveedoresFormModal from "../components/ProveedoresFormModal";
import "../index.css";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const API = "http://localhost:8080/api/proveedores";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setProveedores(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar proveedor?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const handleSave = async (prov) => {
    const method = prov.id ? "PUT" : "POST";
    const url = prov.id ? `${API}/${prov.id}` : API;
    await fetch(url, {
      method,
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(prov),
    });
    setModalOpen(false);
    setEditing(null);
    fetchAll();
  };

  // Filtrar proveedores
  const filteredProveedores = proveedores.filter(proveedor => {
    return proveedor.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           proveedor.cuit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="mercaderia-container">
      {/* Header de la página - Mismo estilo que Mercadería */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <FiUsers />
            </div>
            <div>
              <h1>Gestión de Proveedores</h1>
              <p>Administrá remitos, facturas y datos de tus proveedores</p>
            </div>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-primary"
          >
            <FiPlus />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="filters-bar">
        <div className="search-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar proveedores por nombre, CUIT o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Tabla de proveedores */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando proveedores...</p>
          </div>
        ) : filteredProveedores.length === 0 ? (
          <div className="empty-state">
            <FiUsers />
            <h3>No se encontraron proveedores</h3>
            <p>{searchTerm ? 'Intenta ajustar los términos de búsqueda' : 'Comienza agregando tu primer proveedor'}</p>
            {!searchTerm && (
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="btn-primary"
              >
                <FiPlus />
                Agregar Primer Proveedor
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>CUIT</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Condición IVA</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProveedores.map(proveedor => (
                  <tr key={proveedor.id}>
                    <td className="product-cell">
                      <div className="product-info">
                        <h4>{proveedor.nombre}</h4>
                        {proveedor.notas && (
                          <p>{proveedor.notas}</p>
                        )}
                      </div>
                    </td>
                    <td className="sku-cell">
                      <span className="sku-badge">{proveedor.cuit || '-'}</span>
                    </td>
                    <td className="unit-cell">
                      {proveedor.telefono || '-'}
                    </td>
                    <td className="unit-cell">
                      {proveedor.email || '-'}
                    </td>
                    <td className="unit-cell">
                      {proveedor.direccion || '-'}
                    </td>
                    <td className="status-cell">
                      <span className="status-badge active">
                        {proveedor.condicionIva || 'No especificado'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => { setEditing(proveedor); setModalOpen(true); }}
                          className="icon-btn edit"
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(proveedor.id)}
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
        <ProveedoresFormModal
          proveedor={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}