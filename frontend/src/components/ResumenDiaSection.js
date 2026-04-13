import React, { useState, useEffect, useCallback } from "react";
import { FiCalendar, FiTrendingUp, FiTrendingDown, FiDollarSign, FiRefreshCw } from "react-icons/fi";
import { apiFetch } from "../utils/api";

const API_BASE = "/api/tesoreria";

const MEDIO_LABELS = {
    EFECTIVO: "Efectivo",
    TRANSFERENCIA: "Transferencia",
    CHEQUE: "Cheque",
    CHEQUE_ELECTRONICO: "Cheque Electrónico",
    TARJETA_DEBITO: "Tarjeta Débito",
    TARJETA_CREDITO: "Tarjeta Crédito",
    MERCADO_PAGO: "Mercado Pago",
    OTRO: "Otro",
};

function fmtMoneda(val) {
    const n = typeof val === "number" ? val : parseFloat(val ?? 0);
    return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hoy() {
    return new Date().toISOString().split("T")[0];
}

export default function ResumenDiaSection() {
    const [fecha, setFecha] = useState(hoy());
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchResumen = useCallback(async (f) => {
        setLoading(true);
        try {
            const res = await apiFetch(`${API_BASE}/resumen-dia?fecha=${f}`);
            if (res.ok) setResumen(await res.json());
            else setResumen(null);
        } catch {
            setResumen(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchResumen(fecha); }, [fecha, fetchResumen]);

    const ingresos = resumen?.detallePorMedio?.filter(d => d.tipo === "INGRESO") ?? [];
    const egresos  = resumen?.detallePorMedio?.filter(d => d.tipo === "EGRESO")  ?? [];
    const saldo    = parseFloat(resumen?.saldoDia ?? 0);
    const saldoPos = saldo >= 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Selector de fecha */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 14px" }}>
                    <FiCalendar style={{ color: "var(--muted)" }} />
                    <input
                        type="date"
                        value={fecha}
                        max={hoy()}
                        onChange={e => setFecha(e.target.value)}
                        style={{ border: "none", background: "transparent", color: "var(--text)", fontSize: "0.95rem", cursor: "pointer" }}
                    />
                </div>
                <button
                    onClick={() => fetchResumen(fecha)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", cursor: "pointer", fontSize: "0.9rem" }}
                >
                    <FiRefreshCw size={14} /> Actualizar
                </button>
                <button
                    onClick={() => setFecha(hoy())}
                    style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid #3b82f6", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                >
                    Hoy
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Cargando resumen...</div>
            ) : !resumen ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>No se pudo cargar el resumen.</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>

                        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                <FiTrendingUp /> Ingresos del día
                            </div>
                            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#065f46", fontFamily: "monospace" }}>
                                ${fmtMoneda(resumen.totalIngresos)}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#6ee7b7" }}>{ingresos.length} tipo(s) de medio</div>
                        </div>

                        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e11d48", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                <FiTrendingDown /> Egresos del día
                            </div>
                            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#9f1239", fontFamily: "monospace" }}>
                                ${fmtMoneda(resumen.totalEgresos)}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#fda4af" }}>{egresos.length} tipo(s) de medio</div>
                        </div>

                        <div style={{
                            background: saldoPos ? "#eff6ff" : "#fff7ed",
                            border: `1px solid ${saldoPos ? "#bfdbfe" : "#fed7aa"}`,
                            borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: saldoPos ? "#1d4ed8" : "#c2410c", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                <FiDollarSign /> Saldo del día
                            </div>
                            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: saldoPos ? "#1e40af" : "#9a3412", fontFamily: "monospace" }}>
                                {saldoPos ? "" : "-"}${fmtMoneda(Math.abs(saldo))}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: saldoPos ? "#93c5fd" : "#fdba74" }}>
                                {resumen.cantidadMovimientos} movimiento(s) registrado(s)
                            </div>
                        </div>
                    </div>

                    {/* Detalle por medio de pago */}
                    {(ingresos.length > 0 || egresos.length > 0) && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

                            {/* Ingresos por medio */}
                            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FiTrendingUp /> Ingresos por medio de pago
                                </div>
                                {ingresos.length === 0 ? (
                                    <div style={{ padding: "20px", color: "var(--muted)", fontSize: "0.85rem", textAlign: "center" }}>Sin ingresos registrados</div>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <tbody>
                                            {ingresos.map((d, i) => (
                                                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                                                    <td style={{ padding: "12px 18px", color: "var(--text)", fontSize: "0.9rem" }}>
                                                        {MEDIO_LABELS[d.medio] ?? d.medio}
                                                    </td>
                                                    <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 700, color: "#065f46", fontFamily: "monospace" }}>
                                                        ${fmtMoneda(d.importe)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Egresos por medio */}
                            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: "#e11d48", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <FiTrendingDown /> Egresos por medio de pago
                                </div>
                                {egresos.length === 0 ? (
                                    <div style={{ padding: "20px", color: "var(--muted)", fontSize: "0.85rem", textAlign: "center" }}>Sin egresos registrados</div>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <tbody>
                                            {egresos.map((d, i) => (
                                                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                                                    <td style={{ padding: "12px 18px", color: "var(--text)", fontSize: "0.9rem" }}>
                                                        {MEDIO_LABELS[d.medio] ?? d.medio}
                                                    </td>
                                                    <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 700, color: "#9f1239", fontFamily: "monospace" }}>
                                                        ${fmtMoneda(d.importe)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {resumen.cantidadMovimientos === 0 && (
                        <div style={{ textAlign: "center", padding: "30px", color: "var(--muted)", background: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                            No hay movimientos registrados para este día.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
