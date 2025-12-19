import React, { useEffect, useState } from "react";
import { FiPlus, FiShoppingCart, FiSearch, FiFilter, FiEdit2, FiTrash2 } from "react-icons/fi";
import VentaFormModal from "../components/VentaFormModal";
import "../index.css";

export default function VentasPage() {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [ventaEditar, setVentaEditar] = useState(null);
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
            venta.numeroInterno?.toString().includes(searchTerm) ||
            venta.nombreCliente?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterEstado === "all" ? true :
            venta.estado?.toLowerCase() === filterEstado.toLowerCase();

        return matchesSearch && matchesFilter;
    });

    // Calcular estadísticas (excluyendo ventas anuladas)
    const ventasActivas = ventas.filter(v => !v.anulada);
    const totalVentas = ventasActivas.length;
    const totalIngresos = ventasActivas.reduce((acc, v) => acc + (v.total || 0), 0);
    const ventasHoy = ventasActivas.filter(v => {
        const hoy = new Date().toDateString();
        const fechaVenta = v.fecha ? new Date(v.fecha).toDateString() : "";
        return fechaVenta === hoy;
    }).length;

    // Función para formatear los items de la venta
    const formatearItems = (items) => {
        if (!items || items.length === 0) return "Sin productos";

        return items.map(item => {
            const nombre = item.producto?.nombre || "Producto";
            const cantidad = item.cantidad || 0;
            return `${nombre} (x${cantidad})`;
        }).join(", ");
    };

    // Función para abrir modal de edición
    const handleEditar = (venta) => {
        setVentaEditar(venta);
        setModalOpen(true);
    };

    // Función para anular venta
    const handleAnular = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas anular esta venta? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            const res = await fetch(`${API_LIST}/${id}/anular`, {
                method: "PUT",
            });

            if (!res.ok) {
                throw new Error("Error al anular la venta");
            }

            alert("Venta anulada correctamente");
            fetchVentas();
        } catch (err) {
            console.error("Error anulando venta:", err);
            alert("No se pudo anular la venta: " + err.message);
        }
    };

    // Función para cerrar modal y resetear venta a editar
    const handleCloseModal = () => {
        setModalOpen(false);
        setVentaEditar(null);
    };

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
                            placeholder="Buscar por número de venta o cliente..."
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
                                <th>Cliente</th>
                                <th>Medio de Pago</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredVentas.map((venta) => {
                                const esAnulada = venta.anulada;
                                return (
                                    <tr key={venta.id} style={esAnulada ? {
                                        opacity: 0.6,
                                        background: '#f9fafb',
                                        textDecoration: 'line-through'
                                    } : {}}>
                                        <td className="sku-cell">
                                            <span className="sku-badge">#{venta.numeroInterno || venta.numero_interno}</span>
                                        </td>
                                        <td className="unit-cell">
                                            {venta.fecha ? new Date(venta.fecha).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="unit-cell">
                                            {venta.nombreCliente || venta.nombre_cliente || "-"}
                                        </td>
                                        <td className="unit-cell">
                                            <strong>{(venta.medioPago || venta.medio_pago || 'EFECTIVO').replace(/_/g, ' ')}</strong>
                                        </td>
                                        <td className="product-cell">
                                            <div className="product-info" style={{ fontSize: '0.9rem' }}>
                                                <p>{formatearItems(venta.items)}</p>
                                            </div>
                                        </td>
                                        <td className="price-cell highlight">
                                            ${Number(venta.total || 0).toLocaleString()}
                                        </td>
                                        <td className="status-cell">
                                            {esAnulada ? (
                                                <span className="status-badge" style={{
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: '1px solid #fecaca'
                                                }}>
                            ANULADA
                          </span>
                                            ) : (
                                                <span className={`status-badge ${venta.estado?.toLowerCase() === 'completa' ? 'active' : 'inactive'}`}>
                            {venta.estado || 'PENDIENTE'}
                          </span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleEditar(venta)}
                                                    className="action-btn edit"
                                                    title="Editar venta"
                                                    disabled={esAnulada}
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleAnular(venta.id)}
                                                    className="action-btn delete"
                                                    title="Anular venta"
                                                    disabled={esAnulada}
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

            {modalOpen && (
                <VentaFormModal
                    onClose={handleCloseModal}
                    onSaved={() => { handleCloseModal(); fetchVentas(); }}
                    ventaEditar={ventaEditar}
                />
            )}
        </div>
    );
}