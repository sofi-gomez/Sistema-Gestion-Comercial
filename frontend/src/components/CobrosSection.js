import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiDollarSign } from "react-icons/fi";
import CobroFormModal from "./CobroFormModal";

const API_COBROS = "http://localhost:8080/api/cobros";
const API_REMITOS = "http://localhost:8080/api/remitos";

export default function CobrosSection({ onUpdate }) {
    const [remitos, setRemitos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cobrandoRemito, setCobrandoRemito] = useState(null);

    const fetchValorizados = async () => {
        try {
            const res = await fetch(`${API_REMITOS}?estado=VALORIZADO`);
            setRemitos(await res.json());
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
                                <th>Total</th>
                                <th>Dólar</th>
                                <th style={{ textAlign: "center" }}>Estado de Cobro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remitos.map(r => (
                                <tr key={r.id}>
                                    <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                                    <td>{r.clienteNombre}</td>
                                    <td className="price-cell">${r.total?.toLocaleString()}</td>
                                    <td>{r.cotizacionDolar ? `$${r.cotizacionDolar}` : "-"}</td>
                                    <td style={{ textAlign: "center" }}>
                                        <button
                                            className="btn-primary"
                                            style={{ background: "#10b981", border: "none", padding: "6px 12px", fontSize: "0.85rem" }}
                                            onClick={() => setCobrandoRemito(r)}
                                        >
                                            <FiDollarSign /> Cobrar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {cobrandoRemito && (
                <CobroFormModal
                    clienteIdPreselected={cobrandoRemito.cliente?.id}
                    montoSugerido={cobrandoRemito.total}
                    onClose={() => setCobrandoRemito(null)}
                    onSaved={() => {
                        setCobrandoRemito(null);
                        onUpdate();
                        fetchValorizados();
                    }}
                />
            )}
        </div>
    );
}
