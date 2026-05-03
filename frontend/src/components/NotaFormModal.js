import React, { useState, useEffect } from "react";
import { FiX, FiSave, FiAlertCircle } from "react-icons/fi";
import { apiFetch } from "../utils/api";

export default function NotaFormModal({ clienteId, onClose, onSaved }) {
    const [tipo, setTipo] = useState("DEBITO");
    const [monto, setMonto] = useState("");
    const [motivo, setMotivo] = useState("");
    const [isRechazoCheque, setIsRechazoCheque] = useState(false);
    const [cheques, setCheques] = useState([]);
    const [selectedChequeId, setSelectedChequeId] = useState("");
    const [gastosBancarios, setGastosBancarios] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isRechazoCheque) {
            fetchCheques();
        }
    }, [isRechazoCheque]);

    const fetchCheques = async () => {
        try {
            const res = await apiFetch(`/api/tesoreria/cheques/cliente/${clienteId}`);
            if (res.ok) {
                const data = await res.json();
                setCheques(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isRechazoCheque && selectedChequeId) {
                // Si es rechazo de cheque, usamos el endpoint de tesorería
                const res = await apiFetch(`/api/tesoreria/${selectedChequeId}/rechazar`, {
                    method: "PUT",
                    body: JSON.stringify({ gastosBancarios: parseFloat(gastosBancarios) || 0 })
                });
                if (res.ok) {
                    onSaved();
                } else {
                    const data = await res.json();
                    setError(data.message || "Error al rechazar el cheque");
                }
            } else {
                // Nota genérica
                const res = await apiFetch(`/api/notas/cliente/${clienteId}`, {
                    method: "POST",
                    body: JSON.stringify({
                        tipo,
                        monto: parseFloat(monto),
                        motivo: motivo || (tipo === "DEBITO" ? "Nota de Débito" : "Nota de Crédito")
                    })
                });
                if (res.ok) {
                    onSaved();
                } else {
                    setError("Error al guardar la nota");
                }
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleChequeChange = (e) => {
        const id = e.target.value;
        setSelectedChequeId(id);
        const cheque = cheques.find(c => c.id === parseInt(id));
        if (cheque) {
            setMonto(cheque.importe);
            setMotivo(`Cheque Rechazado N° ${cheque.numeroCheque} - ${cheque.banco}`);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Nueva Nota de Débito / Crédito</h2>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        {error && (
                            <div className="error-message" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", color: "#dc2626", padding: "10px", borderRadius: "8px" }}>
                                <FiAlertCircle /> {error}
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                            <label className="form-label">Tipo de Nota</label>
                            <select 
                                value={tipo} 
                                onChange={(e) => setTipo(e.target.value)}
                                disabled={isRechazoCheque}
                                className="modern-input"
                            >
                                <option value="DEBITO">Nota de Débito (+ Deuda)</option>
                                <option value="CREDITO">Nota de Crédito (- Deuda)</option>
                            </select>
                        </div>

                        {tipo === "DEBITO" && (
                            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                                <label className="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={isRechazoCheque} 
                                        onChange={(e) => setIsRechazoCheque(e.target.checked)} 
                                        style={{ width: "20px", height: "20px" }}
                                    />
                                    <span>¿Es por un Cheque Rechazado?</span>
                                </label>
                            </div>
                        )}

                        {isRechazoCheque ? (
                            <>
                                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                                    <label className="form-label">Seleccionar Cheque en Cartera</label>
                                    <select 
                                        className="modern-input" 
                                        value={selectedChequeId} 
                                        onChange={handleChequeChange}
                                        required
                                    >
                                        <option value="">-- Seleccionar cheque --</option>
                                        {cheques.map(c => (
                                            <option key={c.id} value={c.id}>
                                                N° {c.numeroCheque} - {c.banco} (${c.importe.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                    {cheques.length === 0 && <p style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "4px" }}>No hay cheques pendientes para este cliente.</p>}
                                </div>
                                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                                    <label className="form-label">Gastos Bancarios (opcional)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        className="modern-input"
                                        value={gastosBancarios}
                                        onChange={(e) => setGastosBancarios(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        onFocus={(e) => e.target.select()}
                                        placeholder="0.00"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                                <label className="form-label">Monto</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="modern-input" 
                                    value={monto} 
                                    onChange={(e) => setMonto(e.target.value)} 
                                    onWheel={(e) => e.target.blur()}
                                    onFocus={(e) => e.target.select()}
                                    required 
                                    placeholder="0.00"
                                />
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                            <label className="form-label">Motivo / Observaciones</label>
                            <textarea 
                                className="modern-textarea" 
                                value={motivo} 
                                onChange={(e) => setMotivo(e.target.value)} 
                                required={!isRechazoCheque}
                                placeholder="Ej: Intereses por mora, error en factura, etc."
                                rows="3"
                            ></textarea>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading || (isRechazoCheque && !selectedChequeId)} style={{ background: "#f97316", border: "none" }}>
                            {loading ? "Guardando..." : <><FiSave /> Guardar Nota</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
