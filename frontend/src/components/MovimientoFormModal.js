import React, { useState } from "react";
import CamposCheque from "./CamposCheque";
import "../index.css";

export default function MovimientoFormModal({ onClose, onSaved }) {
    const [tipo, setTipo] = useState("INGRESO");
    const [medioPago, setMedioPago] = useState("EFECTIVO");
    const [importe, setImporte] = useState("");
    const [referencia, setReferencia] = useState("");
    const [descripcion, setDescripcion] = useState("");

    // Estados para datos del cheque
    const [banco, setBanco] = useState("");
    const [numeroCheque, setNumeroCheque] = useState("");
    const [librador, setLibrador] = useState("");
    const [fechaEmision, setFechaEmision] = useState("");
    const [fechaCobro, setFechaCobro] = useState("");

    const mediosPago = [
        "EFECTIVO",
        "TRANSFERENCIA",
        "TARJETA_DEBITO",
        "TARJETA_CREDITO",
        "CHEQUE",
        "CHEQUE_ELECTRONICO",
        "MERCADO_PAGO"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!importe || Number(importe) <= 0) {
            alert("El importe debe ser mayor a 0");
            return;
        }

        if (!descripcion.trim()) {
            alert("La descripción es requerida");
            return;
        }

        const esCheque = medioPago === "CHEQUE" || medioPago === "CHEQUE_ELECTRONICO";

        if (esCheque) {
            if (!banco || !numeroCheque || !librador || !fechaEmision || !fechaCobro) {
                alert("Completa todos los datos del cheque");
                return;
            }
        }

        const payload = {
            tipo: tipo,
            medioPago: medioPago,
            importe: Number(importe),
            referencia: referencia,
            descripcion: descripcion,
            fecha: new Date().toISOString(),

            // Agregar datos de cheque si corresponde
            ...(esCheque && {
                banco: banco,
                numeroCheque: numeroCheque,
                librador: librador,
                fechaEmision: fechaEmision,
                fechaCobro: fechaCobro
            })
        };

        try {
            const res = await fetch("http://localhost:8080/api/tesoreria", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Error al registrar el movimiento");
            }

            onSaved && onSaved();
        } catch (err) {
            console.error("Error guardando movimiento:", err);
            alert("No se pudo registrar el movimiento: " + err.message);
        }
    };

    const esCheque = medioPago === "CHEQUE" || medioPago === "CHEQUE_ELECTRONICO";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Registrar Nuevo Movimiento</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Tipo *</label>
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="modern-input"
                                    required
                                >
                                    <option value="INGRESO">Ingreso</option>
                                    <option value="EGRESO">Egreso</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Medio de Pago *</label>
                                <select
                                    value={medioPago}
                                    onChange={(e) => setMedioPago(e.target.value)}
                                    className="modern-input"
                                    required
                                >
                                    {mediosPago.map(medio => (
                                        <option key={medio} value={medio}>
                                            {medio.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Importe *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={importe}
                                    onChange={(e) => setImporte(e.target.value)}
                                    className="modern-input"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Referencia</label>
                                <input
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    className="modern-input"
                                    placeholder="Número de referencia, comprobante, etc."
                                />
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Descripción *</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="modern-textarea"
                                    placeholder="Descripción detallada del movimiento"
                                    rows="3"
                                    required
                                />
                            </div>
                        </div>

                        {/* Componente reutilizable de campos de cheque */}
                        <CamposCheque
                            mostrar={esCheque}
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

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            Registrar Movimiento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}