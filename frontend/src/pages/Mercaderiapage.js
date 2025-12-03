import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiSearch, FiFilter } from "react-icons/fi";
import ProductoFormModal from "../components/ProductoFormModal";
import "../index.css";

export default function MercaderiaPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = "http://localhost:8080/api/productos";

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error("Error cargando productos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchProductos();
  };

  const handleSave = async (producto) => {
    const method = producto.id ? "PUT" : "POST";
    const url = producto.id ? `${API_URL}/${producto.id}` : API_URL;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto),
    });

    setModalOpen(false);
    setEditing(null);
    fetchProductos();
  };

  // Filtrar productos
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === "all" ? true :
                         filterActive === "active" ? producto.activo :
                         filterActive === "inactive" ? !producto.activo : true;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mercaderia-container">
      {/* Header de la página */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <FiPackage />
            </div>
            <div>
              <h1>Gestión de Mercadería</h1>
              <p>Administra tu inventario y control de stock</p>
            </div>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-primary"
          >
            <FiPlus />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Panel de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{productos.length}</h3>
            <p>Total Productos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{productos.filter(p => p.activo).length}</h3>
            <p>Productos Activos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stock">
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{productos.filter(p => p.stock > 0).length}</h3>
            <p>Con Stock</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon out-of-stock">
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{productos.filter(p => p.stock <= 0).length}</h3>
            <p>Sin Stock</p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros MEJORADA */}
      <div className="filters-bar">
        <div className="search-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o SKU..."
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
                  className={`filter-btn ${filterActive === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterActive('all')}
                >
                  Todos
                </button>
                <button 
                  className={`filter-btn ${filterActive === 'active' ? 'active' : ''}`}
                  onClick={() => setFilterActive('active')}
                >
                  Activos
                </button>
                <button 
                  className={`filter-btn ${filterActive === 'inactive' ? 'active' : ''}`}
                  onClick={() => setFilterActive('inactive')}
                >
                  Inactivos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando productos...</p>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="empty-state">
            <FiPackage />
            <h3>No se encontraron productos</h3>
            <p>{searchTerm || filterActive !== 'all' ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza agregando tu primer producto'}</p>
            {!searchTerm && filterActive === 'all' && (
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="btn-primary"
              >
                <FiPlus />
                Agregar Primer Producto
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Precio Costo</th>
                  <th>Precio Venta</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductos.map((producto) => (
                  <tr key={producto.id} className={!producto.activo ? 'inactive' : ''}>
                    <td className="sku-cell">
                      <span className="sku-badge">{producto.sku || producto.id}</span>
                    </td>
                    <td className="product-cell">
                      <div className="product-info">
                        <h4>{producto.nombre}</h4>
                        {producto.descripcion && (
                          <p>{producto.descripcion}</p>
                        )}
                      </div>
                    </td>
                    <td className="stock-cell">
                      <span className={`stock-badge ${producto.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {producto.stock}
                      </span>
                    </td>
                    <td className="price-cell">
                      ${Number(producto.precioCosto || 0).toLocaleString()}
                    </td>
                    <td className="price-cell highlight">
                      ${Number(producto.precioVenta || 0).toLocaleString()}
                    </td>
                    <td className="unit-cell">
                      {producto.unidadMedida || '-'}
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${producto.activo ? 'active' : 'inactive'}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => { setEditing(producto); setModalOpen(true); }}
                          className="icon-btn edit"
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id)}
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

      {/* Modal corregido */}
      {modalOpen && (
        <ProductoFormModal
          producto={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}