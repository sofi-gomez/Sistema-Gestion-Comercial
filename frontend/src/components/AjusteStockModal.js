import React, { useState } from "react";
import { FiX, FiCheck, FiRotateCcw, FiPlus, FiMinus } from "react-icons/fi";
import { apiFetch } from "../utils/api";

export default function AjusteStockModal({ producto, onClose, onSave }) {
    const [cantidad, setCantidad] = useState(1);
    const [tipo, setTipo] = useState("SUMAR"); // SUMAR o RESTAR
    const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
    const [motivoCustom, setMotivoCustom] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const motivoFinal = motivoSeleccionado === "Otro" ? ("Otro: " + motivoCustom) : motivoSeleccionado;
        if (!motivoFinal.trim() || (motivoSeleccionado === "Otro" && !motivoCustom.trim())) {
            alert("Por favor, ingrese un motivo para el ajuste.");
            return;
        }

        setSaving(true);
        try {
            const finalCantidad = tipo === "SUMAR" ? Math.abs(cantidad) : -Math.abs(cantidad);
            
            const res = await apiFetch("/api/ajustes-stock", {
                method: "POST",
                body: JSON.stringify({
                    productoId: producto.id,
                    cantidad: finalCantidad,
                    motivo: motivoFinal
                })
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                const err = await res.json();
                alert("Error: " + (err.error || "No se pudo realizar el ajuste"));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "450px" }}>
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FiRotateCcw style={{ color: "var(--primary)" }} />
                        <h2>Ajustar Stock</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>

                <div className="modal-content">
                    <div style={{ marginBottom: "1.5rem", padding: "12px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>Producto:</p>
                        <p style={{ margin: 0, fontWeight: "600", color: "var(--text)" }}>{producto.nombre}</p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem" }}>
                            Stock Actual: <span style={{ fontWeight: "700", color: producto.stock > 0 ? "var(--success)" : "var(--error)" }}>{producto.stock}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Tipo de Ajuste</label>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    type="button"
                                    className={`btn-secondary ${tipo === "SUMAR" ? "active" : ""}`}
                                    onClick={() => setTipo("SUMAR")}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderColor: tipo === "SUMAR" ? "var(--success)" : "", color: tipo === "SUMAR" ? "var(--success)" : "" }}
                                >
                                    <FiPlus /> Sumar
                                </button>
                                <button
                                    type="button"
                                    className={`btn-secondary ${tipo === "RESTAR" ? "active" : ""}`}
                                    onClick={() => setTipo("RESTAR")}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderColor: tipo === "RESTAR" ? "var(--error)" : "", color: tipo === "RESTAR" ? "var(--error)" : "" }}
                                >
                                    <FiMinus /> Restar
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Cantidad</label>
                            <input
                                type="number"
                                className="modern-input"
                                min="1"
                                value={cantidad}
                                onChange={e => setCantidad(parseInt(e.target.value) || 0)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Motivo del Ajuste</label>
                            <select 
                                className="modern-input"
                                value={motivoSeleccionado}
                                onChange={e => setMotivoSeleccionado(e.target.value)}
                                required
                            >
                                <option value="">Seleccione un motivo...</option>
                                <option value="Conteo físico / Auditoría">Conteo físico / Auditoría</option>
                                <option value="Producto Dañado / Roto">Producto Dañado / Roto</option>
                                <option value="Error de ingreso previo">Error de ingreso previo</option>
                                <option value="Muestra / Regalo">Muestra / Regalo</option>
                                <option value="Vencimiento">Vencimiento</option>
                                <option value="Otro">Otro (especificar en descripción)</option>
                            </select>
                        </div>
                        
                        {motivoSeleccionado === "Otro" && (
                             <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <textarea 
                                    className="modern-input"
                                    placeholder="Explique el motivo..."
                                    value={motivoCustom}
                                    onChange={e => setMotivoCustom(e.target.value)}
                                    rows={3}
                                    required
                                    autoFocus
                                />
                             </div>
                        )}

                        <div className="modal-actions" style={{ marginTop: "2rem" }}>
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                <FiCheck /> {saving ? "Procesando..." : "Confirmar Ajuste"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <style jsx>{`
                .active {
                    background: var(--surface) !important;
                    border-width: 2px !important;
                }
            `}</style>
        </div>
    );
}
