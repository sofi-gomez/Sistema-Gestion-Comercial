import React, { useState, useEffect } from "react";
import "../index.css";

export default function ProductoFormModal({ producto, onClose, onSave, cotizacion, productosExistentes = [] }) {
    const [form, setForm] = useState({
        sku: "",
        nombre: "",
        descripcion: "",
        precioCosto: "",
        precioVenta: "",
        precioCostoUSD: "",
        precioVentaUSD: "",
        stock: "",
        unidadMedida: "",
        activo: true,
        fechaVencimiento: "",
        porcentajeIva: 0,
        porcentajeUtilidad: 0,
    });
    const [saving, setSaving] = useState(false);
    const [skuError, setSkuError] = useState("");

    const formatDate = (iso) => {
        if (!iso) return "";
        return iso.split("T")[0]; // ejemplo: "2025-12-06"
    };

    useEffect(() => {
        const rate = parseFloat(cotizacion) || 0;
        if (producto) {
            let pCosto = producto.precioCosto?.toString() || "";
            let pCostoUSD = producto.precioCostoUSD?.toString() || "";

            // Si el producto tiene costo USD pero no ARS, lo calculamos al cargar
            if ((!pCosto || pCosto === "0") && pCostoUSD && rate > 0) {
                pCosto = (parseFloat(pCostoUSD) * rate).toFixed(2);
            }

            let pVenta = producto.precioVenta?.toString() || "";
            let pVentaUSD = producto.precioVentaUSD?.toString() || "";

            const iva = producto.porcentajeIva || 0;
            const util = producto.porcentajeUtilidad || 0;

            // Si los precios de venta son 0 o faltan, calculamos los sugeridos
            if ((!pVenta || pVenta === "0") && parseFloat(pCosto) > 0) {
                pVenta = (parseFloat(pCosto) * (1 + iva / 100) * (1 + util / 100)).toFixed(2);
            }
            if ((!pVentaUSD || pVentaUSD === "0") && parseFloat(pCostoUSD) > 0) {
                pVentaUSD = (parseFloat(pCostoUSD) * (1 + iva / 100) * (1 + util / 100)).toFixed(2);
            }

            setForm({
                sku: producto.sku || "",
                nombre: producto.nombre || "",
                descripcion: producto.descripcion || "",
                precioCosto: pCosto,
                precioVenta: pVenta,
                precioCostoUSD: pCostoUSD,
                precioVentaUSD: pVentaUSD,
                stock: producto.stock ? Math.floor(producto.stock).toString() : "",
                unidadMedida: producto.unidadMedida || "",
                activo: producto.activo ?? true,
                fechaVencimiento: formatDate(producto.fechaVencimiento),
                porcentajeIva: iva,
                porcentajeUtilidad: util,
            });
        } else {
            setForm({
                sku: "",
                nombre: "",
                descripcion: "",
                precioCosto: "",
                precioVenta: "",
                precioCostoUSD: "",
                precioVentaUSD: "",
                stock: "",
                unidadMedida: "",
                activo: true,
                fechaVencimiento: "",
                porcentajeIva: 0,
                porcentajeUtilidad: 0,
            });
        }
    }, [producto, cotizacion]);

    // Validación de SKU duplicado en tiempo real
    useEffect(() => {
        const skuActual = (form.sku || "").toString().trim().toLowerCase();
        if (skuActual && (productosExistentes || []).length > 0) {
            const duplicate = productosExistentes.find(p => {
                if (!p || !p.sku) return false;
                const skuExistente = p.sku.toString().trim().toLowerCase();
                return skuExistente === skuActual && p.id !== producto?.id;
            });

            if (duplicate) {
                setSkuError(`Este SKU ya está en uso por: ${duplicate.nombre}`);
            } else {
                setSkuError("");
            }
        } else {
            setSkuError("");
        }
    }, [form.sku, productosExistentes, producto]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value.replace(",", "."); // Robustez con comas
        const rate = parseFloat(cotizacion) || 0;

        setForm((prev) => {
            const next = { ...prev, [name]: val };

            // 1. Sincronización de Costos entre USD y ARS
            if (name === "precioCostoUSD" && rate > 0) {
                const calculatedARS = parseFloat(val) * rate;
                next.precioCosto = calculatedARS > 0 ? calculatedARS.toFixed(2) : "";
            } else if (name === "precioCosto" && rate > 0) {
                const calculatedUSD = parseFloat(val) / rate;
                next.precioCostoUSD = calculatedUSD > 0 ? calculatedUSD.toFixed(2) : "";
            }

            // 2. Recálculo de Precios de Venta basado en Costo, IVA y Utilidad
            if (["precioCosto", "precioCostoUSD", "porcentajeIva", "porcentajeUtilidad"].includes(name)) {
                const costARS = parseFloat(next.precioCosto) || 0;
                const costUSD = parseFloat(next.precioCostoUSD) || 0;
                const iva = parseFloat(next.porcentajeIva) || 0;
                const util = parseFloat(next.porcentajeUtilidad) || 0;

                // Cálculo ARS
                const costWithIvaARS = costARS * (1 + iva / 100);
                next.precioVenta = costWithIvaARS > 0 ? (costWithIvaARS * (1 + util / 100)).toFixed(2) : "";

                // Cálculo USD
                if (costUSD > 0) {
                    const costWithIvaUSD = costUSD * (1 + iva / 100);
                    next.precioVentaUSD = (costWithIvaUSD * (1 + util / 100)).toFixed(2);
                } else {
                    next.precioVentaUSD = "";
                }
            }

            // 3. Sincronización manual de Precios de Venta
            if (name === "precioVentaUSD" && rate > 0) {
                next.precioVenta = (parseFloat(val) * rate).toFixed(2);
            } else if (name === "precioVenta" && rate > 0) {
                next.precioVentaUSD = (parseFloat(val) / rate).toFixed(2);
            }

            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (skuError) {
            alert("No se puede guardar: " + skuError);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                sku: (form.sku || "").toString().trim(), // Aseguramos SKU limpio
                precioCosto: form.precioCosto ? parseFloat(form.precioCosto) : 0,
                precioVenta: form.precioVenta ? parseFloat(form.precioVenta) : 0,
                precioCostoUSD: form.precioCostoUSD ? parseFloat(form.precioCostoUSD) : null,
                precioVentaUSD: form.precioVentaUSD ? parseFloat(form.precioVentaUSD) : null,
                stock: form.stock ? parseInt(form.stock, 10) : 0,
                fechaVencimiento: form.fechaVencimiento ? form.fechaVencimiento : null,
                porcentajeIva: parseFloat(form.porcentajeIva) || 0,
                porcentajeUtilidad: parseFloat(form.porcentajeUtilidad) || 0,
            };

            // Validar año de vencimiento si existe
            if (payload.fechaVencimiento) {
                const year = new Date(payload.fechaVencimiento).getFullYear();
                if (year < 2000 || year > 2100) {
                    alert("Por favor ingrese un año de vencimiento válido (entre 2000 y 2100).");
                    setSaving(false);
                    return;
                }
            }

            if (producto?.id) {
                payload.id = producto.id;
            }

            await onSave(payload);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{producto ? "Editar Producto" : "Nuevo Producto"}</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="form-grid">

                            <div className="form-group">
                                <label className="form-label">SKU *</label>
                                <input
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
                                    className={`modern-input ${skuError ? 'error' : ''}`}
                                    required
                                    style={skuError ? { borderColor: '#ef4444' } : {}}
                                />
                                {skuError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{skuError}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nombre *</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    className="modern-input"
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    className="modern-textarea"
                                    rows="2"
                                />
                            </div>

                            {/* SECCIÓN 2: VALORES EN PESOS ($ARS) */}
                            <div className="form-section">
                                <div className="form-section-title"> Valores en Pesos ($ARS)</div>
                                <div className="form-grid-inner">
                                    <div className="form-group">
                                        <label className="form-label">Costo Neto (ARS)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="precioCosto"
                                            value={form.precioCosto}
                                            onChange={handleChange}
                                            onWheel={(e) => e.target.blur()}
                                            onFocus={(e) => e.target.select()}
                                            className="modern-input"
                                            placeholder="Sin IVA"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Costo Real (+IVA)</label>
                                        <input
                                            type="text"
                                            value={`$ ${( (parseFloat(form.precioCosto) || 0) * (1 + (parseFloat(form.porcentajeIva) || 0) / 100) ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            className="modern-input"
                                            disabled
                                            style={{ background: "#f0f9ff", color: "#0369a1", fontWeight: "700", border: "1px solid #bae6fd" }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">% IVA</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="porcentajeIva"
                                            value={form.porcentajeIva}
                                            onChange={handleChange}
                                            onWheel={(e) => e.target.blur()}
                                            onFocus={(e) => e.target.select()}
                                            className="modern-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">% Utilidad Sugerida</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="porcentajeUtilidad"
                                            value={form.porcentajeUtilidad}
                                            onChange={handleChange}
                                            onWheel={(e) => e.target.blur()}
                                            onFocus={(e) => e.target.select()}
                                            className="modern-input"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label" style={{ color: "#16a34a", fontWeight: "700" }}>Precio de Venta Sugerido ($ARS)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="precioVenta"
                                            value={form.precioVenta}
                                            onChange={handleChange}
                                            onWheel={(e) => e.target.blur()}
                                            onFocus={(e) => e.target.select()}
                                            className="modern-input"
                                            style={{ borderColor: "#16a34a", background: "#f0fdf4", fontWeight: "700" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 3: VALORES EN DÓLARES (USD) */}
                            <div className="form-section" style={{ background: "#fffbeb", borderColor: "#fef3c7" }}>
                                <div className="form-section-title" style={{ color: "#92400e", borderColor: "#fde68a" }}> Valores en Dólares (USD)</div>
                                <div className="form-grid-inner">
                                    <div className="form-group">
                                        <label className="form-label">Costo USD Neto</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="precioCostoUSD"
                                            value={form.precioCostoUSD}
                                            onChange={handleChange}
                                            onWheel={(e) => e.target.blur()}
                                            onFocus={(e) => e.target.select()}
                                            className="modern-input"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Costo Real USD (+IVA)</label>
                                        <input
                                            type="text"
                                            value={`USD ${( (parseFloat(form.precioCostoUSD) || 0) * (1 + (parseFloat(form.porcentajeIva) || 0) / 100) ).toFixed(2)}`}
                                            className="modern-input"
                                            disabled
                                            style={{ background: "#fffcf0", color: "#92400e", fontWeight: "700", border: "1px solid #fde68a" }}
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">Precio de Venta USD</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="precioVentaUSD"
                                            value={form.precioVentaUSD}
                                            onChange={handleChange}
                                            onWheel={(e) => e.target.blur()}
                                            onFocus={(e) => e.target.select()}
                                            className="modern-input"
                                            style={{ borderColor: "#d97706", fontWeight: "600" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 4: INVENTARIO */}
                            <div className="form-group grid-span-1">
                                <label className="form-label">Stock Actual</label>
                                <input
                                    className="modern-input"
                                    type="number"
                                    name="stock"
                                    value={form.stock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    readOnly
                                    style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed", border: "1px dashed #ccc" }}
                                    title="El stock se actualiza automáticamente. Use la función de Ajuste si necesita corregirlo."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Unidad de Medida</label>
                                <input
                                    name="unidadMedida"
                                    value={form.unidadMedida}
                                    onChange={handleChange}
                                    className="modern-input"
                                    placeholder="unidades, bidón, etc."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Vencimiento</label>
                                <input
                                    type="date"
                                    name="fechaVencimiento"
                                    value={form.fechaVencimiento || ""}
                                    onChange={handleChange}
                                    className="modern-input"
                                />
                            </div>

                            <div className="form-group" style={{ justifyContent: "center" }}>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="activo"
                                        checked={form.activo}
                                        onChange={handleChange}
                                        className="modern-checkbox"
                                    />
                                    <span className="checkmark"></span>
                                    Producto activo
                                </label>
                            </div>

                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Guardando..." : (producto ? "Actualizar Producto" : "Crear Producto")}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
