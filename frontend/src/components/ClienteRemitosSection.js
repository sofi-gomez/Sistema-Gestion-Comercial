import React, { useEffect, useState } from "react";
import { FiFileText } from "react-icons/fi";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_REMITOS = "/api/remitos";

export default function ClienteRemitosSection({ clienteId }) {
    const [remitos, setRemitos] = useState([]);
    const [expandedRows, setExpandedRows] = useState(new Set());

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    useEffect(() => {
        const fetchRemitos = async () => {
            try {
                const res = await apiFetch(`${API_REMITOS}/cliente/${clienteId}`);
                if (res.ok) setRemitos(await res.json() || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchRemitos();
    }, [clienteId]);

    return (
        <div className="remitos-section">
            <div className="table-container">
                {remitos.length === 0 ? (
                    <div className="empty-state">
                        <FiFileText size={40} />
                        <h3>No hay remitos registrados</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remitos.map(r => (
                                <React.Fragment key={r.id}>
                                    <tr className={expandedRows.has(r.id) ? "expanded-parent" : ""}>
                                        <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                                        <td>{formatDateLocal(r.fecha)}</td>
                                        <td className="price-cell">${r.total?.toLocaleString() || "0"}</td>
                                        <td>
                                            <span className={`status-badge ${r.estado === "COBRADO" ? "active" : r.estado === "VALORIZADO" ? "warning" : "inactive"}`}>
                                                {r.estado}
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
                                    </tr>
                                    {expandedRows.has(r.id) && (
                                        <tr className="expanded-row">
                                            <td colSpan="5" style={{ padding: "0" }}>
                                                <div className="expanded-content-wrapper">
                                                    <table className="modern-table mini">
                                                        <thead>
                                                            <tr>
                                                                <th>Producto</th>
                                                                <th style={{ textAlign: "center" }}>Cantidad</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {r.items?.map((it, idx) => (
                                                                <tr key={idx}>
                                                                    <td>{it.producto?.nombre || "Producto desconocido"}</td>
                                                                    <td style={{ textAlign: "center" }}>{it.cantidad}</td>
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
        </div>
    );
}
