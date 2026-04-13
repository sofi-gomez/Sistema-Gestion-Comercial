import React, { useEffect, useState } from "react";
import { FiShoppingCart, FiChevronDown, FiChevronUp, FiPackage, FiEdit, FiSearch, FiX } from "react-icons/fi";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";
import CompraFormModal from "./CompraFormModal";

const API_COMPRAS = "/api/compras";

export default function ProveedorComprasSection({ proveedorId, refreshKey, onRefresh }) {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [editingCompra, setEditingCompra] = useState(null);
    const [busqueda, setBusqueda] = useState("");

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

    const getStatusStyle = (estado) => {
        if (estado === "PENDIENTE") return { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" };
        return { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
    };

    const comprasFiltradas = compras.filter(c => {
        const q = busqueda.toLowerCase().trim();
        if (!q) return true;
        const fecha = formatDateLocal(c.fecha)?.toLowerCase() || "";
        const estado = (c.estado === "PENDIENTE" ? "sin precio" : "confirmada").toLowerCase();
        return (
            String(c.numero).includes(q) ||
            String(c.id).includes(q) ||
            fecha.includes(q) ||
            estado.includes(q) ||
            (c.anotaciones || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className="compras-section">
            {/* Buscador */}
            <div style={{ marginBottom: "1rem", position: "relative", maxWidth: "380px" }}>
                <FiSearch style={{
                    position: "absolute", left: "12px", top: "50%",
                    transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none"
                }} />
                <input
                    type="text"
                    placeholder="Buscar por Nº, fecha, estado, notas..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    style={{
                        width: "100%", padding: "9px 36px 9px 36px",
                        border: "1px solid #e2e8f0", borderRadius: "10px",
                        fontSize: "0.88rem", background: "#f8fafc",
                        color: "#1e293b", outline: "none", boxSizing: "border-box",
                        transition: "border-color 0.2s"
                    }}
                    onFocus={e => e.target.style.borderColor = "#3b82f6"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                {busqueda && (
                    <FiX
                        onClick={() => setBusqueda("")}
                        style={{
                            position: "absolute", right: "12px", top: "50%",
                            transform: "translateY(-50%)", color: "#94a3b8",
                            cursor: "pointer"
                        }}
                    />
                )}
            </div>
            <div className="table-container">
                {loading ? <div className="loading-spinner" /> : (
                    comprasFiltradas.length === 0 ? (
                        <div className="empty-state">
                            <FiShoppingCart size={40} />
                            <h3>{compras.length === 0 ? "No hay compras registradas" : "Sin resultados para la búsqueda"}</h3>
                        </div>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th># ID / Nº</th>
                                    <th>Fecha</th>
                                    <th>Estado / Notas</th>
                                    <th>Total Compra</th>
                                    <th style={{ textAlign: "center" }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comprasFiltradas.map(c => (
                                    <React.Fragment key={c.id}>
                                        <tr className={expandedRows.has(c.id) ? "expanded-parent" : ""}>
                                            <td className="sku-cell">
                                                <span className="sku-badge" style={{ background: "var(--bg)", color: "var(--text)" }}>ID: {c.id}</span>
                                                <span className="sku-badge" style={{ marginLeft: "5px" }}>Nº {c.numero}</span>
                                            </td>
                                            <td>{formatDateLocal(c.fecha)}</td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                    <span className="status-badge" style={{ 
                                                        ...getStatusStyle(c.estado), 
                                                        fontSize: "0.7rem", 
                                                        padding: "2px 6px", 
                                                        borderRadius: "4px",
                                                        width: "fit-content",
                                                        fontWeight: "bold"
                                                    }}>
                                                        {c.estado === "PENDIENTE" ? "SIN PRECIO" : "CONFIRMADA"}
                                                    </span>
                                                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{c.anotaciones || "-"}</span>
                                                </div>
                                            </td>
                                            <td className="price-cell">
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    <span style={{ fontWeight: "700" }}>${c.total?.toLocaleString() || "0"}</span>
                                                    {c.incluyeIva && <span style={{ fontSize: "0.65rem", background: "#fff7ed", color: "#c2410c", padding: "1px 4px", borderRadius: "3px", fontWeight: "bold", border: "1px solid #ffedd5", width: "fit-content" }}>IVA INCL. {c.porcentajeIva || 0}%</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                                                    <button
                                                        className="btn-modern secondary"
                                                        style={{ padding: "4px 8px", fontSize: "0.75rem", gap: "4px" }}
                                                        onClick={() => toggleRow(c.id)}
                                                    >
                                                        {expandedRows.has(c.id) ? <FiChevronUp /> : <FiChevronDown />}
                                                        {c.items?.length || 0} ítems
                                                    </button>
                                                    <button
                                                        className="btn-modern primary"
                                                        style={{ padding: "4px 8px", fontSize: "0.75rem", gap: "4px", background: "var(--accent)" }}
                                                        onClick={() => setEditingCompra(c)}
                                                    >
                                                        <FiEdit /> Editar
                                                    </button>
                                                </div>
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
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                                            <h5 style={{ margin: 0, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", fontWeight: "700" }}>
                                                                <FiPackage /> Detalle de Productos de la Compra
                                                            </h5>
                                                            {(c.incluyeIva || (c.descuentoImporte && c.descuentoImporte > 0)) && (
                                                                <div style={{ fontSize: "0.8rem", textAlign: "right", color: "var(--muted)" }}>
                                                                    <div>Subtotal bruto: <strong>${(c.subtotal || (c.total + (c.descuentoImporte || 0)))?.toLocaleString()}</strong></div>
                                                                    {c.descuentoImporte > 0 && (
                                                                        <div style={{ color: "#e11d48" }}>Descuentos: <strong>- ${(c.descuentoImporte || 0).toLocaleString()}</strong></div>
                                                                    )}
                                                                    {c.incluyeIva && (
                                                                        <div style={{ color: "#f97316" }}>IVA ({c.porcentajeIva || 0}%): <strong>+ ${(c.ivaImporte || 0).toLocaleString()}</strong></div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <table className="modern-table mini" style={{ fontSize: "0.8rem", marginBottom: "0" }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>Producto</th>
                                                                    <th style={{ textAlign: "center" }}>Cant.</th>
                                                                    <th style={{ textAlign: "right" }}>Precio Unit.</th>
                                                                    <th style={{ textAlign: "right" }}>Desc. %</th>
                                                                    <th style={{ textAlign: "right" }}>Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {c.items && c.items.map((it, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{it.producto?.nombre || "Producto desconocido"}</td>
                                                                        <td style={{ textAlign: "center" }}>{it.cantidad}</td>
                                                                        <td style={{ textAlign: "right" }}>${it.precioUnitario?.toLocaleString()}</td>
                                                                        <td style={{ textAlign: "right" }}>{it.descuento > 0 ? it.descuento + "%" : "-"}</td>
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

            {editingCompra && (
                <CompraFormModal
                    proveedor={{ id: proveedorId, nombre: compras.find(c => c.id === editingCompra.id)?.proveedor?.nombre }}
                    compraEditar={editingCompra}
                    onClose={() => setEditingCompra(null)}
                    onSaved={() => {
                        setEditingCompra(null);
                        fetchCompras();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
}
