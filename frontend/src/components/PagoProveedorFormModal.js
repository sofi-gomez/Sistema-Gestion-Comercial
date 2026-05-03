import React, { useState, useEffect } from "react";
import { FiDollarSign, FiCreditCard, FiHash, FiUser, FiX, FiDownload } from "react-icons/fi";
import CamposCheque from "./CamposCheque";
import { apiFetch } from "../utils/api";

const API_PROVEEDORES = "/api/proveedores";
const API_PAGOS = "/api/pagos-proveedor";

export default function PagoProveedorFormModal({ onClose, onSaved, proveedorIdPreselected = null, montoSugerido = "", pagoEditar = null }) {
    const [proveedores, setProveedores] = useState([]);
    const [proveedorId, setProveedorId] = useState(pagoEditar?.proveedor?.id || proveedorIdPreselected || "");
    const [monto, setMonto] = useState(pagoEditar?.importe || montoSugerido || "");
    const [medioPago, setMedioPago] = useState(pagoEditar?.medio || "EFECTIVO");
    const [observaciones, setObservaciones] = useState(pagoEditar?.observaciones || "");
    const [fecha, setFecha] = useState(pagoEditar?.fecha || new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Campos Bimonetarios
    const [monedaPago, setMonedaPago] = useState(pagoEditar?.monedaPago || "ARS");   // Moneda física del pago
    const [monedaDeuda, setMonedaDeuda] = useState(pagoEditar?.moneda || "ARS");      // A qué deuda aplicar
    const [tipoCambio, setTipoCambio] = useState(pagoEditar?.tipoCambio || "");

    // Campos de cheque
    const [banco, setBanco] = useState(pagoEditar?.banco || "");
    const [numeroCheque, setNumeroCheque] = useState(pagoEditar?.numeroCheque || "");
    const [librador, setLibrador] = useState(pagoEditar?.librador || "");
    const [fechaEmision, setFechaEmision] = useState(""); 
    const [fechaVencimiento, setFechaVencimiento] = useState(pagoEditar?.fechaVenc || "");

    useEffect(() => {
        if (!proveedorIdPreselected) {
            apiFetch(API_PROVEEDORES)
                .then(res => res.json())
                .then(data => setProveedores(data || []))
                .catch(err => console.error("Error cargando proveedores:", err));
        }
    }, [proveedorIdPreselected]);

    const downloadOrdenPago = async (pagoId) => {
        try {
            const res = await apiFetch(`${API_PAGOS}/${pagoId}/orden-pago/pdf`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `orden_pago_${pagoId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error("Error descargando OP:", e);
        }
    };

    // ¿Se necesita tipo de cambio? Sí cuando hay USD involucrado (en cualquiera de los dos)
    const necesitaTC = monedaPago === "USD" || monedaDeuda === "USD";

    // Calcular importe (ARS) e importeDolares según la combinación
    const calcularImportes = () => {
        const montoNum = parseFloat(monto) || 0;
        const tcNum = parseFloat(tipoCambio) || 1;

        if (monedaPago === "ARS" && monedaDeuda === "ARS") {
            return { importe: montoNum, importeDolares: null };
        }
        if (monedaPago === "USD" && monedaDeuda === "USD") {
            return { importe: montoNum * tcNum, importeDolares: montoNum };
        }
        if (monedaPago === "ARS" && monedaDeuda === "USD") {
            return { importe: montoNum, importeDolares: montoNum / tcNum };
        }
        // USD → ARS
        return { importe: montoNum * tcNum, importeDolares: montoNum };
    };

    // Generar texto del banner informativo
    const getBannerInfo = () => {
        const montoNum = parseFloat(monto);
        const tcNum = parseFloat(tipoCambio);
        if (!montoNum || montoNum <= 0 || (necesitaTC && (!tcNum || tcNum <= 0))) return null;

        const fmtARS = (v) => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmtUSD = (v) => "U$D " + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (monedaPago === "USD" && monedaDeuda === "USD") {
            return <>Se descontarán <strong>{fmtUSD(montoNum)}</strong> de la deuda en dólares. Equivalencia en pesos: <strong>{fmtARS(montoNum * tcNum)}</strong> (TC: {tipoCambio})</>;
        }
        if (monedaPago === "ARS" && monedaDeuda === "USD") {
            return <>Al pagar <strong>{fmtARS(montoNum)}</strong>, se descontarán <strong>{fmtUSD(montoNum / tcNum)}</strong> de la deuda en dólares (TC: {tipoCambio})</>;
        }
        if (monedaPago === "USD" && monedaDeuda === "ARS") {
            return <>Al pagar <strong>{fmtUSD(montoNum)}</strong>, se descontarán <strong>{fmtARS(montoNum * tcNum)}</strong> de la deuda en pesos (TC: {tipoCambio})</>;
        }
        return null; // ARS → ARS, no banner
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!proveedorId || !monto || parseFloat(monto) <= 0) {
            alert("Por favor complete el proveedor y un monto válido.");
            return;
        }
        // Validación de tipo de cambio cuando hay USD involucrado
        if (necesitaTC) {
            const tc = parseFloat(tipoCambio);
            if (!tc || tc <= 0) {
                alert("El tipo de cambio debe ser un valor mayor a 0 cuando hay dólares involucrados.");
                return;
            }
        }

        if (esCheque) {
            if (!banco || !numeroCheque || !fechaEmision || !fechaVencimiento) {
                alert("Por favor complete todos los datos del cheque.");
                return;
            }
            if (fechaVencimiento < fechaEmision) {
                alert("La fecha de cobro/vencimiento no puede ser anterior a la de emisión.");
                return;
            }
        }

        setLoading(true);
        try {
            const isEdit = !!pagoEditar;
            const { importe, importeDolares } = calcularImportes();

            const payload = {
                pago: {
                    id: pagoEditar?.id,
                    proveedor: { id: parseInt(proveedorId) },
                    importe: importe,
                    medio: medioPago,
                    fecha: fecha,
                    observaciones: observaciones.trim() || `Pago a proveedor en ${medioPago.toLowerCase()}`,
                    // Bimonetario
                    monedaPago: monedaPago,
                    moneda: monedaDeuda,
                    tipoCambio: necesitaTC ? parseFloat(tipoCambio) : null,
                    importeDolares: importeDolares,
                    // Datos de cheque si corresponde
                    banco: medioPago.includes("CHEQUE") ? banco : null,
                    numeroCheque: medioPago.includes("CHEQUE") ? numeroCheque : null,
                    librador: medioPago.includes("CHEQUE") ? librador : null,
                    fechaVenc: medioPago.includes("CHEQUE") ? fechaVencimiento : null
                },
                importesPorCompra: {} // Por ahora pago a cuenta general
            };

            const url = isEdit ? `${API_PAGOS}/${pagoEditar.id}` : API_PAGOS;
            const method = isEdit ? "PUT" : "POST";
            
            // Si es edición, el backend espera la entidad directamente, no el wrapper RegistrarPagoRequest
            const body = isEdit ? payload.pago : payload;

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const savedPago = await res.json();
                if (!pagoEditar && window.confirm("¡Pago registrado con éxito! ¿Deseas descargar la Orden de Pago ahora?")) {
                    await downloadOrdenPago(savedPago.id || pagoEditar?.id);
                }
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
    const bannerInfo = getBannerInfo();

    return (
        <div className="modal-overlay">
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="title-icon" style={{ padding: "8px", background: "#fff1f2", color: "#e11d48" }}>
                            <FiDollarSign />
                        </div>
                        <h2>{pagoEditar ? "Editar Pago" : "Registrar Pago a Proveedor"}</h2>
                    </div>
                    <button onClick={onClose} className="modal-close"><FiX /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                 <div className="form-group">
                                    <label className="form-label"><FiDollarSign /> Monto a Pagar {monedaPago === "USD" ? "(USD)" : "(ARS)"} *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="modern-input"
                                        value={monto}
                                        onChange={e => setMonto(e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        onFocus={(e) => e.target.select()}
                                        placeholder={monedaPago === "USD" ? "0.00 dólares" : "0.00 pesos"}
                                        required
                                        disabled={!!pagoEditar}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label"><FiCreditCard /> Fecha del Pago *</label>
                                    <input
                                        type="date"
                                        className="modern-input"
                                        value={fecha}
                                        onChange={e => setFecha(e.target.value)}
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

                            {/* Sección Bimonetaria */}
                            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", background: "#f1f5f9", padding: "12px", borderRadius: "8px", marginTop: "10px", marginBottom: "15px" }}>
                                <div className="form-group">
                                    <label className="form-label" style={{color: "#334155"}}>Moneda del Pago:</label>
                                    <select 
                                        className="modern-input"
                                        value={monedaPago}
                                        onChange={e => setMonedaPago(e.target.value)}
                                    >
                                        <option value="ARS">Pesos (ARS)</option>
                                        <option value="USD">Dólares (USD)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{color: "#334155"}}>Aplicar a deuda en:</label>
                                    <select 
                                        className="modern-input"
                                        value={monedaDeuda}
                                        onChange={e => setMonedaDeuda(e.target.value)}
                                    >
                                        <option value="ARS">Pesos (ARS)</option>
                                        <option value="USD">Dólares (USD)</option>
                                    </select>
                                </div>

                                {necesitaTC && (
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{color: "#334155"}}>Tipo de Cambio (referencia) *</label>
                                        <input
                                            type="number"
                                            className="modern-input"
                                            value={tipoCambio}
                                            onChange={e => setTipoCambio(e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            onFocus={(e) => e.target.select()}
                                            step="0.01"
                                            min="1"
                                            required
                                            placeholder="Ej: 1395"
                                        />
                                    </div>
                                )}

                                {bannerInfo && (
                                    <div style={{ gridColumn: '1 / -1', marginTop: "4px", padding: "10px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", color: "#065f46", fontSize: "0.9rem" }}>
                                        <strong>Equivalencia Monetaria:</strong> {bannerInfo}
                                    </div>
                                )}
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
                            {loading ? "Guardando..." : (pagoEditar ? "Guardar Cambios" : "Confirmar Pago")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
