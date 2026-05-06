import React, { useState } from "react";
import { FiX, FiCheck, FiFileText } from "react-icons/fi";
import { apiFetch } from "../utils/api";

const API_NOTAS_PROVEEDOR = "/api/notas-proveedor";

export default function NotaCreditoProveedorModal({ proveedor, onClose, onSaved }) {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [motivo, setMotivo] = useState("");
    const [moneda, setMoneda] = useState("ARS");
    const [monto, setMonto] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!proveedor) return;
        if (Number(monto) <= 0) {
            alert("El monto debe ser mayor a cero.");
            return;
        }

        setLoading(true);
        try {
            const notaPayload = {
                fecha: fecha,
                motivo: motivo,
                moneda: moneda,
                monto: Number(monto)
            };

            const res = await apiFetch(`${API_NOTAS_PROVEEDOR}?proveedorId=${proveedor.id}`, {
                method: "POST",
                body: JSON.stringify(notaPayload)
            });

            if (res.ok) {
                onSaved();
            } else {
                const err = await res.json();
                alert("Error al guardar la nota de crédito: " + (err.message || ""));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al intentar guardar la nota de crédito.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                <div className="modal-header">
                    <h2><FiFileText /> Nota de Crédito - Ajuste Financiero</h2>
                    <button className="icon-btn" type="button" onClick={onClose}><FiX /></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div style={{ padding: "10px", marginBottom: "1.5rem", fontSize: "0.9rem", color: "var(--muted)", background: "#eff6ff", borderRadius: "8px" }}>
                            <strong>Proveedor:</strong> {proveedor.nombre}<br/>
                            Esta nota <strong>reducirá la deuda</strong> que tienes con este proveedor. No afecta el inventario.
                        </div>

                        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Fecha</label>
                                    <input
                                        type="date"
                                        className="modern-input"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Moneda</label>
                                    <select
                                        className="modern-input"
                                        value={moneda}
                                        onChange={(e) => setMoneda(e.target.value)}
                                    >
                                        <option value="ARS">Pesos Argentinos (ARS)</option>
                                        <option value="USD">Dólares (USD)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Motivo</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="Ej. Descuento por volumen, ajuste de precio..."
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Monto</label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontWeight: "600" }}>$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="modern-input"
                                        style={{ paddingLeft: "25px", fontSize: "1.1rem", fontWeight: "600" }}
                                        value={monto}
                                        onChange={(e) => setMonto(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ background: "#f59e0b" }}>
                            {loading ? "Guardando..." : <><FiCheck /> Confirmar Nota</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
