import React, { useEffect, useState, useCallback } from "react";
import { FiDollarSign, FiClock, FiCheckCircle, FiTrash2, FiEdit2, FiDownload } from "react-icons/fi";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_PAGOS = "/api/pagos-proveedor";

const formatMedioPago = (medio) => {
    if (!medio) return "Desconocido";
    return medio.replace(/_/g, " ").replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
};

export default function ProveedorCtaCteSection({ proveedorId, refreshKey, onEditPago }) {
    const [saldoARS, setSaldoARS] = useState(0);
    const [saldoUSD, setSaldoUSD] = useState(0);
    const [historial, setHistorial] = useState([]);

    const downloadOrdenPago = async (pagoId) => {
        try {
            const res = await apiFetch(`${API_PAGOS}/${pagoId}/orden-pago/pdf`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `orden_pago_${pagoId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Error al descargar la orden de pago");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    };

    const fetchCtaCte = useCallback(async () => {
        try {
            const [resDeuda, resPagos, resNotas] = await Promise.all([
                apiFetch(`${API_PAGOS}/proveedor/${proveedorId}/deuda`).catch(() => null),
                apiFetch(`${API_PAGOS}/proveedor/${proveedorId}`).catch(() => null),
                apiFetch(`/api/notas-proveedor/proveedor/${proveedorId}`).catch(() => null)
            ]);

            if (resDeuda?.ok) {
                const data = await resDeuda.json();
                setSaldoARS(data.deudaARS || 0);
                setSaldoUSD(data.deudaUSD || 0);
            }

            let movs = [];
            if (resPagos?.ok) {
                const pagos = await resPagos.json() || [];
                movs = [...movs, ...pagos.map(p => ({ ...p, tipoMov: "PAGO" }))];
            }
            if (resNotas?.ok) {
                const notas = await resNotas.json() || [];
                movs = [...movs, ...notas.map(n => ({ ...n, tipoMov: "NOTA_CREDITO" }))];
            }

            // Ordenar por fecha descendente
            movs.sort((a, b) => {
                const dateA = new Date(a.fecha);
                const dateB = new Date(b.fecha);
                if (dateB.getTime() !== dateA.getTime()) {
                    return dateB - dateA;
                }
                return (b.id || 0) - (a.id || 0);
            });
            setHistorial(movs);
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

    const handleAnularNota = async (notaId) => {
        if (!window.confirm("¿Estás seguro de anular esta nota de crédito? La deuda volverá a su estado anterior.")) return;

        try {
            const res = await apiFetch(`/api/notas-proveedor/${notaId}/anular`, { method: "DELETE" });
            if (res.ok) {
                fetchCtaCte();
            } else {
                const err = await res.json();
                alert("Error: " + (err.error || "No se pudo anular la nota"));
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
            <div className="stats-grid" style={{ marginBottom: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <div className="stat-card">
                    <div className="stat-icon out-of-stock"><FiDollarSign /></div>
                    <div className="stat-info">
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <h3 style={{ margin: 0 }}>
                                ${saldoARS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            {(saldoUSD > 0 || saldoUSD < 0) && (
                                <h3 style={{ color: "#059669", fontSize: "1.1rem", margin: 0 }}>
                                    U$D {saldoUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            )}
                        </div>
                        <p style={{ marginTop: "5px" }}>Deuda Total Pendiente</p>
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
                                <th style={{ width: "200px", textAlign: "center" }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map(p => (
                                <tr key={p.id}>
                                    <td>{formatDateLocal(p.fecha)}</td>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span>{p.tipoMov === "NOTA_CREDITO" ? (p.motivo || "Ajuste Financiero") : (p.observaciones || "Pago registrado")}</span>
                                                {(p.monedaPago === "USD" || p.moneda === "USD") && (
                                                    <span style={{
                                                        background: "#059669",
                                                        color: "white",
                                                        fontSize: "0.65rem",
                                                        fontWeight: "700",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        letterSpacing: "0.03em",
                                                        flexShrink: 0
                                                    }}>{(p.monedaPago || "ARS") === "USD" ? "Pagó U$D" : "Deuda U$D"}</span>
                                                )}
                                            </div>
                                            <div style={{ position: "relative", display: "inline-block", width: "fit-content" }} className="payment-method-tooltip">
                                                {p.tipoMov === "NOTA_CREDITO" ? (
                                                    <span className="status-badge" style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#fef3c7", color: "#d97706" }}>
                                                        NOTA CRÉD.
                                                    </span>
                                                ) : (
                                                    <span className="status-badge active" style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#e0f2fe", color: "#0369a1" }}>
                                                        {formatMedioPago(p.medio)}
                                                    </span>
                                                )}
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
                                    <td className="price-cell" style={{ color: p.anulado ? "#94a3b8" : "#ef4444", textDecoration: p.anulado ? "line-through" : "none", verticalAlign: "middle" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                                            {(() => {
                                                const mp = p.monedaPago || "ARS";
                                                const md = p.moneda || "ARS";
                                                const fmtARS = (v) => "$" + (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                const fmtUSD = (v) => "U$D " + (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                                                // Primary: what the user physically paid
                                                let primaryText = "";
                                                if (p.tipoMov === "NOTA_CREDITO") {
                                                    primaryText = `- ${md === "USD" ? fmtUSD(p.monto) : fmtARS(p.monto)}`;
                                                } else {
                                                    primaryText = mp === "USD" ? `- ${fmtUSD(p.importeDolares)}` : `- ${fmtARS(p.importe)}`;
                                                }

                                                // Secondary: conversion info
                                                let secondaryText = null;
                                                if (p.tipoMov !== "NOTA_CREDITO") {
                                                    if (mp === "USD" && md === "USD") {
                                                        secondaryText = `Equiv: ${fmtARS(p.importe)} (TC: ${p.tipoCambio})`;
                                                    } else if (mp === "ARS" && md === "USD" && p.importeDolares) {
                                                        secondaryText = `Desc: ${fmtUSD(p.importeDolares)} (TC: ${p.tipoCambio})`;
                                                    } else if (mp === "USD" && md === "ARS") {
                                                        secondaryText = `Desc: ${fmtARS(p.importe)} (TC: ${p.tipoCambio})`;
                                                    }
                                                }

                                                return (
                                                    <>
                                                        <span>{primaryText}</span>
                                                        {secondaryText && (
                                                            <span style={{ fontSize: "0.8rem", color: "#64748b", textDecoration: "none" }}>
                                                                {secondaryText}
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "center", verticalAlign: "middle", width: "200px" }}>
                                        {(!p.anulado && p.estado !== "ANULADA") && (
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", width: "100%" }}>
                                                {p.tipoMov === "PAGO" && (
                                                    <>
                                                        <button
                                                            className="btn-modern secondary"
                                                            style={{
                                                                padding: "4px 10px",
                                                                color: "#8b5cf6",
                                                                background: "#f5f3ff",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "6px",
                                                                fontSize: "0.82rem",
                                                                fontWeight: "600",
                                                                border: "1px solid #ddd6fe"
                                                            }}
                                                            title="Descargar Orden de Pago"
                                                            onClick={() => downloadOrdenPago(p.id)}
                                                        >
                                                            <FiDownload /> Orden de Pago
                                                        </button>
                                                        <button
                                                            className="icon-btn edit"
                                                            onClick={() => onEditPago && onEditPago(p)}
                                                            title="Editar Pago"
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="icon-btn danger"
                                                    onClick={() => p.tipoMov === "NOTA_CREDITO" ? handleAnularNota(p.id) : handleAnularPago(p.id)}
                                                    title={p.tipoMov === "NOTA_CREDITO" ? "Anular Nota" : "Anular Pago"}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
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
