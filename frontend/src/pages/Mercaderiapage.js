import React, { useState, useEffect } from "react";
import {
  FiPackage, FiSearch, FiEdit2, FiTrash2, FiPlus,
  FiFilter, FiAlertCircle, FiEye, FiEyeOff, FiRotateCcw
} from "react-icons/fi";
import ProductoFormModal from "../components/ProductoFormModal";
import AjusteStockModal from "../components/AjusteStockModal";
import Toast from "../components/Toast";
import { apiFetch } from "../utils/api";
import { formatDateLocal } from "../utils/dateUtils";

export default function MercaderiaPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [productoParaAjustar, setProductoParaAjustar] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [stockFilter, setStockFilter] = useState("all");
  const [configuracion, setConfiguracion] = useState(null);
  const [cotizacionDolar, setCotizacionDolar] = useState("");
  const [savingCotizacion, setSavingCotizacion] = useState(false);
  const [activeTab, setActiveTab] = useState("productos");
  const [historialAjustes, setHistorialAjustes] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [showCostPrices, setShowCostPrices] = useState(() => {
    const saved = localStorage.getItem("showCostPrices");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("showCostPrices", JSON.stringify(showCostPrices));
  }, [showCostPrices]);

  const isExpiring = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const parts = fecha.split('T')[0].split('-');
    const fVenc = new Date(parts[0], parts[1] - 1, parts[2]);
    const diff = (fVenc - hoy) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  const API_URL = "/api/productos";

  const fetchProductosAndConfig = async () => {
    setLoading(true);
    try {
      const [resProd, resConf] = await Promise.all([
        apiFetch(API_URL),
        apiFetch("/api/configuracion")
      ]);
      const dataProd = await resProd.json();
      const dataConf = await resConf.json();
      setProductos(dataProd);
      setConfiguracion(dataConf);
      setCotizacionDolar(dataConf.cotizacionDolar || "");
    } catch (err) {
      console.error("Error cargando productos o configuración:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductosAndConfig();
  }, []);

  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await apiFetch("/api/ajustes-stock");
      if (res.ok) setHistorialAjustes(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingHistorial(false); }
  };

  useEffect(() => {
    if (activeTab === "historial") fetchHistorial();
  }, [activeTab]);

  const handleUpdateCotizacion = async () => {
    if (!configuracion) return;
    setSavingCotizacion(true);
    try {
      const updatedConf = { ...configuracion, cotizacionDolar: parseFloat(cotizacionDolar) || 0 };
      const res = await apiFetch("/api/configuracion", {
        method: "PUT",
        body: JSON.stringify(updatedConf)
      });
      if (res.ok) {
        setConfiguracion(await res.json());
        setToast({ title: "Configuración Actualizada", message: "Cotización del Dólar actualizada.", type: "success" });
      }
    } catch (e) {
      console.error(e);
      setToast({ title: "Error", message: "No se pudo actualizar la cotización.", type: "error" });
    } finally {
      setSavingCotizacion(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;
    await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchProductosAndConfig();
    setToast({
      title: "Producto eliminado",
      message: "El producto se ha borrado del sistema.",
      type: "info"
    });
  };

  const handleSave = async (producto) => {
    const method = producto.id ? "PUT" : "POST";
    const url = producto.id ? `${API_URL}/${producto.id}` : API_URL;

    await apiFetch(url, {
      method,
      body: JSON.stringify(producto),
    });

    setModalOpen(false);
    setEditing(null);
    fetchProductosAndConfig();
    setToast({
      title: producto.id ? "Producto actualizado" : "Producto creado",
      message: `El producto ${producto.nombre} se guardó correctamente.`,
      type: "success"
    });
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

    // Coincidencia con el filtro de stock/vencimiento (Tarjetas)
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = producto.stock > 0 && producto.stock <= 10;
    } else if (stockFilter === "empty") {
      matchesStock = producto.stock <= 0;
    } else if (stockFilter === "expiring") {
      matchesStock = isExpiring(producto.fechaVencimiento);
    }

    return matchesSearch && matchesFilter && matchesStock;
  });

  // ----------- FUNCIONES DE COLORES SEGÚN FECHA DE VENCIMIENTO -----------

  //Determina el estado de un producto según su fecha de vencimiento
  const getProductoStatus = (fechaVencimiento) => {
    if (!fechaVencimiento) return "normal";

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const parts = fechaVencimiento.split('T')[0].split('-');
    const fecha = new Date(parts[0], parts[1] - 1, parts[2]);

    const diffDias = (fecha - hoy) / (1000 * 60 * 60 * 24);

    if (diffDias < 0) return "vencido";
    if (diffDias <= 29) return "por-vencer";

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
              <h1>{activeTab === 'productos' ? 'Gestión de Mercadería' : 'Historial de Ajustes'}</h1>
              <p>{activeTab === 'productos' ? 'Administra tu inventario y control de stock' : 'Consulta los movimientos manuales del inventario'}</p>
            </div>
          </div>
          {activeTab === 'productos' && (
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="btn-primary"
            >
              <FiPlus />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="tabs-container" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        <button 
          className={`tab-btn ${activeTab === 'productos' ? 'active' : ''}`}
          onClick={() => setActiveTab('productos')}
          style={{ 
            padding: "8px 16px", 
            border: "none", 
            background: "none", 
            cursor: "pointer", 
            fontWeight: "600",
            color: activeTab === 'productos' ? "var(--primary)" : "var(--muted)",
            borderBottom: activeTab === 'productos' ? "2px solid var(--primary)" : "none"
          }}
        >
          Lista de Productos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
          style={{ 
            padding: "8px 16px", 
            border: "none", 
            background: "none", 
            cursor: "pointer", 
            fontWeight: "600",
            color: activeTab === 'historial' ? "var(--primary)" : "var(--muted)",
            borderBottom: activeTab === 'historial' ? "2px solid var(--primary)" : "none"
          }}
        >
          Historial de Ajustes
        </button>
      </div>

      {activeTab === "productos" ? (
        <>
          {/*  ==================== PANEL DE ESTADÍSTICAS (FILTROS) ==================== */}
      <div className="stats-grid">
        {/* Total de productos */}
        <div
          className={`stat-card clickable ${stockFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStockFilter('all')}
        >
          <div className="stat-icon total">
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{productos.length}</h3>
            <p>Total Productos</p>
          </div>
        </div>

        {/* Poco stock (Umbral 10 solicitado) */}
        <div
          className={`stat-card clickable ${stockFilter === 'low' ? 'active' : ''}`}
          onClick={() => setStockFilter('low')}
        >
          <div className="stat-icon warning-low">
            <FiFilter />
          </div>
          <div className="stat-info">
            <h3>{productos.filter(p => p.stock > 0 && p.stock <= 10).length}</h3>
            <p>Poco Stock (≤10)</p>
          </div>
        </div>

        {/* Por Vencer (Umbral 30 días solicitado) */}
        <div
          className={`stat-card clickable ${stockFilter === 'expiring' ? 'active' : ''}`}
          onClick={() => setStockFilter('expiring')}
        >
          <div className="stat-icon expiring">
            <FiAlertCircle />
          </div>
          <div className="stat-info">
            <h3>{productos.filter(p => isExpiring(p.fechaVencimiento)).length}</h3>
            <p>Por Vencer (30d)</p>
          </div>
        </div>

        {/* Sin stock */}
        <div
          className={`stat-card clickable ${stockFilter === 'empty' ? 'active' : ''}`}
          onClick={() => setStockFilter('empty')}
        >
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
          
          <button
            className={`filter-toggle ${!showCostPrices ? 'active' : ''}`}
            onClick={() => setShowCostPrices(!showCostPrices)}
            title={showCostPrices ? "Ocultar precios de costo" : "Mostrar precios de costo"}
            style={{ marginLeft: '10px' }}
          >
            {showCostPrices ? <FiEye /> : <FiEyeOff />}
            {showCostPrices ? "Ocultar Costos" : "Mostrar Costos"}
          </button>
          
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", background: "var(--surface)", padding: "4px 12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--muted)" }}>Cotización USD:</span>
            <span style={{ color: "var(--success)", fontWeight: "600" }}>$</span>
            <input
              type="number"
              style={{ width: "80px", border: "none", outline: "none", background: "transparent", fontSize: "0.95rem", fontWeight: "600", color: "var(--text)" }}
              value={cotizacionDolar}
              onChange={(e) => setCotizacionDolar(e.target.value)}
              onBlur={handleUpdateCotizacion}
            />
            {savingCotizacion && <span style={{ fontSize: "0.7rem", color: "var(--primary)" }}>Guardando...</span>}
          </div>
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
                        {!showCostPrices ? (
                          <span style={{ color: "#94a3b8", letterSpacing: "2px" }}>****</span>
                        ) : producto.precioCosto > 0 ? (
                          <>
                            <div>${Number(producto.precioCosto).toLocaleString()}</div>
                            {producto.precioCostoUSD && (
                              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>
                                USD {Number(producto.precioCostoUSD).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </>
                        ) : producto.precioCostoUSD ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{
                              background: "linear-gradient(135deg, #1e40af, #2563eb)",
                              color: "white",
                              padding: "3px 9px",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              alignSelf: "flex-start"
                            }}>
                              USD {Number(producto.precioCostoUSD).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            {configuracion?.cotizacionDolar > 0 && (
                                <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: "500" }}>Aprox. ${(producto.precioCostoUSD * configuracion.cotizacionDolar).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#475569" }}>—</span>
                        )}
                      </td>

                      <td className="price-cell highlight">
                        {producto.precioVenta > 0 ? (
                          <>
                            <div>${Number(producto.precioVenta).toLocaleString()}</div>
                            {producto.precioVentaUSD && (
                              <div style={{ fontSize: "0.75rem", color: "#4ade80", marginTop: 2 }}>
                                USD {Number(producto.precioVentaUSD).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </>
                        ) : producto.precioVentaUSD ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{
                              background: "linear-gradient(135deg, #065f46, #059669)",
                              color: "white",
                              padding: "3px 9px",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              alignSelf: "flex-start"
                            }}>
                              USD {Number(producto.precioVentaUSD).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            {configuracion?.cotizacionDolar > 0 && (
                                <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: "600" }}>Aprox. ${(producto.precioVentaUSD * configuracion.cotizacionDolar).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#475569" }}>—</span>
                        )}
                      </td>

                      <td className="unit-cell">
                        {producto.unidadMedida || '-'}
                      </td>

                      {/* Fecha de vencimiento */}
                      <td className="date-cell">
                        {producto.fechaVencimiento ? (
                          <span className="date-badge">
                            {formatDateLocal(producto.fechaVencimiento)}
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
                            onClick={() => { setProductoParaAjustar(producto); setAjusteModalOpen(true); }}
                            className="icon-btn edit"
                            title="Ajustar Stock"
                            style={{ color: "var(--primary)" }}
                          >
                            <FiRotateCcw />
                          </button>

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
      </>
      ) : (
        <div className="table-container">
          {loadingHistorial ? (
            <div className="loading-state"><div className="loading-spinner"></div><p>Cargando historial...</p></div>
          ) : historialAjustes.length === 0 ? (
            <div className="empty-state"><FiRotateCcw /><h3>No hay ajustes registrados</h3></div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {historialAjustes.map(adj => (
                    <tr key={adj.id}>
                      <td>{adj.fecha ? formatDateLocal(adj.fecha) : '-'}</td>
                      <td>{adj.producto?.nombre}</td>
                      <td>
                        <span className={`stock-badge ${adj.cantidad > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          {adj.cantidad > 0 ? `+${adj.cantidad}` : adj.cantidad}
                        </span>
                      </td>
                      <td style={{ fontStyle: "italic", color: "var(--muted)" }}>{adj.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL DE FORMULARIO ==================== */}
      {modalOpen && (
        <ProductoFormModal
          producto={editing}
          cotizacion={configuracion?.cotizacionDolar}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {ajusteModalOpen && (
        <AjusteStockModal
          producto={productoParaAjustar}
          onClose={() => { setAjusteModalOpen(false); setProductoParaAjustar(null); }}
          onSave={() => {
            fetchProductosAndConfig();
            setToast({ title: "Stock Ajustado", message: "El inventario se actualizó correctamente.", type: "success" });
          }}
        />
      )}

      {toast && (
        <div className="toast-container">
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
