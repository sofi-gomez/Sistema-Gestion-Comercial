import React, { useState, useEffect } from "react";
import CamposCheque from "./CamposCheque";
import "../index.css";

export default function MovimientoFormModal({ onClose, onSaved, movimientoEditar }) {
    const [tipo, setTipo] = useState("INGRESO");
    const [medioPago, setMedioPago] = useState("EFECTIVO");
    const [importe, setImporte] = useState("");
    const [referencia, setReferencia] = useState("");
    const [descripcion, setDescripcion] = useState("");

    // Campos de cheque
    const [banco, setBanco] = useState("");
    const [numeroCheque, setNumeroCheque] = useState("");
    const [librador, setLibrador] = useState("");
    const [fechaEmision, setFechaEmision] = useState("");
    const [fechaCobro, setFechaCobro] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");

    const API_BASE = "http://localhost:8080/api/tesoreria";

    // ✅ Cargar datos al editar
    useEffect(() => {
        if (movimientoEditar) {
            setTipo(movimientoEditar.tipo || "INGRESO");
            setMedioPago(movimientoEditar.medioPago || "EFECTIVO");
            setImporte(movimientoEditar.importe?.toString() || "");
            setReferencia(movimientoEditar.referencia || "");
            setDescripcion(movimientoEditar.descripcion || "");

            // Cargar datos de cheque si existen
            setBanco(movimientoEditar.banco || "");
            setNumeroCheque(movimientoEditar.numeroCheque || "");
            setLibrador(movimientoEditar.librador || "");
            setFechaEmision(movimientoEditar.fechaEmision || "");
            setFechaCobro(movimientoEditar.fechaCobro || "");
            setFechaVencimiento(movimientoEditar.fechaVencimiento || "");
        }
    }, [movimientoEditar]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!importe || parseFloat(importe) <= 0) {
            alert("El importe debe ser mayor a 0");
            return;
        }

        const movimiento = {
            tipo,
            medioPago,
            importe: parseFloat(importe),
            referencia: referencia.trim() || null,
            descripcion: descripcion.trim() || null,
        };

        // Agregar datos de cheque si el medio de pago es cheque
        const esCheque = medioPago.includes("CHEQUE");
        if (esCheque) {
            movimiento.banco = banco.trim() || null;
            movimiento.numeroCheque = numeroCheque.trim() || null;
            movimiento.librador = librador.trim() || null;
            movimiento.fechaEmision = fechaEmision || null;
            movimiento.fechaCobro = fechaCobro || null;
            movimiento.fechaVencimiento = fechaVencimiento || null;
        }

        try {
            const url = movimientoEditar
                ? `${API_BASE}/${movimientoEditar.id}`
                : API_BASE;

            const method = movimientoEditar ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(movimiento),
            });

            if (!res.ok) {
                throw new Error("Error al guardar el movimiento");
            }

            onSaved();
        } catch (err) {
            console.error("Error guardando movimiento:", err);
            alert("Error al guardar el movimiento: " + err.message);
        }
    };

    const esCheque = medioPago.includes("CHEQUE");

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{movimientoEditar ? "Editar Movimiento" : "Nuevo Movimiento"}</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="form-grid">

                            {/* Tipo */}
                            <div className="form-group">
                                <label className="form-label">Tipo *</label>
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="modern-select"
                                    required
                                >
                                    <option value="INGRESO">Ingreso</option>
                                    <option value="EGRESO">Egreso</option>
                                </select>
                            </div>

                            {/* Medio de Pago */}
                            <div className="form-group">
                                <label className="form-label">Medio de Pago *</label>
                                <select
                                    value={medioPago}
                                    onChange={(e) => setMedioPago(e.target.value)}
                                    className="modern-select"
                                    required
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                                    <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="CHEQUE_ELECTRONICO">Cheque Electrónico</option>
                                    <option value="MERCADO_PAGO">Mercado Pago</option>
                                </select>
                            </div>

                            {/* Importe */}
                            <div className="form-group">
                                <label className="form-label">Importe *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={importe}
                                    onChange={(e) => setImporte(e.target.value)}
                                    className="modern-input"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            {/* Referencia */}
                            <div className="form-group">
                                <label className="form-label">Referencia</label>
                                <input
                                    type="text"
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    className="modern-input"
                                    placeholder="Ej: Venta #123"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="form-group full-width">
                                <label className="form-label">Descripción</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="modern-textarea"
                                    rows="3"
                                    placeholder="Descripción del movimiento..."
                                />
                            </div>

                        </div>

                        {/* Campos de Cheque (componente reutilizable) */}
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
                            fechaVencimiento={fechaVencimiento}
                            setFechaVencimiento={setFechaVencimiento}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            {movimientoEditar ? "Actualizar Movimiento" : "Crear Movimiento"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}