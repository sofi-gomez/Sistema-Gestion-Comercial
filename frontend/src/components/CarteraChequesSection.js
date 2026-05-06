import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiClock, FiAlertCircle, FiSearch, FiFileText, FiFilter, FiTrendingUp } from "react-icons/fi";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_BASE = "/api/tesoreria";

export default function CarteraChequesSection() {
    const [cheques, setCheques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [checkFilter, setCheckFilter] = useState("all"); // "all", "cobrados", "listos", "urgentes"
    const [sortOrder, setSortOrder] = useState("desc"); // "asc" o "desc"
    const [procesandoId, setProcesandoId] = useState(null);
    const navigate = useNavigate();

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
                            autoOpenTab: targetTab || 'ctacte',
                            returnTo: '/tesoreria',
                            returnLabel: 'Cheques'
                        } });
                    }
                }
            } catch (err) { console.error(err); }
        } else if (refStr.startsWith("Cobro #")) {
            const cobroId = refStr.replace("Cobro #", "");
            try {
                const res = await apiFetch(`/api/cobros/${cobroId}`);
                if (res.ok) {
                    const cobro = await res.json();
                    if (cobro && cobro.cliente && cobro.cliente.id) {
                        navigate('/clientes', { state: { 
                            autoOpenClienteId: cobro.cliente.id, 
                            autoOpenTab: targetTab || 'remitos',
                            returnTo: '/tesoreria',
                            returnLabel: 'Cheques'
                        } });
                    }
                }
            } catch (err) { console.error(err); }
        }
    };

    const fetchCheques = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`${API_BASE}`);
            const data = await res.json();
            // Filtrar solo medios de pago CHEQUE o CHEQUE_ELECTRONICO que NO estén anulados
            // Incluimos INGRESOS (cheques de clientes) y EGRESOS que tengan número (cheques emitidos a proveedores)
            // Esto excluye las reversiones contables de rechazos que son EGRESOS sin número.
            const filtrados = (data || []).filter(m =>
                (m.medioPago === 'CHEQUE' || m.medioPago === 'CHEQUE_ELECTRONICO') && 
                !m.anulado &&
                (m.tipo === 'INGRESO' || (m.tipo === 'EGRESO' && m.numeroCheque))
            );
            setCheques(filtrados);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCheques(); }, []);

    // Helper functions para lógica de fechas
    const isReadyToCollect = (fechaCobro) => {
        if (!fechaCobro) return true;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const parts = fechaCobro.split('T')[0].split('-');
        const fecha = new Date(parts[0], parts[1] - 1, parts[2]);
        return fecha <= hoy;
    };

    const isExpiringSoon = (fechaVencimiento) => {
        if (!fechaVencimiento) return false;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const parts = fechaVencimiento.split('T')[0].split('-');
        const fecha = new Date(parts[0], parts[1] - 1, parts[2]);
        const diff = (fecha - hoy) / (1000 * 60 * 60 * 24);
        return diff <= 7; // Umbral de urgencia: 7 días o ya vencido
    };

    const handleCobrar = async (id) => {
        if (procesandoId) return;
        setProcesandoId(id);
        try {
            const res = await apiFetch(`${API_BASE}/${id}/cobrar`, { method: "PUT" });
            if (res.ok) fetchCheques();
        } catch (err) { 
            alert("Error al marcar como cobrado"); 
        } finally {
            setProcesandoId(null);
        }
    };

    const handleRechazar = async (id) => {
        if (procesandoId) return;
        const gastos = prompt("¿Desea marcar este cheque como RECHAZADO? Se generará una Nota de Débito automática al cliente.\n\nIngrese gastos bancarios si aplica:", "0");
        if (gastos === null) return;
        
        setProcesandoId(id);
        try {
            const res = await apiFetch(`${API_BASE}/${id}/rechazar`, { 
                method: "PUT",
                body: JSON.stringify({ gastosBancarios: parseFloat(gastos) || 0 })
            });
            if (res.ok) {
                alert("Cheque rechazado con éxito. Se generó la Nota de Débito correspondiente.");
                fetchCheques();
            } else {
                alert("Error al rechazar cheque");
            }
        } catch (err) { 
            alert("Error de conexión"); 
        } finally {
            setProcesandoId(null);
        }
    };

    const filtered = cheques.filter(c => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = term === "" ||
            (c.banco?.toLowerCase() || "").includes(term) ||
            (c.numeroCheque?.toLowerCase() || "").includes(term) ||
            (c.librador?.toLowerCase() || "").includes(term);

        let matchesCard = true;
        if (checkFilter === "cobrados") {
            matchesCard = c.cobrado;
        } else if (checkFilter === "listos") {
            matchesCard = !c.cobrado && isReadyToCollect(c.fechaCobro);
        } else if (checkFilter === "urgentes") {
            matchesCard = !c.cobrado && isExpiringSoon(c.fechaVencimiento);
        }

        return matchesSearch && matchesCard;
    });

    const sortedAndFiltered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.fecha || a.createdAt);
        const dateB = new Date(b.fecha || b.createdAt);
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    // Cálculos para las tarjetas
    const countCobrados = cheques.filter(c => c.cobrado).length;
    const countListos = cheques.filter(c => !c.cobrado && isReadyToCollect(c.fechaCobro)).length;
    const countUrgentes = cheques.filter(c => !c.cobrado && isExpiringSoon(c.fechaVencimiento)).length;

    return (
        <div className="cartera-cheques-section">

            {/* Panel de Estadísticas / Filtros */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div
                    className={`stat-card clickable ${checkFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCheckFilter('all')}
                >
                    <div className="stat-icon total"><FiFilter /></div>
                    <div className="stat-info">
                        <h3>{cheques.length}</h3>
                        <p>Total Cheques</p>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${checkFilter === 'cobrados' ? 'active' : ''}`}
                    onClick={() => setCheckFilter('cobrados')}
                >
                    <div className="stat-icon active"><FiCheck /></div>
                    <div className="stat-info">
                        <h3>{countCobrados}</h3>
                        <p>Cobrados</p>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${checkFilter === 'listos' ? 'active' : ''}`}
                    onClick={() => setCheckFilter('listos')}
                >
                    <div className="stat-icon stock" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FiTrendingUp /></div>
                    <div className="stat-info">
                        <h3>{countListos}</h3>
                        <p>Listos p/Cobrar</p>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${checkFilter === 'urgentes' ? 'active' : ''}`}
                    onClick={() => setCheckFilter('urgentes')}
                >
                    <div className="stat-icon out-of-stock"><FiAlertCircle /></div>
                    <div className="stat-info">
                        <h3>{countUrgentes}</h3>
                        <p>Urgentes (7d)</p>
                    </div>
                </div>
            </div>

            <div className="filters-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "1.5rem" }}>
                <div className="search-box" style={{ flex: "1 1 300px", maxWidth: "450px" }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por banco, Nº o librador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
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
                    <button className="btn-secondary" onClick={fetchCheques} style={{ padding: "10px 20px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>Actualizar</button>
                </div>
            </div>

            <div className="table-container">
                {cheques.length === 0 && !loading ? (
                    <div className="empty-state">
                        <FiFileText size={40} />
                        <h3>No hay cheques en cartera</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Vencimiento</th>
                                <th>Banco</th>
                                <th>Nº Cheque</th>
                                <th>Importe</th>
                                <th>Librador</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFiltered.map(c => {
                                const parts = c.fechaVencimiento?.split('T')[0].split('-');
                                const fVenc = parts ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
                                const vencido = fVenc && fVenc < new Date();
                                return (
                                    <tr key={c.id} style={c.rechazado ? { backgroundColor: '#fff1f1', opacity: 0.9 } : {}}>
                                        <td>
                                            <span 
                                                className={`status-badge ${c.rechazado ? 'danger' : c.cobrado ? 'active' : vencido ? 'inactive' : 'warning'}`}
                                                style={c.rechazado ? { background: '#ef4444', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' } : {}}
                                            >
                                                {c.rechazado ? 'RECHAZADO' : c.cobrado ? 'Cobrado' : vencido ? 'Vencido' : 'En Cartera'}
                                            </span>
                                        </td>
                                        <td style={c.rechazado ? { color: '#94a3b8', textDecoration: 'line-through' } : {}}>{formatDateLocal(c.fechaVencimiento)}</td>
                                        <td style={c.rechazado ? { color: '#94a3b8' } : {}}>{c.banco || '-'}</td>
                                        <td className="sku-cell">
                                            <span className="sku-badge" style={c.rechazado ? { background: '#f1f5f9', color: '#94a3b8', textDecoration: 'line-through' } : {}}>
                                                #{c.numeroCheque || '-'}
                                            </span>
                                        </td>
                                        <td className="price-cell" style={{ fontWeight: 'bold', color: c.rechazado ? '#ef4444' : 'inherit', textDecoration: c.rechazado ? 'line-through' : 'none' }}>
                                            ${c.importe?.toLocaleString()}
                                        </td>
                                        <td style={c.rechazado ? { color: '#94a3b8', textDecoration: 'line-through' } : {}}>
                                            {c.referencia && !c.anulado ? (
                                                <span 
                                                    onClick={() => !c.rechazado && handleRefClick(c.referencia)}
                                                    style={{ 
                                                        color: c.rechazado ? "#94a3b8" : "var(--primary)", 
                                                        textDecoration: "underline", 
                                                        cursor: c.rechazado ? "default" : "pointer", 
                                                        fontWeight: "500" 
                                                    }}
                                                    title={c.rechazado ? "" : "Ver perfil del cliente / emisor"}
                                                >
                                                    {c.librador || "-"}
                                                </span>
                                            ) : (
                                                c.librador || "-"
                                            )}
                                        </td>
                                        <td>
                                            {!c.cobrado && !c.rechazado && (
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button 
                                                        disabled={!!procesandoId}
                                                        onClick={() => handleCobrar(c.id)} 
                                                        className="btn-secondary" 
                                                        style={{ padding: "4px 8px", fontSize: "0.8rem", background: procesandoId === c.id ? "#ccc" : "#10b981", color: "white", border: "none", cursor: procesandoId ? "not-allowed" : "pointer" }}
                                                    >
                                                        <FiCheck /> {procesandoId === c.id ? '...' : 'Cobrar'}
                                                    </button>
                                                    <button 
                                                        disabled={!!procesandoId}
                                                        onClick={() => handleRechazar(c.id)} 
                                                        className="btn-secondary" 
                                                        style={{ padding: "4px 8px", fontSize: "0.8rem", background: procesandoId === c.id ? "#ccc" : "#ef4444", color: "white", border: "none", cursor: procesandoId ? "not-allowed" : "pointer" }}
                                                    >
                                                        <FiAlertCircle /> {procesandoId === c.id ? '...' : 'Rechazar'}
                                                    </button>
                                                </div>
                                            )}
                                            {c.rechazado && (
                                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600', fontStyle: 'italic' }}>
                                                    Operación Finalizada
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
