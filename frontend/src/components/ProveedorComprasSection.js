import React, { useEffect, useState } from "react";
import { FiShoppingCart, FiChevronDown, FiChevronUp, FiPackage } from "react-icons/fi";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_COMPRAS = "/api/compras";

export default function ProveedorComprasSection({ proveedorId, refreshKey }) {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState(new Set());

    const fetchCompras = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`${API_COMPRAS}/proveedor/${proveedorId}`);
            if (res.ok) setCompras(await res.json() || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (proveedorId) fetchCompras();
    }, [proveedorId, refreshKey]);

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    return (
        <div className="compras-section">
            <div className="table-container">
                {loading ? <div className="loading-spinner" /> : (
                    compras.length === 0 ? (
                        <div className="empty-state">
                            <FiShoppingCart size={40} />
                            <h3>No hay compras registradas</h3>
                        </div>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th># ID / Nº</th>
                                    <th>Fecha</th>
                                    <th>Notas / Factura</th>
                                    <th>Total Compra</th>
                                    <th>Productos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {compras.map(c => (
                                    <React.Fragment key={c.id}>
                                        <tr className={expandedRows.has(c.id) ? "expanded-parent" : ""}>
                                            <td className="sku-cell">
                                                <span className="sku-badge" style={{ background: "var(--bg)", color: "var(--text)" }}>ID: {c.id}</span>
                                                <span className="sku-badge" style={{ marginLeft: "5px" }}>Nº {c.numero}</span>
                                            </td>
                                            <td>{formatDateLocal(c.fecha)}</td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{c.anotaciones || "-"}</td>
                                            <td className="price-cell" style={{ fontWeight: "700" }}>${c.total?.toLocaleString() || "0"}</td>
                                            <td>
                                                <button
                                                    className="btn-modern secondary"
                                                    style={{ padding: "4px 8px", fontSize: "0.75rem", gap: "4px" }}
                                                    onClick={() => toggleRow(c.id)}
                                                >
                                                    {expandedRows.has(c.id) ? <FiChevronUp /> : <FiChevronDown />}
                                                    {c.items?.length || 0} ítems
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRows.has(c.id) && (
                                            <tr className="expanded-row">
                                                <td colSpan="5" style={{ padding: "5px 0" }}>
                                                    <div style={{
                                                        background: "#f0f7ff",
                                                        padding: "20px",
                                                        margin: "5px 20px 20px 40px",
                                                        borderRadius: "12px",
                                                        border: "1px solid #dbeafe",
                                                        borderLeft: "4px solid var(--primary)",
                                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
                                                    }}>
                                                        <h5 style={{ margin: "0 0 15px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", fontWeight: "700" }}>
                                                            <FiPackage /> Detalle de Productos de la Compra
                                                        </h5>
                                                        <table className="modern-table mini" style={{ fontSize: "0.8rem", marginBottom: "0" }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>Producto</th>
                                                                    <th style={{ textAlign: "center" }}>Cant.</th>
                                                                    <th style={{ textAlign: "right" }}>Precio Unit.</th>
                                                                    <th style={{ textAlign: "right" }}>Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {c.items && c.items.map((it, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{it.producto?.nombre || "Producto desconocido"}</td>
                                                                        <td style={{ textAlign: "center" }}>{it.cantidad}</td>
                                                                        <td style={{ textAlign: "right" }}>${it.precioUnitario?.toLocaleString()}</td>
                                                                        <td style={{ textAlign: "right" }}>${it.subtotal?.toLocaleString()}</td>
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
                    )
                )}
            </div>
        </div>
    );
}
