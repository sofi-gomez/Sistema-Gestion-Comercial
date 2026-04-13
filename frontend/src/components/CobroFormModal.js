import React, { useState, useEffect } from "react";
import { FiDollarSign, FiCreditCard, FiHash, FiUser, FiDownload } from "react-icons/fi";
import CamposCheque from "./CamposCheque";
import { apiFetch } from "../utils/api";

const API_CLIENTES = "/api/clientes";
const API_COBROS = "/api/cobros";

export default function CobroFormModal({ onClose, onSaved, clienteIdPreselected = null, montoSugerido = "", remitoId = null }) {
    const [clientes, setClientes] = useState([]);
    const [clienteId, setClienteId] = useState(clienteIdPreselected || "");
    const [monto, setMonto] = useState(montoSugerido || "");
    const [medioPago, setMedioPago] = useState("EFECTIVO");
    const [observaciones, setObservaciones] = useState("");
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Campos de cheque
    const [banco, setBanco] = useState("");
    const [numeroCheque, setNumeroCheque] = useState("");
    const [librador, setLibrador] = useState("");
    const [fechaEmision, setFechaEmision] = useState("");
    const [fechaCobro, setFechaCobro] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");

    useEffect(() => {
        if (!clienteIdPreselected) {
            apiFetch(API_CLIENTES)
                .then(res => res.json())
                .then(data => setClientes(data || []))
                .catch(err => console.error("Error cargando clientes:", err));
        }
    }, [clienteIdPreselected]);

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
        } catch (e) {
            console.error("Error descargando recibo:", e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clienteId || !monto || parseFloat(monto) <= 0) {
            alert("Por favor complete el cliente y un monto válido.");
            return;
        }

        const medioPagoCheque = medioPago.includes("CHEQUE");
        if (medioPagoCheque) {
            if (!banco || !numeroCheque || !fechaEmision || !fechaCobro) {
                alert("Por favor complete todos los campos obligatorios del cheque (Banco, Número, Emisión y Fecha de Cobro).");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                cobro: {
                    cliente: { id: parseInt(clienteId) },
                    totalCobrado: parseFloat(monto),
                    fecha: fecha,
                    observaciones: observaciones.trim() || `Cobro en ${medioPago.toLowerCase()}`
                },
                importesPorRemito: remitoId ? { [remitoId]: parseFloat(monto) } : {},
                mediosPago: [
                    {
                        medio: medioPago,
                        importe: parseFloat(monto),
                        // Datos de cheque si corresponde
                        banco: medioPago.includes("CHEQUE") ? banco : null,
                        numeroCheque: medioPago.includes("CHEQUE") ? numeroCheque : null,
                        librador: medioPago.includes("CHEQUE") ? librador : null,
                        fechaEmision: medioPago.includes("CHEQUE") ? fechaEmision : null,
                        fechaCobro: medioPago.includes("CHEQUE") ? fechaCobro : null,
                        fechaVencimiento: medioPago.includes("CHEQUE") ? (fechaVencimiento || null) : null
                    }
                ]
            };

            const res = await apiFetch(API_COBROS, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedCobro = await res.json();
                if (window.confirm("¡Cobro registrado con éxito! ¿Deseas descargar el recibo de cobro ahora?")) {
                    await downloadRecibo(savedCobro.id);
                }
                onSaved();
            } else {
                const errData = await res.json();
                alert("Error al registrar el cobro: " + (errData.error || "Error desconocido"));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión al registrar cobro.");
        } finally {
            setLoading(false);
        }
    };

    const esCheque = medioPago.includes("CHEQUE");

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="title-icon" style={{ padding: "8px", background: "#ecfdf5", color: "#10b981" }}>
                            <FiDollarSign />
                        </div>
                        <h2>Registrar Cobro</h2>
                    </div>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>

                            {/* Selector de Cliente (si no está preseleccionado) */}
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

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label"><FiDollarSign /> Monto a Cobrar *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="modern-input"
                                        value={monto}
                                        onChange={e => setMonto(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label"><FiCreditCard /> Medio de Pago *</label>
                                    <select
                                        className="modern-select"
                                        value={medioPago}
                                        onChange={e => setMedioPago(e.target.value)}
                                        required
                                    >
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="CHEQUE_ELECTRONICO">Cheque Electrónico</option>
                                        <option value="MERCADO_PAGO">Mercado Pago</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label"><FiCreditCard /> Fecha del Cobro *</label>
                                    <input
                                        type="date"
                                        className="modern-input"
                                        value={fecha}
                                        onChange={e => setFecha(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {esCheque && (
                                <div className="cheque-fields-container" style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                                    <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--primary)" }}>Datos del Cheque</h4>
                                    <CamposCheque
                                        mostrar={true}
                                        banco={banco}
                                        setBanco={setBanco}
                                        numeroCheque={numeroCheque}
                                        setNumeroCheque={setNumeroCheque}
                                        librador={librador}
                                        setLibrador={setLibrador}
                                        fechaEmision={fechaEmision}
                                        setFechaEmision={setFechaEmision}
                                        fechaCobro={fechaCobro}
                                        setFechaCobro={setFechaCobro}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label"><FiHash /> Observaciones</label>
                                <textarea
                                    className="modern-textarea"
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    placeholder="Opcional: Detalle del pago..."
                                    rows="2"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ background: "#10b981" }}>
                            {loading ? "Registrando..." : "Confirmar Cobro"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
