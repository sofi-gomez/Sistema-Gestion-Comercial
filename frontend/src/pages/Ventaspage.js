import React, { useEffect, useState } from "react";
import { FiPlus, FiShoppingCart, FiSearch, FiFilter } from "react-icons/fi";
import VentaFormModal from "../components/VentaFormModal";
import "../index.css";

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterEstado, setFilterEstado] = useState("all");

  const API_LIST = "http://localhost:8080/api/ventas";

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_LIST);
      if (!res.ok) {
        setVentas([]);
        return;
      }
      const data = await res.json();
      setVentas(data);
    } catch (err) {
      console.error("Error cargando ventas:", err);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  // Filtrar ventas
  const filteredVentas = ventas.filter(venta => {
    const matchesSearch = 
      venta.numeroInterno?.toString().includes(searchTerm);
    
    const matchesFilter = filterEstado === "all" ? true : 
                         venta.estado?.toLowerCase() === filterEstado.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  // Calcular estadísticas
  const totalVentas = ventas.length;
  const totalIngresos = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
  const ventasHoy = ventas.filter(v => {
    const hoy = new Date().toDateString();
    const fechaVenta = v.fecha ? new Date(v.fecha).toDateString() : "";
    return fechaVenta === hoy;
  }).length;

  return (
    <div className="mercaderia-container">
      {/* Header de la página */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <FiShoppingCart />
            </div>
            <div>
              <h1>Gestión de Ventas</h1>
              <p>Registrar operaciones y mantener el historial de transacciones</p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            <FiPlus />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Panel de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiShoppingCart />
          </div>
          <div className="stat-info">
            <h3>{totalVentas}</h3>
            <p>Total Ventas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FiShoppingCart />
          </div>
          <div className="stat-info">
            <h3>${totalIngresos.toLocaleString()}</h3>
            <p>Ingresos Totales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stock">
            <FiShoppingCart />
          </div>
          <div className="stat-info">
            <h3>{ventasHoy}</h3>
            <p>Ventas Hoy</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon out-of-stock">
            <FiShoppingCart />
          </div>
          <div className="stat-info">
            <h3>${(totalIngresos / (totalVentas || 1)).toFixed(2)}</h3>
            <p>Ticket Promedio</p>
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
              placeholder="Buscar ventas por número..."
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
        
        {showFilters && (
          <div className="filter-options">
            <div className="filter-group">
              <label>Estado:</label>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filterEstado === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterEstado('all')}
                >
                  Todos
                </button>
                <button 
                  className={`filter-btn ${filterEstado === 'completa' ? 'active' : ''}`}
                  onClick={() => setFilterEstado('completa')}
                >
                  Completas
                </button>
                <button 
                  className={`filter-btn ${filterEstado === 'pendiente' ? 'active' : ''}`}
                  onClick={() => setFilterEstado('pendiente')}
                >
                  Pendientes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de ventas */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando ventas...</p>
          </div>
        ) : filteredVentas.length === 0 ? (
          <div className="empty-state">
            <FiShoppingCart />
            <h3>No se encontraron ventas</h3>
            <p>{searchTerm || filterEstado !== 'all' ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza registrando tu primera venta'}</p>
            {!searchTerm && filterEstado === 'all' && (
              <button
                onClick={() => setModalOpen(true)}
                className="btn-primary"
              >
                <FiPlus />
                Registrar Primera Venta
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>N° Venta</th>
                  <th>Fecha</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredVentas.map((venta) => (
                  <tr key={venta.id}>
                    <td className="sku-cell">
                      <span className="sku-badge">#{venta.numeroInterno || venta.numero_interno}</span>
                    </td>
                    <td className="unit-cell">
                      {venta.fecha ? new Date(venta.fecha).toLocaleDateString() : "-"}
                    </td>
                    <td className="unit-cell">
                      {venta.items?.length || 0} productos
                    </td>
                    <td className="price-cell highlight">
                      ${Number(venta.total || 0).toLocaleString()}
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${venta.estado?.toLowerCase() === 'completa' ? 'active' : 'inactive'}`}>
                        {venta.estado || 'PENDIENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <VentaFormModal
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchVentas(); }}
        />
      )}
    </div>
  );
}