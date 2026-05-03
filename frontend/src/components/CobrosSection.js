import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiDollarSign, FiTag } from "react-icons/fi";
import CobroFormModal from "./CobroFormModal";
import ValorizarSection from "./ValorizarSection";
import { apiFetch } from "../utils/api";

const API_COBROS = "/api/cobros";
const API_REMITOS = "/api/remitos";

export default function CobrosSection({ onUpdate }) {
    const [remitos, setRemitos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cobrandoRemito, setCobrandoRemito] = useState(null);
    const [revalorizandoRemito, setRevalorizandoRemito] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const navigate = useNavigate();

    const handleClientClick = (clienteId) => {
        if (!clienteId) return;
        navigate('/clientes', { 
            state: { 
                autoOpenClienteId: clienteId, 
                autoOpenTab: 'remitos',
                returnTo: '/remitos',
                returnLabel: 'Ventas y Remitos'
            } 
        });
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const fetchValorizados = async () => {
        try {
            const res = await apiFetch(`${API_REMITOS}?estado=VALORIZADO`);
            const data = await res.json();
            setRemitos(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchValorizados(); }, []);

    const handleMarcarCobrado = async (id) => {
        // Esta función podría quedar para casos legacy o simple bypass, 
        // pero ahora preferiremos el modal.
    };

    return (
        <div className="cobros-section">
            <div className="table-container">
                {remitos.length === 0 ? (
                    <div className="empty-state">
                        <FiCheckCircle size={40} />
                        <h3>Sin cobros pendientes</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Nº Remito</th>
                                <th>Cliente</th>
                                <th>Ítems</th>
                                <th>Total</th>
                                <th>Dólar</th>
                                <th style={{ textAlign: "right", width: "1%", whiteSpace: "nowrap", paddingRight: "1.5rem" }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remitos.map(r => (
                                <React.Fragment key={r.id}>
                                    <tr className={expandedRows.has(r.id) ? "expanded-parent" : ""}>
                                        <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                                        <td>
                                            <span 
                                                onClick={() => handleClientClick(r.cliente?.id)}
                                                style={{ color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontWeight: "500" }}
                                                title="Ver cuenta del cliente"
                                            >
                                                {r.clienteNombre}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-modern secondary"
                                                style={{ padding: "4px 8px", fontSize: "0.75rem", gap: "4px", display: "flex", alignItems: "center" }}
                                                onClick={() => toggleRow(r.id)}
                                            >
                                                {expandedRows.has(r.id) ? "▲" : "▼"} {r.items?.length || 0} ítems
                                            </button>
                                        </td>
                                        <td className="price-cell">${r.total?.toLocaleString()}</td>
                                        <td>{r.cotizacionDolar ? `$${r.cotizacionDolar}` : "-"}</td>
                                        <td style={{ textAlign: "right", width: "1%", whiteSpace: "nowrap", paddingRight: "1.5rem" }}>
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                <button
                                                    className="icon-btn edit"
                                                    style={{ color: "#2563eb", background: "#dbeafe", padding: "6px" }}
                                                    title="Re-valorizar"
                                                    onClick={() => setRevalorizandoRemito(r)}
                                                >
                                                    <FiTag />
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    style={{ background: "#10b981", border: "none", padding: "6px 16px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                                    onClick={() => setCobrandoRemito(r)}
                                                >
                                                    <FiDollarSign size={14} /> Cobrar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRows.has(r.id) && (
                                        <tr className="expanded-row">
                                            <td colSpan="6" style={{ padding: "0" }}>
                                                <div className="expanded-content-wrapper">
                                                    <table className="modern-table mini">
                                                        <thead>
                                                            <tr>
                                                                <th>Producto</th>
                                                                <th style={{ textAlign: "center" }}>Cantidad</th>
                                                                <th style={{ textAlign: "right" }}>Precio Unit.</th>
                                                                <th style={{ textAlign: "right" }}>Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {r.items?.map((it, idx) => (
                                                                <tr key={idx}>
                                                                    <td>{it.producto?.nombre || "Producto desconocido"}</td>
                                                                    <td style={{ textAlign: "center" }}>{it.cantidad}</td>
                                                                    <td style={{ textAlign: "right" }}>{it.precioUnitario ? `$${it.precioUnitario.toLocaleString()}` : "-"}</td>
                                                                    <td style={{ textAlign: "right" }}>{it.precioUnitario ? `$${(it.cantidad * it.precioUnitario).toLocaleString()}` : "-"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {cobrandoRemito && (
                <CobroFormModal
                    clienteIdPreselected={cobrandoRemito.cliente?.id}
                    remitoId={cobrandoRemito.id}
                    montoSugerido={cobrandoRemito.total}
                    onClose={() => setCobrandoRemito(null)}
                    onSaved={() => {
                        setCobrandoRemito(null);
                        onUpdate();
                        fetchValorizados();
                    }}
                />
            )}

            {revalorizandoRemito && (
                <ValorizarSection
                    initialRemito={revalorizandoRemito}
                    onUpdate={() => {
                        setRevalorizandoRemito(null);
                        onUpdate();
                        fetchValorizados();
                    }}
                    onClose={() => setRevalorizandoRemito(null)}
                />
            )}
        </div>
    );
}
