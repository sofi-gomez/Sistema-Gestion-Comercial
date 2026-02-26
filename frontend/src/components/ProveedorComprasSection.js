import React, { useEffect, useState } from "react";
import { FiShoppingCart, FiFileText, FiCalendar } from "react-icons/fi";

const API_COMPRAS = "http://localhost:8080/api/compras";

export default function ProveedorComprasSection({ proveedorId }) {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompras = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_COMPRAS}/proveedor/${proveedorId}`);
                if (res.ok) setCompras(await res.json() || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchCompras();
    }, [proveedorId]);

    return (
        <div className="compras-section">
            <div className="table-container">
                {compras.length === 0 ? (
                    <div className="empty-state">
                        <FiShoppingCart size={40} />
                        <h3>No hay compras registradas</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Nº Factura / Remito</th>
                                <th>Fecha</th>
                                <th>Total Compra</th>
                                <th>Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compras.map(c => (
                                <tr key={c.id}>
                                    <td className="sku-cell"><span className="sku-badge">#{c.numeroDocumento || c.id}</span></td>
                                    <td>{new Date(c.fecha).toLocaleDateString()}</td>
                                    <td className="price-cell">${c.total?.toLocaleString() || "0"}</td>
                                    <td>{c.items?.length || 0} ítems</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
