import React, { useEffect, useState } from "react";
import { FiFileText, FiDownload, FiCheckCircle } from "react-icons/fi";

const API_REMITOS = "http://localhost:8080/api/remitos";

export default function ClienteRemitosSection({ clienteId }) {
    const [remitos, setRemitos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRemitos = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_REMITOS}/cliente/${clienteId}`);
                if (res.ok) setRemitos(await res.json() || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
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
                                <tr key={r.id}>
                                    <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                                    <td>{new Date(r.fecha).toLocaleDateString()}</td>
                                    <td className="price-cell">${r.total?.toLocaleString() || "0"}</td>
                                    <td>
                                        <span className={`status-badge ${r.estado === "COBRADO" ? "active" : r.estado === "VALORIZADO" ? "warning" : "inactive"}`}>
                                            {r.estado}
                                        </span>
                                    </td>
                                    <td>{r.items?.length || 0} productos</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
