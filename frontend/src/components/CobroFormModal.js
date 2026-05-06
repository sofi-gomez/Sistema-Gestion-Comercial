import React, { useState, useEffect } from "react";
import { FiDollarSign, FiCreditCard, FiHash, FiUser, FiPlus, FiTrash2 } from "react-icons/fi";
import CamposCheque from "./CamposCheque";
import { apiFetch } from "../utils/api";

const API_CLIENTES = "/api/clientes";
const API_COBROS = "/api/cobros";

export default function CobroFormModal({ onClose, onSaved, clienteIdPreselected = null, montoSugerido = "", remitoId = null }) {
    const [clientes, setClientes] = useState([]);
    const [clienteId, setClienteId] = useState(clienteIdPreselected || "");
    const [observaciones, setObservaciones] = useState("");
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [saldoAFavor, setSaldoAFavor] = useState(0);
    const [deudas, setDeudas] = useState([]);
    const [importesAplicados, setImportesAplicados] = useState({}); // { type_id: amount }

    // Lista de pagos (dinámica)
    const [pagos, setPagos] = useState([{
        id: Date.now(),
        medio: "EFECTIVO",
        importe: montoSugerido || "",
        banco: "",
        numeroCheque: "",
        librador: "",
        fechaEmision: "",
        fechaCobro: ""
    }]);

    useEffect(() => {
        if (!clienteIdPreselected) {
            apiFetch(API_CLIENTES)
                .then(res => res.json())
                .then(data => setClientes(data || []))
                .catch(err => console.error("Error cargando clientes:", err));
        }

        if (clienteId) {
            // Cargar saldo
            apiFetch(`${API_COBROS}/cliente/${clienteId}/saldo`)
                .then(res => res.json())
                .then(data => {
                    const saldoBruto = parseFloat(data.saldo || 0);
                    const saldoExcluyendoRemito = saldoBruto - (parseFloat(montoSugerido) || 0);
                    setSaldoAFavor(saldoExcluyendoRemito < 0 ? Math.abs(saldoExcluyendoRemito) : 0);
                })
                .catch(err => console.error("Error cargando saldo:", err));

            // Cargar deudas (remitos y notas)
            const fetchDeudas = async () => {
                try {
                    const [resRemitos, resNotas] = await Promise.all([
                        apiFetch(`/api/remitos/cliente/${clienteId}/pendientes`),
                        apiFetch(`/api/notas/cliente/${clienteId}/pendientes`)
                    ]);
                    
                    const remitosData = await resRemitos.json();
                    const notasData = await resNotas.json();

                    const allDeudas = [
                        ...remitosData.map(r => ({ id: r.id, tipo: "REMITO", numero: r.numero, total: r.total, saldo: r.saldo || r.total })),
                        ...notasData.map(n => ({ id: n.id, tipo: "NOTA", numero: n.numero, total: n.monto, saldo: n.saldo || n.monto, motivo: n.motivo }))
                    ];
                    setDeudas(allDeudas);

                    // Si hay un remito o monto sugerido, lo aplicamos
                    if (remitoId) {
                        setImportesAplicados({ [`REMITO_${remitoId}`]: parseFloat(montoSugerido) || 0 });
                    }
                } catch (e) { console.error("Error cargando deudas:", e); }
            };
            fetchDeudas();
        } else {
            setSaldoAFavor(0);
            setDeudas([]);
        }
    }, [clienteIdPreselected, clienteId, montoSugerido, remitoId]);

    const totalIngresado = pagos.reduce((acc, p) => acc + (parseFloat(p.importe) || 0), 0);
    const montoPendiente = parseFloat(montoSugerido || 0) - totalIngresado;

    const addPago = () => {
        setPagos([...pagos, {
            id: Date.now(),
            medio: "EFECTIVO",
            importe: montoPendiente > 0 ? montoPendiente.toFixed(2) : "",
            banco: "",
            numeroCheque: "",
            librador: "",
            fechaEmision: "",
            fechaCobro: ""
        }]);
    };

    const removePago = (id) => {
        if (pagos.length > 1) {
            setPagos(pagos.filter(p => p.id !== id));
        }
    };

    const updatePago = (id, field, value) => {
        setPagos(pagos.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

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
            }
        } catch (e) { console.error("Error descargando recibo:", e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clienteId) {
            alert("Por favor seleccione un cliente.");
            return;
        }

        if (totalIngresado <= 0) {
            alert("El monto total debe ser mayor a 0.");
            return;
        }

        const saldoUsado = pagos
            .filter(p => p.medio === "SALDO_A_FAVOR")
            .reduce((acc, p) => acc + (parseFloat(p.importe) || 0), 0);

        if (saldoUsado > saldoAFavor) {
            alert(`El saldo a favor disponible es $${saldoAFavor.toLocaleString('es-AR', {minimumFractionDigits: 2})}. No puede usar más de ese monto.`);
            return;
        }

        // Validar cheques
        for (const p of pagos) {
            if (p.medio.includes("CHEQUE")) {
                if (!p.banco || !p.numeroCheque || !p.fechaEmision || !p.fechaCobro) {
                    alert("Por favor complete todos los datos del cheque.");
                    return;
                }
                // Validar lógica de fechas
                if (p.fechaCobro < p.fechaEmision) {
                    alert(`Error en el cheque Nº ${p.numeroCheque}: La fecha de cobro no puede ser anterior a la de emisión.`);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            const importesPorRemito = {};
            const importesPorNotaDebito = {};

            Object.entries(importesAplicados).forEach(([key, val]) => {
                const amount = parseFloat(val);
                if (amount > 0) {
                    const id = parseInt(key.split('_')[1]);
                    if (key.startsWith("REMITO_")) importesPorRemito[id] = amount;
                    if (key.startsWith("NOTA_")) importesPorNotaDebito[id] = amount;
                }
            });

            const payload = {
                cobro: {
                    cliente: { id: parseInt(clienteId) },
                    totalCobrado: totalIngresado,
                    fecha: fecha,
                    observaciones: observaciones.trim()
                },
                importesPorRemito,
                importesPorNotaDebito,
                mediosPago: pagos.map(p => ({
                    medio: p.medio,
                    importe: parseFloat(p.importe),
                    banco: p.medio.includes("CHEQUE") ? p.banco : null,
                    numeroCheque: p.medio.includes("CHEQUE") ? p.numeroCheque : null,
                    librador: p.medio.includes("CHEQUE") ? p.librador : null,
                    fechaEmision: p.medio.includes("CHEQUE") ? p.fechaEmision : null,
                    fechaCobro: p.medio.includes("CHEQUE") ? p.fechaCobro : null
                }))
            };

            const res = await apiFetch(API_COBROS, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedCobro = await res.json();
                if (window.confirm("¡Cobro registrado con éxito! ¿Deseas descargar el recibo ahora?")) {
                    await downloadRecibo(savedCobro.id);
                }
                onSaved();
            } else {
                const errData = await res.json();
                alert("Error: " + (errData.error || "Fallo en el servidor"));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="title-icon" style={{ padding: "8px", background: "#ecfdf5", color: "#10b981" }}>
                            <FiDollarSign />
                        </div>
                        <h2>Registrar Cobro Multimedio</h2>
                    </div>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Datos Generales */}
                        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                            {!clienteIdPreselected && (
                                <div className="form-group">
                                    <label className="form-label"><FiUser /> Cliente *</label>
                                    <select
                                        className="modern-select"
                                        value={clienteId}
                                        onChange={e => setClienteId(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccione un cliente...</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label"><FiCreditCard /> Fecha *</label>
                                <input
                                    type="date"
                                    className="modern-input"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {saldoAFavor !== null && (
                            <div style={{ background: saldoAFavor > 0 ? "#ecfdf5" : "#f1f5f9", border: `1px solid ${saldoAFavor > 0 ? "#6ee7b7" : "#cbd5e1"}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "1.5rem" }}>
                                <span style={{ color: saldoAFavor > 0 ? "#065f46" : "#475569", fontWeight: "600" }}>
                                    💰 Este cliente tiene ${saldoAFavor.toLocaleString('es-AR', {minimumFractionDigits: 2})} de saldo a favor en su cuenta.
                                </span>
                            </div>
                        )}

                        {/* Detalle de Deudas */}
                        {deudas.length > 0 && (
                            <div className="deudas-selection" style={{ marginBottom: "2rem" }}>
                                <h3 style={{ fontSize: "1rem", color: "#1e293b", fontWeight: "600", marginBottom: "0.5rem" }}>Deudas a Cancelar</h3>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                                    <table className="modern-table" style={{ fontSize: "0.85rem" }}>
                                        <thead style={{ background: "#f8fafc" }}>
                                            <tr>
                                                <th>Documento</th>
                                                <th style={{ textAlign: "right" }}>Saldo</th>
                                                <th style={{ textAlign: "right", width: "120px" }}>A Pagar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deudas.map(d => (
                                                <tr key={`${d.tipo}_${d.id}`}>
                                                    <td>
                                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                            <span style={{ fontWeight: "600" }}>{d.tipo === "REMITO" ? "Remito" : "Nota Débito"} #{d.numero}</span>
                                                            {d.motivo && <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{d.motivo}</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>${d.saldo.toLocaleString()}</td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <input 
                                                            type="number" 
                                                            className="modern-input" 
                                                            style={{ textAlign: "right", padding: "4px 8px" }}
                                                            value={importesAplicados[`${d.tipo}_${d.id}`] || ""}
                                                            onChange={(e) => setImportesAplicados({ ...importesAplicados, [`${d.tipo}_${d.id}`]: e.target.value })}
                                                            onWheel={(e) => e.target.blur()}
                                                            onFocus={(e) => e.target.select()}
                                                            onBlur={() => {
                                                                // Sincronizar el total cobrado si es el único medio o está vacío
                                                                const sum = Object.values({ ...importesAplicados }).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
                                                                if (pagos.length === 1 && (pagos[0].importe === "" || parseFloat(pagos[0].importe) === 0)) {
                                                                    updatePago(pagos[0].id, "importe", sum.toFixed(2));
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Listado de Pagos */}
                        <div className="pagos-container">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ fontSize: "1rem", color: "#1e293b", fontWeight: "600" }}>Medios de Pago</h3>
                                <button type="button" className="btn-modern" onClick={addPago} style={{ padding: "6px 12px", background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px" }}>
                                    <FiPlus /> Agregar Medio
                                </button>
                            </div>

                            {pagos.map((p, index) => (
                                <div key={p.id} className="pago-item" style={{ 
                                    background: "#f8fafc", 
                                    padding: "1rem", 
                                    borderRadius: "12px", 
                                    border: "1px solid #e2e8f0",
                                    marginBottom: "1rem",
                                    position: "relative"
                                }}>
                                    {pagos.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removePago(p.id)}
                                            style={{ position: "absolute", top: "10px", right: "10px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}
                                            title="Eliminar medio"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    )}

                                    <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                        <div className="form-group">
                                            <label className="form-label">Medio de Pago</label>
                                            <select
                                                className="modern-select"
                                                value={p.medio}
                                                onChange={e => updatePago(p.id, "medio", e.target.value)}
                                                required
                                            >
                                                <option value="EFECTIVO">Efectivo</option>
                                                <option value="TRANSFERENCIA">Transferencia</option>
                                                <option value="CHEQUE">Cheque</option>
                                                <option value="CHEQUE_ELECTRONICO">Cheque Electrónico</option>
                                                <option value="MERCADO_PAGO">Mercado Pago</option>
                                                <option value="SALDO_A_FAVOR">Saldo a Favor</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Importe *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="modern-input"
                                                value={p.importe}
                                                onChange={e => updatePago(p.id, "importe", e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {p.medio.includes("CHEQUE") && (
                                        <div style={{ marginTop: "1rem", borderTop: "1px dashed #cbd5e1", paddingTop: "1rem" }}>
                                            <CamposCheque
                                                mostrar={true}
                                                banco={p.banco}
                                                setBanco={v => updatePago(p.id, "banco", v)}
                                                numeroCheque={p.numeroCheque}
                                                setNumeroCheque={v => updatePago(p.id, "numeroCheque", v)}
                                                librador={p.librador}
                                                setLibrador={v => updatePago(p.id, "librador", v)}
                                                fechaEmision={p.fechaEmision}
                                                setFechaEmision={v => updatePago(p.id, "fechaEmision", v)}
                                                fechaCobro={p.fechaCobro}
                                                setFechaCobro={v => updatePago(p.id, "fechaCobro", v)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Resumen */}
                        <div style={{ background: "#f1f5f9", padding: "1.2rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: "600", color: "#475569" }}>Total Ingresado:</span>
                                <span style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#0f172a" }}>
                                    ${totalIngresado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {remitoId && (
                                <div style={{ display: "flex", justifyContent: "space-between", color: Math.abs(montoPendiente) < 0.01 ? "#059669" : "#64748b", fontSize: "0.85rem", marginTop: "8px", borderTop: "1px solid #cbd5e1", paddingTop: "8px" }}>
                                    <span>Total Remito: ${parseFloat(montoSugerido).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                    <span style={{ fontWeight: "600" }}>
                                        {Math.abs(montoPendiente) < 0.01 ? "✓ Saldo cubierto" : (montoPendiente > 0 ? `Faltante: $${montoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : `Excedente (a favor): $${Math.abs(montoPendiente).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label"><FiHash /> Observaciones Generales</label>
                            <textarea
                                className="modern-textarea"
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                placeholder="Opcional..."
                                rows="2"
                            />
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: "1rem" }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading || totalIngresado <= 0} style={{ background: "#10b981", border: "none" }}>
                            {loading ? "Registrando..." : "Confirmar Cobro Multimedio"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
