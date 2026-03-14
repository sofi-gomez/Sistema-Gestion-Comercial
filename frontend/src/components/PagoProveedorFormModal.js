import React, { useState, useEffect } from "react";
import { FiDollarSign, FiCreditCard, FiHash, FiUser, FiX } from "react-icons/fi";
import CamposCheque from "./CamposCheque";
import { apiFetch } from "../utils/api";

const API_PROVEEDORES = "/api/proveedores";
const API_PAGOS = "/api/pagos-proveedor";

export default function PagoProveedorFormModal({ onClose, onSaved, proveedorIdPreselected = null, montoSugerido = "" }) {
    const [proveedores, setProveedores] = useState([]);
    const [proveedorId, setProveedorId] = useState(proveedorIdPreselected || "");
    const [monto, setMonto] = useState(montoSugerido || "");
    const [medioPago, setMedioPago] = useState("EFECTIVO");
    const [observaciones, setObservaciones] = useState("");
    const [loading, setLoading] = useState(false);

    // Campos de cheque
    const [banco, setBanco] = useState("");
    const [numeroCheque, setNumeroCheque] = useState("");
    const [librador, setLibrador] = useState("");
    const [fechaEmision, setFechaEmision] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");

    useEffect(() => {
        if (!proveedorIdPreselected) {
            apiFetch(API_PROVEEDORES)
                .then(res => res.json())
                .then(data => setProveedores(data || []))
                .catch(err => console.error("Error cargando proveedores:", err));
        }
    }, [proveedorIdPreselected]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!proveedorId || !monto || parseFloat(monto) <= 0) {
            alert("Por favor complete el proveedor y un monto válido.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                pago: {
                    proveedor: { id: parseInt(proveedorId) },
                    importe: parseFloat(monto),
                    medio: medioPago,
                    observaciones: observaciones.trim() || `Pago a proveedor en ${medioPago.toLowerCase()}`,
                    // Datos de cheque si corresponde
                    banco: medioPago.includes("CHEQUE") ? banco : null,
                    numeroCheque: medioPago.includes("CHEQUE") ? numeroCheque : null,
                    librador: medioPago.includes("CHEQUE") ? librador : null,
                    fechaVenc: medioPago.includes("CHEQUE") ? fechaVencimiento : null
                },
                importesPorCompra: {} // Por ahora pago a cuenta general
            };

            const res = await apiFetch(API_PAGOS, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSaved();
            } else {
                const errData = await res.json();
                alert("Error al registrar el pago: " + (errData.error || "Error desconocido"));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión al registrar pago.");
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
                        <div className="title-icon" style={{ padding: "8px", background: "#fff1f2", color: "#e11d48" }}>
                            <FiDollarSign />
                        </div>
                        <h2>Registrar Pago a Proveedor</h2>
                    </div>
                    <button onClick={onClose} className="modal-close"><FiX /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>

                            {/* Selector de Proveedor (si no está preseleccionado) */}
                            {!proveedorIdPreselected && (
                                <div className="form-group">
                                    <label className="form-label"><FiUser /> Proveedor *</label>
                                    <select
                                        className="modern-select"
                                        value={proveedorId}
                                        onChange={e => setProveedorId(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccione un proveedor...</option>
                                        {proveedores.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label"><FiDollarSign /> Monto a Pagar *</label>
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
                                        <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                                        <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                                    </select>
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
                                        fechaCobro={fechaVencimiento}
                                        setFechaCobro={setFechaVencimiento}
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
                        <button type="submit" className="btn-primary" disabled={loading} style={{ background: "#e11d48" }}>
                            {loading ? "Registrando..." : "Confirmar Pago"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
