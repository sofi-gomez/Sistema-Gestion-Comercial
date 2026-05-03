import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiDollarSign, FiTrendingDown, FiCheckCircle, FiFileText, FiPlus, FiExternalLink, FiDownload, FiTrash2 } from "react-icons/fi";
import CobroFormModal from "./CobroFormModal";
import NotaFormModal from "./NotaFormModal";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_COBROS = "/api/cobros";

export default function ClienteCtaCteSection({ clienteId }) {
    const navigate = useNavigate();
    const [saldo, setSaldo] = useState(0);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalCobroOpen, setModalCobroOpen] = useState(false);
    const [modalNotaOpen, setModalNotaOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState("asc"); // "asc" o "desc"
    const [cotizacionDolar, setCotizacionDolar] = useState(null);

    useEffect(() => {
        apiFetch("/api/configuracion")
            .then(res => res.json())
            .then(data => setCotizacionDolar(data.cotizacionDolar || null))
            .catch(() => setCotizacionDolar(null));
    }, []);

    const downloadRecibo = async (cobroId) => {
        try {
            const res = await apiFetch(`${API_COBROS}/${cobroId}/recibo/pdf`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `recibo_cobro_${cobroId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Error al descargar el recibo");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    };

    const fetchCtaCte = useCallback(async () => {
        setLoading(true);
        try {
            const [resSaldo, resMovs] = await Promise.all([
                apiFetch(`${API_COBROS}/cliente/${clienteId}/saldo`),
                apiFetch(`${API_COBROS}/cliente/${clienteId}/movimientos`)
            ]);

            if (resSaldo.ok) {
                const data = await resSaldo.json();
                setSaldo(data.saldo || 0);
            }
            if (resMovs.ok) {
                const data = await resMovs.json();
                // Calcular saldo acumulado para cada línea
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
    }, [clienteId]);

    useEffect(() => {
        fetchCtaCte();
    }, [clienteId, fetchCtaCte]);

    return (
        <div className="ctacte-section">
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className={`stat-icon ${saldo > 0 ? "out-of-stock" : "active"}`}><FiDollarSign /></div>
                    <div className="stat-info">
                        <h3>${Math.abs(saldo).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                        <p>{saldo >= 0 ? "Saldo Deudor" : "Saldo a Favor"}</p>
                        {cotizacionDolar && cotizacionDolar > 0 && (
                            <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                                    <span style={{ fontWeight: 600, color: saldo > 0 ? "#ef4444" : "#10b981" }}>
                                        USD {(Math.abs(saldo) / cotizacionDolar).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </p>
                                <span
                                    onClick={() => navigate("/configuracion")}
                                    title="Ir a Herramientas → Parámetros Globales"
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: "4px",
                                        fontSize: "0.75rem", fontWeight: 600,
                                        color: "#3b82f6", cursor: "pointer",
                                        background: "#eff6ff", border: "1px solid #bfdbfe",
                                        borderRadius: "6px", padding: "2px 8px",
                                        width: "fit-content", transition: "all 0.15s"
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#93c5fd"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
                                >
                                    <FiExternalLink size={10} />
                                    TC: ${cotizacionDolar.toLocaleString()}
                                </span>
                            </div>
                        )}
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
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "4px" }}>
                        <button
                            className={`tab-btn-modern ${sortOrder === "desc" ? "active" : ""}`}
                            style={{ padding: "6px 12px", fontSize: "0.8rem", height: "auto", borderRadius: "6px", borderBottom: "none" }}
                            onClick={() => setSortOrder("desc")}
                        >
                            Más nuevos arriba
                        </button>
                        <button
                            className={`tab-btn-modern ${sortOrder === "asc" ? "active" : ""}`}
                            style={{ padding: "6px 12px", fontSize: "0.8rem", height: "auto", borderRadius: "6px", borderBottom: "none" }}
                            onClick={() => setSortOrder("asc")}
                        >
                            Más viejos arriba
                        </button>
                    </div>
                    <button className="btn-secondary" onClick={fetchCtaCte} style={{ padding: "6px 12px", fontSize: "0.85rem" }}>Actualizar</button>
                    <button
                        className="btn-primary"
                        onClick={() => setModalNotaOpen(true)}
                        style={{ padding: "6px 12px", fontSize: "0.85rem", background: "#f97316", border: "none" }}
                    >
                        <FiPlus /> Nueva Nota
                    </button>
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
                                <th style={{ textAlign: "center", width: "50px" }}>PDF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sortOrder === "asc" ? [...movimientos].reverse() : movimientos).map((m, idx) => (
                                <tr key={`${m.tipo}-${m.idReferencia}-${idx}`}>
                                    <td>{formatDateLocal(m.fecha)}</td>
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
                                    <td style={{ textAlign: "center", width: "200px" }}>
                                        {m.origen === "COBRO" && (
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                                <button
                                                    className="btn-modern secondary"
                                                    style={{ 
                                                        padding: "6px 10px", 
                                                        color: "#3b82f6", 
                                                        background: "#eff6ff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        fontSize: "0.8rem",
                                                        fontWeight: "600"
                                                    }}
                                                    title="Descargar Recibo"
                                                    onClick={() => downloadRecibo(m.idReferencia)}
                                                >
                                                    <FiDownload />
                                                </button>
                                                <button
                                                    className="btn-modern danger"
                                                    style={{ 
                                                        padding: "6px 10px", 
                                                        color: "#ef4444", 
                                                        background: "#fef2f2",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        fontSize: "0.8rem",
                                                        fontWeight: "600",
                                                        border: "1px solid #fee2e2"
                                                    }}
                                                    title="Anular Cobro"
                                                    onClick={async () => {
                                                        if (window.confirm("¿Estás seguro de que deseas anular este cobro? Se revertirá el saldo del cliente y el estado de los remitos asociados.")) {
                                                            try {
                                                                const res = await apiFetch(`/api/cobros/${m.idReferencia}/anular`, { method: "DELETE" });
                                                                if (res.ok) fetchCtaCte();
                                                                else alert("No se pudo anular el cobro.");
                                                            } catch (e) { console.error(e); }
                                                        }
                                                    }}
                                                >
                                                    <FiTrash2 /> Anular
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
            {modalNotaOpen && (
                <NotaFormModal
                    clienteId={clienteId}
                    onClose={() => setModalNotaOpen(false)}
                    onSaved={() => {
                        setModalNotaOpen(false);
                        fetchCtaCte();
                    }}
                />
            )}
        </div>
    );
}
