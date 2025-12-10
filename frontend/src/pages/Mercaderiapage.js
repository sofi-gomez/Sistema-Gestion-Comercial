import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiSearch, FiFilter } from "react-icons/fi";
import ProductoFormModal from "../components/ProductoFormModal";
import "../index.css";

export default function MercaderiaPage() {
    // ==================== ESTADOS DEL COMPONENTE ====================

  const [productos, setProductos] = useState([]);// Lista de productos obtenidos del backend
  const [loading, setLoading] = useState(true);// Indicador de carga mientras se obtienen los datos
  const [modalOpen, setModalOpen] = useState(false);    // Control de apertura/cierre del modal de formulario
  const [editing, setEditing] = useState(null); // Almacena el producto en edición (null si es nuevo producto)
  const [searchTerm, setSearchTerm] = useState("");// Término de búsqueda para filtrar productos
  const [filterActive, setFilterActive] = useState("all"); // Filtro por estado: "all", "active", "inactive"
  const [showFilters, setShowFilters] = useState(false);// Muestra u oculta el panel de filtros avanzados

  const API_URL = "http://localhost:8080/api/productos";  // URL base de la API REST

    // ---------------- ALERTA DE PRODUCTOS POR VENCER ----------------

    // Calcula productos que vencen en los próximos 30 días
    const hoy = new Date();
    const productosProximos = productos.filter(p => {
        if (!p.fechaVencimiento) return false;
        const fecha = new Date(p.fechaVencimiento);
        const diff = (fecha - hoy) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 29 ; // Productos que vencen en 30 días
    });

    // Control para ocultar la alerta de vencimiento
    const [ocultarAlerta, setOcultarAlerta] = useState(false);


    // ==================== FUNCIONES DE API ====================

    //Obtiene todos los productos desde el backend
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

    // Efecto que carga los productos al montar el componente
  useEffect(() => {
    fetchProductos();
  }, []);

  //Elimina un producto después de confirmar con el usuario
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchProductos();
  };

  //Guarda un producto (crea nuevo o actualiza existente)
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

    // ==================== FILTRADO DE PRODUCTOS ====================

    //Filtra productos por búsqueda (nombre/SKU) y estado (activo/inactivo)
  const filteredProductos = productos.filter(producto => {

      // Coincidencia con el término de búsqueda
    const matchesSearch = producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      // Coincidencia con el filtro de estado
    const matchesFilter = filterActive === "all" ? true :
                         filterActive === "active" ? producto.activo :
                         filterActive === "inactive" ? !producto.activo : true;

    return matchesSearch && matchesFilter;
  });

    // ----------- FUNCIONES DE COLORES SEGÚN FECHA DE VENCIMIENTO -----------

    //Determina el estado de un producto según su fecha de vencimiento
    const getProductoStatus = (fechaVencimiento) => {
        if (!fechaVencimiento) return "normal";

        const hoy = new Date();
        const fecha = new Date(fechaVencimiento);

        const diffDias = (fecha - hoy) / (1000 * 60 * 60 * 24);

        if (diffDias < 0) return "vencido";         // Vencido
        if (diffDias <= 29) return "por-vencer";    // Quedan 30 días o menos

        return "normal";                            // Todo ok
    };

    //Retorna la clase CSS según el estado del producto
    const getRowClass = (status) => {
        switch (status) {
            case "vencido":
                return "vencido";  // Cambiado de "bg-red-100" a "vencido"
            case "por-vencer":
                return "por-vencer"; // Cambiado de "bg-yellow-100" a "por-vencer"
            default:
                return ""; // Sin estilo especial
        }
    };

    // ==================== RENDERIZADO ====================
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
            {/* Botón para crear nuevo producto */}
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-primary"
          >
            <FiPlus />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/*  ==================== PANEL DE ESTADÍSTICAS ==================== */}
      <div className="stats-grid">
          {/* Total de productos */}
        <div className="stat-card">
          <div className="stat-icon total">
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{productos.length}</h3>
            <p>Total Productos</p>
          </div>
        </div>

          {/* Productos activos */}
        <div className="stat-card">
          <div className="stat-icon active">
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{productos.filter(p => p.activo).length}</h3>
            <p>Productos Activos</p>
          </div>
        </div>

          {/* Productos con stock disponible */}
        <div className="stat-card">
          <div className="stat-icon stock">
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{productos.filter(p => p.stock > 0).length}</h3>
            <p>Con Stock</p>
          </div>
        </div>

          {/* Productos sin stock */}
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

      {/*==================== BARRA DE BÚSQUEDA Y FILTROS ==================== */}
      <div className="filters-bar">
        <div className="search-container">
            {/* Caja de búsqueda */}
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
            {/* Botón para mostrar/ocultar filtros */}
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filtros
          </button>
        </div>

          {/* Panel de filtros (se muestra condicionalmente) */}
        {showFilters && (
          <div className="filter-options">
            <div className="filter-group">
              <label>Estado:</label>
              <div className="filter-buttons">

                  {/* Botón: Todos */}
                <button
                  className={`filter-btn ${filterActive === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterActive('all')}
                >
                  Todos
                </button>

                  {/* Botón: Solo activos */}
                <button
                  className={`filter-btn ${filterActive === 'active' ? 'active' : ''}`}
                  onClick={() => setFilterActive('active')}
                >
                  Activos
                </button>

                  {/* Botón: Solo inactivos */}
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
            //Estado: Sin resultados
        ) : filteredProductos.length === 0 ? (
          <div className="empty-state">
            <FiPackage />
            <h3>No se encontraron productos</h3>
            <p>{searchTerm || filterActive !== 'all' ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza agregando tu primer producto'}</p>

              {/* Botón para agregar primer producto (solo si no hay filtros) */}
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
            //Estado: Tabla con productos
          <div className="table-wrapper">
            <table className="modern-table">
                {/* Encabezados de la tabla */}
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Precio Costo</th>
                  <th>Precio Venta</th>
                  <th>Unidad</th>
                    <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

                {/* Filas de productos */}
                <tbody>
                {filteredProductos.map((producto) => {
                    const status = getProductoStatus(producto.fechaVencimiento);
                    console.log(`Producto: ${producto.nombre}, Status: ${status}, Fecha: ${producto.fechaVencimiento}`);
                    const vencimientoClass = getRowClass(status);

                    return (
                        <tr
                            key={producto.id}
                            className={`${!producto.activo ? 'inactive' : ''} ${vencimientoClass}`}>
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

                            {/* Fecha de vencimiento */}
                            <td className="date-cell">
                                {producto.fechaVencimiento ? (
                                    <span className="date-badge">
              {new Date(producto.fechaVencimiento).toLocaleDateString('es-AR')}
            </span>
                                ) : (
                                    <span className="no-date">-</span>
                                )}
                            </td>

                            {/* Estado activo/inactivo */}
                            <td className="status-cell">
          <span className={`status-badge ${producto.activo ? 'active' : 'inactive'}`}>
            {producto.activo ? 'Activo' : 'Inactivo'}
          </span>
                            </td>

                            {/* Acciones */}
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
                    );
                })}
                </tbody>

            </table>
          </div>
        )}
      </div>

        {/* ==================== MODAL DE FORMULARIO ==================== */}
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