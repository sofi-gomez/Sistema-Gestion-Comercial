import React, { useEffect, useState } from "react";
import { FiPlus, FiDollarSign, FiSearch, FiFilter, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import MovimientoFormModal from "../components/MovimientoFormModal";
import "../index.css";

export default function TesoreriaPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterMedio, setFilterMedio] = useState("all");

  const API_BASE = "http://localhost:8080/api/tesoreria";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}`);
      const data = await res.json();
      setMovimientos(data || []);
    } catch (err) {
      console.error("Error cargando movimientos:", err);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaved = () => {
    setModalOpen(false);
    fetchAll();
  };

  // Filtrar movimientos
  const filteredMovimientos = movimientos.filter(movimiento => {
    const matchesSearch = 
      movimiento.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movimiento.referencia?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === "all" ? true : 
                       movimiento.tipo?.toLowerCase() === filterTipo.toLowerCase();
    
    const matchesMedio = filterMedio === "all" ? true : 
                        movimiento.medioPago?.toLowerCase() === filterMedio.toLowerCase();
    
    return matchesSearch && matchesTipo && matchesMedio;
  });

  // Calcular estadísticas
  const ingresos = movimientos
    .filter(m => m.tipo?.toUpperCase() === "INGRESO")
    .reduce((acc, m) => acc + Number(m.importe || 0), 0);

  const egresos = movimientos
    .filter(m => m.tipo?.toUpperCase() === "EGRESO")
    .reduce((acc, m) => acc + Number(m.importe || 0), 0);

  const saldo = ingresos - egresos;

  // Obtener medios de pago únicos para filtros
  const mediosPago = [...new Set(movimientos.map(m => m.medioPago).filter(Boolean))];

  return (
    <div className="mercaderia-container">
      {/* Header de la página */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <FiDollarSign />
            </div>
            <div>
              <h1>Gestión de Tesorería</h1>
              <p>Movimientos y medios de pago - Control de caja</p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            <FiPlus />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Panel de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <h3>${ingresos.toLocaleString()}</h3>
            <p>Total Ingresos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FiTrendingDown />
          </div>
          <div className="stat-info">
            <h3>${egresos.toLocaleString()}</h3>
            <p>Total Egresos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stock">
            <FiDollarSign />
          </div>
          <div className="stat-info">
            <h3>${saldo.toLocaleString()}</h3>
            <p>Saldo Actual</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon out-of-stock">
            <FiDollarSign />
          </div>
          <div className="stat-info">
            <h3>{movimientos.length}</h3>
            <p>Total Movimientos</p>
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
              placeholder="Buscar movimientos por descripción o referencia..."
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
              <label>Tipo:</label>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filterTipo === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterTipo('all')}
                >
                  Todos
                </button>
                <button 
                  className={`filter-btn ${filterTipo === 'ingreso' ? 'active' : ''}`}
                  onClick={() => setFilterTipo('ingreso')}
                >
                  Ingresos
                </button>
                <button 
                  className={`filter-btn ${filterTipo === 'egreso' ? 'active' : ''}`}
                  onClick={() => setFilterTipo('egreso')}
                >
                  Egresos
                </button>
              </div>
            </div>

            {mediosPago.length > 0 && (
              <div className="filter-group">
                <label>Medio:</label>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filterMedio === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterMedio('all')}
                  >
                    Todos
                  </button>
                  {mediosPago.map(medio => (
                    <button 
                      key={medio}
                      className={`filter-btn ${filterMedio === medio.toLowerCase() ? 'active' : ''}`}
                      onClick={() => setFilterMedio(medio.toLowerCase())}
                    >
                      {medio}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabla de movimientos */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando movimientos...</p>
          </div>
        ) : filteredMovimientos.length === 0 ? (
          <div className="empty-state">
            <FiDollarSign />
            <h3>No se encontraron movimientos</h3>
            <p>{searchTerm || filterTipo !== 'all' || filterMedio !== 'all' ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza registrando tu primer movimiento'}</p>
            {!searchTerm && filterTipo === 'all' && filterMedio === 'all' && (
              <button
                onClick={() => setModalOpen(true)}
                className="btn-primary"
              >
                <FiPlus />
                Registrar Primer Movimiento
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Medio de Pago</th>
                  <th>Importe</th>
                  <th>Referencia</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovimientos.map((movimiento) => (
                  <tr key={movimiento.id}>
                    <td className="unit-cell">
                      {movimiento.fecha ? new Date(movimiento.fecha).toLocaleDateString() : 
                       movimiento.createdAt ? new Date(movimiento.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${movimiento.tipo?.toUpperCase() === 'INGRESO' ? 'active' : 'inactive'}`}>
                        {movimiento.tipo || 'SIN TIPO'}
                      </span>
                    </td>
                    <td className="unit-cell">
                      {movimiento.medioPago || movimiento.medio_pago || '-'}
                    </td>
                    <td className={`price-cell ${movimiento.tipo?.toUpperCase() === 'INGRESO' ? 'highlight' : 'danger'}`}>
                      ${Number(movimiento.importe || 0).toLocaleString()}
                    </td>
                    <td className="unit-cell">
                      {movimiento.referencia || '-'}
                    </td>
                    <td className="product-cell">
                      <div className="product-info">
                        <p>{movimiento.descripcion || 'Sin descripción'}</p>
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
        <MovimientoFormModal
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}