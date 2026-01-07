import React, { useEffect, useState } from "react";
import { FiPlus, FiDollarSign, FiSearch, FiFilter, FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheck, FiEdit2 } from "react-icons/fi";
import MovimientoFormModal from "../components/MovimientoFormModal";
import "../index.css";

export default function TesoreriaPage() {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [movimientoEditar, setMovimientoEditar] = useState(null);
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
        setMovimientoEditar(null);
        fetchAll();
    };

    // Filtrar movimientos
    const filteredMovimientos = movimientos.filter(movimiento => {
        const matchesSearch =
            movimiento.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movimiento.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            movimiento.numeroCheque?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTipo = filterTipo === "all" ? true :
            movimiento.tipo?.toLowerCase() === filterTipo.toLowerCase();

        const matchesMedio = filterMedio === "all" ? true :
            movimiento.medioPago?.toLowerCase() === filterMedio.toLowerCase();

        return matchesSearch && matchesTipo && matchesMedio;
    });

    // Calcular estadísticas (excluyendo movimientos anulados)
    const movimientosActivos = movimientos.filter(m => !m.anulado);

    const ingresos = movimientosActivos
        .filter(m => m.tipo?.toUpperCase() === "INGRESO")
        .reduce((acc, m) => acc + Number(m.importe || 0), 0);

    const egresos = movimientosActivos
        .filter(m => m.tipo?.toUpperCase() === "EGRESO")
        .reduce((acc, m) => acc + Number(m.importe || 0), 0);

    const saldo = ingresos - egresos;

    // Calcular ingresos pendientes de cobro
    const ingresosPendientes = movimientosActivos
        .filter(m => m.tipo?.toUpperCase() === "INGRESO" && !m.cobrado)
        .reduce((acc, m) => acc + Number(m.importe || 0), 0);

    // Obtener medios de pago únicos para filtros
    const mediosPago = [...new Set(movimientos.map(m => m.medioPago).filter(Boolean))];

    // ✅ Función para formatear fechas
    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        const date = new Date(fecha);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // ✅ Función para verificar si un cheque está próximo a vencer (7 días)
    const estaProximoAVencer = (fechaVencimiento) => {
        if (!fechaVencimiento) return false;
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diasDiferencia = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));
        return diasDiferencia > 0 && diasDiferencia <= 7;
    };

    // ✅ Función para verificar si un cheque está vencido
    const estaVencido = (fechaVencimiento) => {
        if (!fechaVencimiento) return false;
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        return vencimiento < hoy;
    };

    //Función para abrir modal de edición
    const handleEditar = (movimiento) => {
        setMovimientoEditar(movimiento);
        setModalOpen(true);
    };

    //Función para marcar movimiento como cobrado (universal)
    const marcarComoCobrado = async (movimientoId) => {
        if (!window.confirm("¿Confirmar que este movimiento fue cobrado/acreditado?")) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/${movimientoId}/cobrar`, {
                method: "PUT",
            });

            if (!res.ok) {
                throw new Error("Error al marcar como cobrado");
            }

            alert("Movimiento marcado como cobrado");
            fetchAll();
        } catch (err) {
            console.error("Error marcando como cobrado:", err);
            alert("No se pudo marcar como cobrado: " + err.message);
        }
    };

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
                        onClick={() => { setMovimientoEditar(null); setModalOpen(true); }}
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
                    <div className="stat-icon out-of-stock" style={{ background: '#fef3c7', color: '#92400e' }}>
                        <FiAlertCircle />
                    </div>
                    <div className="stat-info">
                        <h3>${ingresosPendientes.toLocaleString()}</h3>
                        <p>Pendiente de Cobro</p>
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
                            placeholder="Buscar por descripción, referencia o número de cheque..."
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
                                            {medio.replace(/_/g, ' ')}
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
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredMovimientos.map((movimiento) => {
                                const esCheque = movimiento.medioPago?.includes("CHEQUE");
                                const proximoVencer = esCheque && estaProximoAVencer(movimiento.fechaVencimiento);
                                const vencido = esCheque && estaVencido(movimiento.fechaVencimiento);
                                const esAnulado = movimiento.anulado;

                                return (
                                    <tr key={movimiento.id} style={esAnulado ? {
                                        opacity: 0.6,
                                        background: '#f9fafb',
                                        textDecoration: 'line-through'
                                    } : {}}>
                                        <td className="unit-cell">
                                            {movimiento.fecha ? new Date(movimiento.fecha).toLocaleDateString() :
                                                movimiento.createdAt ? new Date(movimiento.createdAt).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="status-cell">
                                            {esAnulado ? (
                                                <span className="status-badge" style={{
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: '1px solid #fecaca'
                                                }}>
                            ANULADO
                          </span>
                                            ) : (
                                                <span className={`status-badge ${movimiento.tipo?.toUpperCase() === 'INGRESO' ? 'active' : 'inactive'}`}>
                            {movimiento.tipo || 'SIN TIPO'}
                          </span>
                                            )}
                                        </td>
                                        <td className="unit-cell">
                                            <div>
                                                <strong>{movimiento.medioPago?.replace(/_/g, ' ') || '-'}</strong>

                                                {/* ✅ MOSTRAR DATOS DEL CHEQUE SI EXISTE */}
                                                {esCheque && movimiento.numeroCheque && (
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: '#666',
                                                        marginTop: '4px',
                                                        lineHeight: '1.4'
                                                    }}>
                                                        <div>📄 Cheque #{movimiento.numeroCheque}</div>
                                                        {movimiento.banco && <div>🏦 {movimiento.banco}</div>}
                                                        {movimiento.librador && <div>👤 {movimiento.librador}</div>}

                                                        {/* Fechas importantes */}
                                                        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            {movimiento.fechaCobro && (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    color: '#059669'
                                                                }}>
                                                                    📅 Cobro: {formatearFecha(movimiento.fechaCobro)}
                                                                </div>
                                                            )}

                                                            {movimiento.fechaVencimiento && (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    color: vencido ? '#dc2626' : proximoVencer ? '#f59e0b' : '#666'
                                                                }}>
                                                                    {vencido && <FiAlertCircle />}
                                                                    ⏰ Vence: {formatearFecha(movimiento.fechaVencimiento)}
                                                                    {vencido && <span style={{ fontWeight: 'bold' }}> (VENCIDO)</span>}
                                                                    {proximoVencer && <span style={{ fontWeight: 'bold' }}> (Próximo)</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
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
                                        <td className="status-cell">
                                            {!esAnulado ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                                    {/* Badge de estado cobrado/pendiente */}
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        textAlign: 'center',
                                                        whiteSpace: 'nowrap',
                                                        background: movimiento.cobrado ? '#d1fae5' : '#fef3c7',
                                                        color: movimiento.cobrado ? '#065f46' : '#92400e',
                                                        border: movimiento.cobrado ? '1px solid #a7f3d0' : '1px solid #fde68a'
                                                    }}>
                              {movimiento.cobrado ? '✓ COBRADO' : '⏳ PENDIENTE'}
                            </span>

                                                    {/* Botón para marcar como cobrado (solo si está pendiente) */}
                                                    {!movimiento.cobrado && (
                                                        <button
                                                            onClick={() => marcarComoCobrado(movimiento.id)}
                                                            className="action-btn edit"
                                                            title="Marcar como cobrado/acreditado"
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '6px 12px',
                                                                width: '100%',
                                                                maxWidth: '100px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <FiCheck size={14} /> Cobrar
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontWeight: '600',
                                                    background: '#f3f4f6',
                                                    color: '#6b7280'
                                                }}>
                            ANULADO
                          </span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            {/* Aquí irán los botones de editar, etc. */}
                                            {!esAnulado && (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleEditar(movimiento)}
                                                        className="action-btn edit"
                                                        title="Editar movimiento"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                </div>
                                            )}
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
                <MovimientoFormModal
                    onClose={() => { setModalOpen(false); setMovimientoEditar(null); }}
                    onSaved={handleSaved}
                    movimientoEditar={movimientoEditar}
                />
            )}
        </div>
    );
}