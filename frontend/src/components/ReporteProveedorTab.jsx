import React, { useState, useEffect, useCallback } from "react";
import { FiDownload, FiRefreshCw, FiInfo, FiFilter, FiTrendingUp, FiTrendingDown, FiPieChart, FiDollarSign, FiChevronDown, FiChevronUp, FiPackage, FiTrash2, FiPrinter } from "react-icons/fi";
import { apiFetch } from "../utils/api";

const API_PROVEEDORES = "/api/proveedores";

const formatMedioPago = (medio) => {
    if (!medio) return "Desconocido";
    return medio.replace(/_/g, " ").replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
};

export default function ReporteProveedorTab({ proveedorId, refreshKey }) {
    const [desde, setDesde] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedBlocks, setExpandedBlocks] = useState(new Set());

    const toggleBlock = (idx) => {
        const newExpanded = new Set(expandedBlocks);
        if (newExpanded.has(idx)) newExpanded.delete(idx);
        else newExpanded.add(idx);
        setExpandedBlocks(newExpanded);
    };

    const downloadOrdenPago = async (pagoId) => {
        try {
            const res = await apiFetch(`/api/pagos-proveedor/${pagoId}/orden-pago/pdf`);
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

    const descargarPdf = async () => {
        try {
            const res = await apiFetch(`${API_PROVEEDORES}/${proveedorId}/reporte-cuenta-corriente?desde=${desde}&hasta=${hasta}&format=pdf`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `reporte_proveedor_${proveedorId}.pdf`;
            a.click();
        } catch (err) { console.error(err); }
    };

    const fetchReporte = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`${API_PROVEEDORES}/${proveedorId}/reporte-cuenta-corriente?desde=${desde}&hasta=${hasta}`);
            if (res.ok) {
                const data = await res.json();
                setReporte(data);
                setExpandedBlocks(new Set()); // Reset al actualizar
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    }, [proveedorId, desde, hasta]);

    const handleEliminarMovimiento = async (tipo, id) => {
        const confirmMsg = tipo === 'COMPRA'
            ? "¿Estás seguro de eliminar esta compra? Se revertirá el stock de los productos involucrados."
            : "¿Estás seguro de anular este pago? Se repondrá la deuda y se anulará el movimiento en tesorería.";

        if (!window.confirm(confirmMsg)) return;

        try {
            const endpoint = tipo === 'COMPRA'
                ? `/api/compras/${id}`
                : `/api/pagos-proveedor/${id}/anular`;

            const res = await apiFetch(endpoint, { method: 'DELETE' });

            if (res.ok) {
                fetchReporte();
            } else {
                const err = await res.json();
                alert("Error: " + (err.error || "No se pudo realizar la acción"));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
    };

    useEffect(() => {
        if (proveedorId) fetchReporte();
    }, [proveedorId, refreshKey, fetchReporte]);

    // Lógica de agrupación de movimientos
    const getGroupedMovimientos = () => {
        if (!reporte || !reporte.movimientos) return [];
        const groups = [];
        let currentGroup = null;

        reporte.movimientos.forEach((m, idx) => {
            if (m.isHeader) {
                currentGroup = { ...m, items: [], blockIndex: idx };
                groups.push(currentGroup);
            } else {
                if (currentGroup) {
                    currentGroup.items.push(m);
                } else {
                    // Caso borde: item sin header (no debería pasar)
                    groups.push({ ...m, items: [], blockIndex: idx });
                }
            }
        });
        return groups;
    };

    const groupedMovs = getGroupedMovimientos();

    return (
        <div className="reporte-tab" style={{ padding: "1rem" }}>
            <div className="filter-bar-modern" style={{
                display: "flex",
                gap: "1.5rem",
                alignItems: "flex-end",
                marginBottom: "2.5rem",
                background: "white",
                padding: "1.5rem 2rem",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
            }}>
                <div style={{ marginRight: "auto" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
                        <FiFilter /> Filtros de Período
                    </h4>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <div className="input-group-modern">
                            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", fontWeight: "600", color: "var(--muted)" }}>Desde</label>
                            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", outline: "none" }} />
                        </div>
                        <div className="input-group-modern">
                            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.8rem", fontWeight: "600", color: "var(--muted)" }}>Hasta</label>
                            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", outline: "none" }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                    <button className="btn-modern secondary" onClick={fetchReporte} disabled={loading} style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
                        <FiRefreshCw className={loading ? "spin" : ""} /> Actualizar
                    </button>
                    <button className="btn-modern success" onClick={descargarPdf} disabled={!reporte}>
                        <FiDownload /> Descargar PDF
                    </button>
                </div>
            </div>

            {reporte && (
                <>
                    <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
                        <div className="stat-card" style={{ padding: "1.25rem", borderLeft: "4px solid #ef4444" }}>
                            <div className="stat-icon" style={{ background: "#fef2f2", color: "#ef4444" }}><FiTrendingUp /></div>
                            <div className="stat-info">
                                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Total Compras (+)</p>
                                <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#ef4444" }}>${(reporte.totalComprasARS || 0).toLocaleString()}</h3>
                                {reporte.totalComprasUSD > 0 && (
                                    <h4 style={{ margin: 0, fontSize: "1rem", color: "#ef4444", opacity: 0.8 }}>U$D {(reporte.totalComprasUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                                )}
                            </div>
                        </div>
                        <div className="stat-card" style={{ padding: "1.25rem", borderLeft: "4px solid #10b981" }}>
                            <div className="stat-icon" style={{ background: "#ecfdf5", color: "#10b981" }}><FiTrendingDown /></div>
                            <div className="stat-info">
                                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Total Pagos (-)</p>
                                <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#10b981" }}>${(reporte.totalPagosARS || 0).toLocaleString()}</h3>
                                {reporte.totalPagosUSD > 0 && (
                                    <h4 style={{ margin: 0, fontSize: "1rem", color: "#10b981", opacity: 0.8 }}>U$D {(reporte.totalPagosUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                                )}
                            </div>
                        </div>
                        <div className="stat-card highlight" style={{ padding: "1.25rem", borderLeft: "4px solid #059669", background: "linear-gradient(to right, #f0fdf4, white)" }}>
                            <div className="stat-icon" style={{ background: "#10b981", color: "white" }}><FiDollarSign /></div>
                            <div className="stat-info">
                                <p style={{ margin: 0, fontSize: "0.8rem", color: "#059669", fontWeight: "600" }}>Saldo Final</p>
                                <h3 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "800", color: "#047857" }}>${(reporte.saldoFinalARS || 0).toLocaleString()}</h3>
                                {(reporte.saldoFinalUSD > 0 || reporte.saldoFinalUSD < 0) && (
                                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#059669" }}>U$D {(reporte.saldoFinalUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="table-container-modern shadow-soft">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "120px" }}>Fecha</th>
                                    <th style={{ width: "150px" }}>Documento</th>
                                    <th>Detalle / Concepto</th>
                                    <th style={{ textAlign: "right" }}>Debe</th>
                                    <th style={{ textAlign: "right" }}>Haber</th>
                                    <th style={{ textAlign: "right" }}>Saldo</th>
                                    <th style={{ width: "100px", textAlign: "center" }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedMovs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                                            <FiInfo size={30} style={{ marginBottom: "1rem", opacity: 0.5 }} /><br />
                                            No hay movimientos registrados en este período.
                                        </td>
                                    </tr>
                                ) : (
                                    groupedMovs.map((g, idx) => (
                                        <React.Fragment key={g.blockIndex}>
                                            <tr className={expandedBlocks.has(g.blockIndex) ? "expanded-parent" : ""}
                                                style={{ background: g.isHeader ? "#f8fafc" : "transparent" }}>
                                                <td style={{ fontWeight: "500" }}>{g.fecha}</td>
                                                <td>
                                                    <span className="sku-badge" style={{ fontSize: "0.75rem" }}>
                                                        {g.numeroDocumento}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: g.isHeader ? "600" : "400" }}>
                                                    {g.tipoOriginal === 'PAGO' ? (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                            <span>{g.descripcion}</span>
                                                            <div style={{ position: "relative", display: "inline-block", width: "fit-content" }} className="payment-method-tooltip">
                                                                <span className="status-badge active" style={{ fontSize: "0.7rem", padding: "2px 6px", background: "#e0f2fe", color: "#0369a1" }}>
                                                                    {formatMedioPago(g.medio)}
                                                                </span>
                                                                {(g.medio === "CHEQUE" || g.medio === "CHEQUE_ELECTRONICO") && (
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
                                                                        lineHeight: "1.5",
                                                                        fontWeight: "normal"
                                                                    }}>
                                                                        <div style={{ fontWeight: "700", marginBottom: "4px", borderBottom: "1px solid #334155", paddingBottom: "4px" }}>Detalles del Cheque</div>
                                                                        <div><span style={{ color: "#cbd5e1" }}>Banco:</span> {g.banco || "-"}</div>
                                                                        <div><span style={{ color: "#cbd5e1" }}>Número:</span> {g.numeroCheque || "-"}</div>
                                                                        <div><span style={{ color: "#cbd5e1" }}>Vencimiento:</span> {g.fechaVenc || "-"}</div>
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
                                                    ) : (
                                                        g.descripcion
                                                    )}
                                                </td>
                                                <td style={{ textAlign: "right", color: "var(--danger)" }}>
                                                    {g.debe > 0 ? (g.moneda === "USD" ? `U$D ${(g.debe || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `$${(g.debe || 0).toLocaleString()}`) : "-"}
                                                </td>
                                                <td style={{ textAlign: "right", color: "var(--success)" }}>
                                                    {g.haber > 0 ? (g.moneda === "USD" ? `U$D ${(g.haber || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `$${(g.haber || 0).toLocaleString()}`) : "-"}
                                                </td>
                                                <td style={{ textAlign: "right", fontWeight: "700" }}>
                                                    {g.moneda === "USD" ? `U$D ` : `$ `}{(g.saldo || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                        {g.items && g.items.length > 0 && (
                                                            <button
                                                                className="btn-modern secondary"
                                                                style={{ padding: "4px 8px", fontSize: "0.75rem", gap: "4px", minWidth: "80px" }}
                                                                onClick={() => toggleBlock(g.blockIndex)}
                                                            >
                                                                {expandedBlocks.has(g.blockIndex) ? <FiChevronUp /> : <FiChevronDown />}
                                                                {g.items.length} ítems
                                                            </button>
                                                        )}
                                                        {g.tipoOriginal === 'PAGO' && (
                                                            <button
                                                                className="btn-modern secondary"
                                                                style={{ 
                                                                    padding: "4px 8px", 
                                                                    fontSize: "0.75rem", 
                                                                    color: "#8b5cf6", 
                                                                    background: "#f5f3ff",
                                                                    border: "1px solid #ddd6fe" 
                                                                }}
                                                                title="Descargar Orden de Pago"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    downloadOrdenPago(g.idOriginal);
                                                                }}
                                                            >
                                                                <FiDownload /> OP
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-modern secondary"
                                                            style={{
                                                                padding: "4px 8px",
                                                                fontSize: "0.75rem",
                                                                color: "var(--danger)",
                                                                background: "#fef2f2",
                                                                border: "1px solid #fee2e2"
                                                            }}
                                                            title={g.tipoOriginal === 'COMPRA' ? "Eliminar Compra" : "Anular Pago"}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEliminarMovimiento(g.tipoOriginal, g.idOriginal);
                                                            }}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedBlocks.has(g.blockIndex) && g.items.length > 0 && (
                                                <tr>
                                                    <td colSpan="7" style={{ padding: "0" }}>
                                                        <div style={{
                                                            background: "#f0f7ff",
                                                            padding: "20px",
                                                            margin: "10px 20px 20px 40px",
                                                            borderRadius: "12px",
                                                            border: "1px solid #dbeafe",
                                                            borderLeft: "4px solid var(--primary)",
                                                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                                                        }}>
                                                            <h5 style={{ margin: "0 0 15px 0", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: "700" }}>
                                                                <FiPackage /> Detalle de Productos de la Compra
                                                            </h5>
                                                            <table className="modern-table mini" style={{ fontSize: "0.8rem", marginBottom: "0", background: "white" }}>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Producto</th>
                                                                        <th style={{ textAlign: "center", width: "80px" }}>Cant.</th>
                                                                        <th style={{ textAlign: "right", width: "120px" }}>Precio Unit.</th>
                                                                        <th style={{ textAlign: "right", width: "120px" }}>Subtotal</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {g.items.map((it, iIdx) => (
                                                                        <tr key={iIdx}>
                                                                            <td>{it.descripcion}</td>
                                                                            <td style={{ textAlign: "center" }}>{it.cantidad}</td>
                                                                            <td style={{ textAlign: "right" }}>
                                                                                {g.moneda === "USD" ? "U$D " : "$"}{(it.precioUnitario || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                            </td>
                                                                            <td style={{ textAlign: "right", fontWeight: "600" }}>
                                                                                {g.moneda === "USD" ? "U$D " : "$"}{(it.debe || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            <style>{`
                .payment-method-tooltip:hover .tooltip-content {
                    display: block !important;
                }
            `}</style>
        </div>
    );
}
