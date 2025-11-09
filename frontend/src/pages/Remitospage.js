import React, { useEffect, useState } from "react";
import { FiPlus, FiFileText, FiSearch, FiFilter, FiDownload, FiEdit2 } from "react-icons/fi";
import RemitoFormModal from "../components/RemitoFormModal";
import "../index.css";

export default function RemitosPage() {
  const [remitos, setRemitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const API = "http://localhost:8080/api/remitos";

  const fetchRemitos = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Error al obtener remitos");
      const data = await res.json();
      setRemitos(data || []);
    } catch (err) {
      console.error(err);
      setRemitos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemitos();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    fetchRemitos();
  };

  const descargarPdf = async (id, numero) => {
    try {
      const res = await fetch(`${API}/${id}/pdf`);
      if (!res.ok) throw new Error("Error descargando PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `remito_${numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar PDF");
    }
  };

  // Filtrar remitos
  const filteredRemitos = remitos.filter(remito => {
    return remito.numero?.toString().includes(searchTerm) ||
           remito.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calcular estadísticas
  const totalRemitos = remitos.length;
  const remitosConCliente = remitos.filter(r => r.clienteNombre).length;
  const remitosHoy = remitos.filter(r => {
    const hoy = new Date().toDateString();
    const fechaRemito = r.fecha ? new Date(r.fecha).toDateString() : "";
    return fechaRemito === hoy;
  }).length;
  
  // Nueva estadística: Remitos del mes actual
  const remitosEsteMes = remitos.filter(r => {
    if (!r.fecha) return false;
    const fechaRemito = new Date(r.fecha);
    const ahora = new Date();
    return fechaRemito.getMonth() === ahora.getMonth() && 
           fechaRemito.getFullYear() === ahora.getFullYear();
  }).length;

  return (
    <div className="mercaderia-container">
      {/* Header de la página */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <FiFileText />
            </div>
            <div>
              <h1>Gestión de Remitos</h1>
              <p>Generá y descargá remitos con numeración automática</p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary"
          >
            <FiPlus />
            Nuevo Remito
          </button>
        </div>
      </div>

      {/* Panel de estadísticas - ACTUALIZADO */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiFileText />
          </div>
          <div className="stat-info">
            <h3>{totalRemitos}</h3>
            <p>Total Remitos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FiFileText />
          </div>
          <div className="stat-info">
            <h3>{remitosEsteMes}</h3>
            <p>Este Mes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stock">
            <FiFileText />
          </div>
          <div className="stat-info">
            <h3>{remitosConCliente}</h3>
            <p>Con Cliente</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon out-of-stock">
            <FiFileText />
          </div>
          <div className="stat-info">
            <h3>{remitosHoy}</h3>
            <p>Hoy</p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="filters-bar">
        <div className="search-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar remitos por número o cliente..."
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

      {/* Tabla de remitos */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando remitos...</p>
          </div>
        ) : filteredRemitos.length === 0 ? (
          <div className="empty-state">
            <FiFileText />
            <h3>No se encontraron remitos</h3>
            <p>{searchTerm ? 'Intenta ajustar los términos de búsqueda' : 'Comienza creando tu primer remito'}</p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="btn-primary"
              >
                <FiPlus />
                Crear Primer Remito
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nº Remito</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRemitos.map((remito) => (
                  <tr key={remito.id}>
                    <td className="sku-cell">
                      <span className="sku-badge">#{remito.numero}</span>
                    </td>
                    <td className="unit-cell">
                      {remito.fecha ? new Date(remito.fecha).toLocaleDateString() : "-"}
                    </td>
                    <td className="product-cell">
                      <div className="product-info">
                        <p>{remito.clienteNombre || "Sin cliente"}</p>
                      </div>
                    </td>
                    <td className="unit-cell">
                      <span className="stock-badge in-stock">
                        {remito.items?.length || 0}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => descargarPdf(remito.id, remito.numero)}
                          className="icon-btn edit"
                          title="Descargar PDF"
                        >
                          <FiDownload />
                        </button>
                        <button
                          onClick={() => { setEditing(remito); setModalOpen(true); }}
                          className="icon-btn edit"
                          title="Editar"
                        >
                          <FiEdit2 />
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
        <RemitoFormModal 
          remito={editing} 
          onClose={() => setModalOpen(false)} 
          onSaved={handleSaved} 
        />
      )}
    </div>
  );
}