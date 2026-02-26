import React, { useState, useEffect } from "react";
import { FiDollarSign, FiTrendingDown, FiCheckCircle, FiFileText, FiPlus } from "react-icons/fi";
import CobroFormModal from "./CobroFormModal";

const API_COBROS = "http://localhost:8080/api/cobros";

export default function ClienteCtaCteSection({ clienteId }) {
    const [saldo, setSaldo] = useState(0);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalCobroOpen, setModalCobroOpen] = useState(false);

    const fetchCtaCte = async () => {
        setLoading(true);
        try {
            const [resSaldo, resMovs] = await Promise.all([
                fetch(`${API_COBROS}/cliente/${clienteId}/saldo`),
                fetch(`${API_COBROS}/cliente/${clienteId}/movimientos`)
            ]);

            if (resSaldo.ok) {
                const data = await resSaldo.json();
                setSaldo(data.saldo || 0);
            }
            if (resMovs.ok) {
                const data = await resMovs.json();
                // Calcular saldo acumulado para cada línea
                // El backend devuelve los movimientos ordenados por fecha DESC
                // Para el saldo acumulado, invertimos, calculamos y volvemos a invertir
                let RunningSaldo = 0;
                const movsWithSaldo = [...data].reverse().map(m => {
                    if (m.tipo === "DEBE") RunningSaldo += m.importe;
                    else RunningSaldo -= m.importe;
                    return { ...m, saldoAcumulado: RunningSaldo };
                }).reverse();

                setMovimientos(movsWithSaldo);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCtaCte();
    }, [clienteId]);

    return (
        <div className="ctacte-section">
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className={`stat-icon ${saldo > 0 ? "out-of-stock" : "active"}`}><FiDollarSign /></div>
                    <div className="stat-info">
                        <h3>${Math.abs(saldo).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                        <p>{saldo >= 0 ? "Saldo Deudor" : "Saldo a Favor"}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon total"><FiTrendingDown /></div>
                    <div className="stat-info">
                        <h3>{movimientos.filter(m => m.tipo === "HABER").length}</h3>
                        <p>Pagos Registrados</p>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3>Estado de Cuenta / Movimientos</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn-secondary" onClick={fetchCtaCte} style={{ padding: "6px 12px", fontSize: "0.85rem" }}>Actualizar</button>
                    <button
                        className="btn-primary"
                        onClick={() => setModalCobroOpen(true)}
                        style={{ padding: "6px 12px", fontSize: "0.85rem", background: "#10b981", border: "none" }}
                    >
                        <FiPlus /> Registrar Cobro
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? <div className="loading-spinner" /> : movimientos.length === 0 ? (
                    <div className="empty-state">
                        <FiCheckCircle size={40} />
                        <h3>Sin movimientos registrados</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Detalle</th>
                                <th style={{ textAlign: "right" }}>Debe (+)</th>
                                <th style={{ textAlign: "right" }}>Haber (-)</th>
                                <th style={{ textAlign: "right" }}>Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimientos.map((m, idx) => (
                                <tr key={`${m.tipo}-${m.idReferencia}-${idx}`}>
                                    <td>{new Date(m.fecha).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {m.tipo === "DEBE" ? <FiFileText color="var(--primary)" /> : <FiCheckCircle color="#10b981" />}
                                            <span>{m.descripcion}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "right", color: "#ef4444", fontWeight: m.tipo === "DEBE" ? "600" : "400" }}>
                                        {m.tipo === "DEBE" ? `$ ${m.importe.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                                    </td>
                                    <td style={{ textAlign: "right", color: "#10b981", fontWeight: m.tipo === "HABER" ? "600" : "400" }}>
                                        {m.tipo === "HABER" ? `$ ${m.importe.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                                    </td>
                                    <td style={{ textAlign: "right", fontWeight: "700", color: m.saldoAcumulado > 0 ? "#ef4444" : "#10b981" }}>
                                        $ {m.saldoAcumulado.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modalCobroOpen && (
                <CobroFormModal
                    clienteIdPreselected={clienteId}
                    onClose={() => setModalCobroOpen(false)}
                    onSaved={() => {
                        setModalCobroOpen(false);
                        fetchCtaCte();
                    }}
                />
            )}
        </div>
    );
}
