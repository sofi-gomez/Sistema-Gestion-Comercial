import React, { useEffect, useState } from "react";
import { FiDollarSign, FiClock, FiCheckCircle } from "react-icons/fi";

const API_PAGOS = "http://localhost:8080/api/pagos-proveedor";

export default function ProveedorCtaCteSection({ proveedorId }) {
    const [saldo, setSaldo] = useState(0);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCtaCte = async () => {
            setLoading(true);
            try {
                // Simplificado para ejemplo, asumiendo endpoints similares a Clientes
                const [resDeuda, resHist] = await Promise.all([
                    fetch(`${API_PAGOS}/proveedor/${proveedorId}/deuda`).catch(() => null),
                    fetch(`${API_PAGOS}/proveedor/${proveedorId}`).catch(() => null)
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
            } finally {
                setLoading(false);
            }
        };
        fetchCtaCte();
    }, [proveedorId]);

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
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map(p => (
                                <tr key={p.id}>
                                    <td>{new Date(p.fecha).toLocaleDateString()}</td>
                                    <td>{p.observaciones || "Pago registrado"}</td>
                                    <td className="price-cell" style={{ color: "#ef4444" }}>- ${p.importeTotal?.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
