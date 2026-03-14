import React, { useEffect, useState, useCallback } from "react";
import { FiDollarSign, FiClock, FiCheckCircle, FiTrash2 } from "react-icons/fi";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_PAGOS = "/api/pagos-proveedor";

const formatMedioPago = (medio) => {
    if (!medio) return "Desconocido";
    return medio.replace(/_/g, " ").replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
};

export default function ProveedorCtaCteSection({ proveedorId, refreshKey }) {
    const [saldo, setSaldo] = useState(0);
    const [historial, setHistorial] = useState([]);

    const fetchCtaCte = useCallback(async () => {
        try {
            const [resDeuda, resHist] = await Promise.all([
                apiFetch(`${API_PAGOS}/proveedor/${proveedorId}/deuda`).catch(() => null),
                apiFetch(`${API_PAGOS}/proveedor/${proveedorId}`).catch(() => null)
            ]);

            if (resDeuda?.ok) {
                const data = await resDeuda.json();
                setSaldo(data.deuda || 0);
            }
            if (resHist?.ok) {
                setHistorial(await resHist.json() || []);
            }
        } catch (e) {
            console.error(e);
        }
    }, [proveedorId]);

    const handleAnularPago = async (pagoId) => {
        if (!window.confirm("¿Estás seguro de anular este pago? Se repondrá la deuda y se anulará el movimiento en tesorería.")) return;

        try {
            const res = await apiFetch(`${API_PAGOS}/${pagoId}/anular`, { method: "DELETE" });
            if (res.ok) {
                fetchCtaCte();
            } else {
                const err = await res.json();
                alert("Error: " + (err.error || "No se pudo anular el pago"));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
    };

    useEffect(() => {
        if (proveedorId) fetchCtaCte();
    }, [proveedorId, refreshKey, fetchCtaCte]);

    return (
        <div className="ctacte-section">
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className={`stat-icon out-of-stock`}><FiDollarSign /></div>
                    <div className="stat-info">
                        <h3>${saldo.toLocaleString()}</h3>
                        <p>Deuda Total con Proveedor</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon info"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{historial.length}</h3>
                        <p>Pagos a Proveedor</p>
                    </div>
                </div>
            </div>

            <h3>Historial de Pagos</h3>
            <div className="table-container">
                {historial.length === 0 ? (
                    <div className="empty-state">
                        <FiCheckCircle size={40} />
                        <h3>Sin pagos registrados</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Concepto</th>
                                <th>Importe Pagado</th>
                                <th style={{ width: "80px", textAlign: "right" }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map(p => (
                                <tr key={p.id}>
                                    <td>{formatDateLocal(p.fecha)}</td>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <span>{p.observaciones || "Pago registrado"}</span>
                                            <div style={{ position: "relative", display: "inline-block", width: "fit-content" }} className="payment-method-tooltip">
                                                <span className="status-badge active" style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#e0f2fe", color: "#0369a1" }}>
                                                    {formatMedioPago(p.medio)}
                                                </span>
                                                {(p.medio === "CHEQUE" || p.medio === "CHEQUE_ELECTRONICO") && (
                                                    <div className="tooltip-content" style={{
                                                        position: "absolute",
                                                        bottom: "100%",
                                                        left: "0",
                                                        marginBottom: "8px",
                                                        padding: "10px 14px",
                                                        background: "#1e293b",
                                                        color: "white",
                                                        borderRadius: "8px",
                                                        fontSize: "0.75rem",
                                                        whiteSpace: "nowrap",
                                                        zIndex: 10,
                                                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                                        display: "none",
                                                        pointerEvents: "none",
                                                        lineHeight: "1.5"
                                                    }}>
                                                        <div style={{ fontWeight: "700", marginBottom: "4px", borderBottom: "1px solid #334155", paddingBottom: "4px" }}>Detalles del Cheque</div>
                                                        <div><span style={{ color: "#cbd5e1" }}>Banco:</span> {p.banco || "-"}</div>
                                                        <div><span style={{ color: "#cbd5e1" }}>Número:</span> {p.numeroCheque || "-"}</div>
                                                        <div><span style={{ color: "#cbd5e1" }}>Librador:</span> {p.librador || "-"}</div>
                                                        <div><span style={{ color: "#cbd5e1" }}>Vencimiento:</span> {p.fechaVenc ? formatDateLocal(p.fechaVenc) : "-"}</div>
                                                        <div style={{
                                                            position: "absolute",
                                                            top: "100%",
                                                            left: "15px",
                                                            borderWidth: "5px",
                                                            borderStyle: "solid",
                                                            borderColor: "#1e293b transparent transparent transparent",
                                                        }} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="price-cell" style={{ color: p.anulado ? "#94a3b8" : "#ef4444", textDecoration: p.anulado ? "line-through" : "none" }}>
                                        - ${p.importe?.toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {!p.anulado && (
                                            <button
                                                className="btn-modern secondary"
                                                style={{ padding: "4px 8px", color: "var(--danger)", background: "#fef2f2" }}
                                                title="Anular Pago"
                                                onClick={() => handleAnularPago(p.id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <style>{`
                .payment-method-tooltip:hover .tooltip-content {
                    display: block !important;
                }
            `}</style>
        </div>
    );
}
