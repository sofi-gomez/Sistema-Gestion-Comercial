import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiDollarSign, FiSearch, FiTrendingUp, FiTrendingDown, FiEdit2, FiTrash2 } from "react-icons/fi";
import MovimientoFormModal from "../components/MovimientoFormModal";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_BASE = "/api/tesoreria";

export default function CajaDiariaSection() {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [movimientoEditar, setMovimientoEditar] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [tipoFilter, setTipoFilter] = useState("all"); // "all", "INGRESO", "EGRESO"
    const [sortOrder, setSortOrder] = useState("desc"); // "asc" o "desc"
    const [mostrarAnulados, setMostrarAnulados] = useState(false);
    const navigate = useNavigate();

    const cleanDescription = (desc, entidad) => {
        if (!desc) return "-";
        // Eliminar prefijos redundantes: "Pago a Proveedor: [Nombre] | " o "Cobro de Cliente: [Nombre] | "
        let cleaned = desc;
        const prefixes = [`Pago a Proveedor: ${entidad} | `, `Cobro de Cliente: ${entidad} | `, `Pago a Proveedor: ${entidad}`, `Cobro de Cliente: ${entidad}`];
        for (const p of prefixes) {
            if (cleaned.startsWith(p)) {
                cleaned = cleaned.replace(p, "");
                break;
            }
        }
        return cleaned.trim() || desc;
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`${API_BASE}`);
            const data = await res.json();
            setMovimientos(data || []);
        } catch (err) {
            console.error(err);
            setMovimientos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleSaved = () => { setModalOpen(false); setMovimientoEditar(null); fetchAll(); };

    const handleAnular = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas anular este movimiento? No impactará más en los saldos.")) return;
        try {
            const res = await apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
            if (res.ok) fetchAll();
            else alert("Error al anular movimiento.");
        } catch (err) {
            console.error(err);
        }
    };

    const handleRefClick = async (refStr, targetTab = null) => {
        if (!refStr) return;
        
        if (refStr.startsWith("Pago #")) {
            const pagoId = refStr.replace("Pago #", "");
            try {
                const res = await apiFetch(`/api/pagos-proveedor/${pagoId}`);
                if (res.ok) {
                    const pago = await res.json();
                    if (pago && pago.proveedor && pago.proveedor.id) {
                        navigate('/proveedores', { state: { 
                            autoOpenProveedorId: pago.proveedor.id, 
                            autoOpenTab: targetTab || 'ctacte' 
                        } });
                    } else {
                        alert("No se pudo hallar al proveedor de este pago.");
                    }
                } else {
                    alert("El pago ya no existe o fue depurado.");
                }
            } catch (err) {
                console.error(err);
                alert("Error al intentar abrir el pago.");
            }
        } else if (refStr.startsWith("Cobro #")) {
            const cobroId = refStr.replace("Cobro #", "");
            try {
                const res = await apiFetch(`/api/cobros/${cobroId}`);
                if (res.ok) {
                    const cobro = await res.json();
                    if (cobro && cobro.cliente && cobro.cliente.id) {
                        navigate('/clientes', { state: { 
                            autoOpenClienteId: cobro.cliente.id, 
                            autoOpenTab: targetTab || 'remitos' 
                        } });
                    } else {
                        alert("No se pudo hallar al cliente de este cobro.");
                    }
                } else {
                    alert("El cobro ya no existe o fue depurado.");
                }
            } catch (err) {
                console.error(err);
                alert("Error al intentar abrir el cobro.");
            }
        }
    };

    const filtered = movimientos.filter(m => {
        const matchesSearch = m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.entidad?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTipo = tipoFilter === "all" ? true : m.tipo?.toUpperCase() === tipoFilter;
        const matchesAnulado = mostrarAnulados ? true : !m.anulado;

        return matchesSearch && matchesTipo && matchesAnulado;
    });

    const sortedAndFiltered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.fecha || a.createdAt);
        const dateB = new Date(b.fecha || b.createdAt);
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    const ingresosT = movimientos.filter(m => !m.anulado && m.tipo?.toUpperCase() === 'INGRESO').reduce((acc, m) => acc + Number(m.importe || 0), 0);
    const egresosT = movimientos.filter(m => !m.anulado && m.tipo?.toUpperCase() === 'EGRESO').reduce((acc, m) => acc + Number(m.importe || 0), 0);
    const saldo = ingresosT - egresosT;

    return (
        <div className="caja-diaria-section">
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div
                    className={`stat-card clickable ${tipoFilter === 'INGRESO' ? 'active' : ''}`}
                    onClick={() => setTipoFilter(tipoFilter === 'INGRESO' ? 'all' : 'INGRESO')}
                >
                    <div className="stat-icon total"><FiTrendingUp /></div>
                    <div className="stat-info">
                        <h3>${ingresosT.toLocaleString()}</h3>
                        <p>Ingresos</p>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${tipoFilter === 'EGRESO' ? 'active' : ''}`}
                    onClick={() => setTipoFilter(tipoFilter === 'EGRESO' ? 'all' : 'EGRESO')}
                >
                    <div className="stat-icon out-of-stock"><FiTrendingDown /></div>
                    <div className="stat-info">
                        <h3>${egresosT.toLocaleString()}</h3>
                        <p>Egresos</p>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${tipoFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setTipoFilter('all')}
                >
                    <div className="stat-icon total" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FiDollarSign /></div>
                    <div className="stat-info">
                        <h3>${saldo.toLocaleString()}</h3>
                        <p>Saldo Actual</p>
                    </div>
                </div>
            </div>

            <div className="filters-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "1.5rem" }}>
                <div className="search-box" style={{ flex: "1 1 300px", maxWidth: "450px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar movimientos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--muted)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", background: "#f8fafc", padding: "8px 12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <input 
                            type="checkbox" 
                            checked={mostrarAnulados} 
                            onChange={(e) => setMostrarAnulados(e.target.checked)} 
                            style={{ width: "14px", height: "14px", cursor: "pointer" }}
                        />
                        Eliminados
                    </label>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "4px", border: "1px solid #e2e8f0" }}>
                        <button
                            className={`tab-btn-modern ${sortOrder === "desc" ? "active" : ""}`}
                            style={{ padding: "8px 16px", fontSize: "0.85rem", height: "auto", borderRadius: "8px", borderBottom: "none" }}
                            onClick={() => setSortOrder("desc")}
                        >
                            Más nuevos arriba
                        </button>
                        <button
                            className={`tab-btn-modern ${sortOrder === "asc" ? "active" : ""}`}
                            style={{ padding: "8px 16px", fontSize: "0.85rem", height: "auto", borderRadius: "8px", borderBottom: "none" }}
                            onClick={() => setSortOrder("asc")}
                        >
                            Más viejos arriba
                        </button>
                    </div>
                    <button className="btn-secondary" onClick={fetchAll} style={{ padding: "10px 20px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>Actualizar</button>
                    <button onClick={() => { setMovimientoEditar(null); setModalOpen(true); }} className="btn-primary" style={{ padding: "10px 20px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "700", marginLeft: "auto" }}>
                        <FiPlus /> Nuevo Movimiento
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? <div className="loading-spinner" /> : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Medio</th>
                                <th>Entidad</th>
                                <th>Referencia</th>
                                <th>Importe</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFiltered.map(m => (
                                <tr key={m.id} style={m.anulado ? { opacity: 0.6, textDecoration: 'line-through' } : {}}>
                                    <td>{formatDateLocal(m.fecha || m.createdAt)}</td>
                                    <td><span className={`status-badge ${m.tipo?.toUpperCase() === 'INGRESO' ? 'active' : 'inactive'}`}>{m.tipo}</span></td>
                                    <td>{m.medioPago?.replace(/_/g, ' ')}</td>
                                    <td style={{ fontWeight: "500", color: "var(--text)" }}>
                                        {(m.referencia?.startsWith("Pago #") || m.referencia?.startsWith("Cobro #")) && !m.anulado ? (
                                            <span 
                                                onClick={() => handleRefClick(m.referencia, m.referencia.startsWith("Pago #") ? 'compras' : 'ctacte')}
                                                style={{ color: "var(--primary)", textDecoration: "underline", cursor: "pointer" }}
                                                title="Ver perfil / cuenta corriente"
                                            >
                                                {m.entidad || "-"}
                                            </span>
                                        ) : (
                                            m.entidad || "-"
                                        )}
                                    </td>
                                    <td>
                                        {(m.referencia?.startsWith("Pago #") || m.referencia?.startsWith("Cobro #")) && !m.anulado ? (
                                            <span 
                                                onClick={() => handleRefClick(m.referencia, null)}
                                                style={{ color: "#2563eb", textDecoration: "underline", cursor: "pointer", fontWeight: "600" }}
                                                title={m.referencia.startsWith("Pago #") ? "Ir a Cuenta Corriente del proveedor" : "Ir a Ventas y Remitos del cliente"}
                                            >
                                                {m.referencia}
                                            </span>
                                        ) : (
                                            m.referencia || "-"
                                        )}
                                    </td>
                                    <td className={m.tipo?.toUpperCase() === 'INGRESO' ? 'highlight' : 'danger'}>
                                        ${m.importe.toLocaleString()}
                                        {m.importeUSD && (
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "500", marginTop: "2px" }}>
                                                (= US$ {m.importeUSD.toLocaleString()})
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{cleanDescription(m.descripcion, m.entidad)}</td>
                                    <td>
                                        {!m.anulado && (
                                            <div style={{ display: "flex", gap: "5px" }}>
                                                <button onClick={() => { setMovimientoEditar(m); setModalOpen(true); }} className="icon-btn edit" title="Editar"><FiEdit2 /></button>
                                                <button onClick={() => handleAnular(m.id)} className="icon-btn delete" title="Anular"><FiTrash2 /></button>
                                            </div>
                                        )}
                                        {m.anulado && <span style={{ fontSize: "0.7rem", color: "var(--danger)", fontWeight: "bold" }}>ELIMINADO</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modalOpen && <MovimientoFormModal onClose={() => setModalOpen(false)} onSaved={handleSaved} movimientoEditar={movimientoEditar} />}
        </div>
    );
}
