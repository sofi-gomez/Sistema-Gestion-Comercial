import React, { useState, useEffect } from "react";
import "../index.css";

export default function ProductoFormModal({ producto, onClose, onSave }) {
    const [form, setForm] = useState({
        sku: "",
        nombre: "",
        descripcion: "",
        precioCosto: "",
        precioVenta: "",
        stock: "",
        unidadMedida: "",
        activo: true,
        fechaVencimiento: "", // ← NUEVO CAMPO
    });
    const formatDate = (iso) => {
        if (!iso) return "";
        return iso.split("T")[0]; // ejemplo: "2025-12-06"
    };

    useEffect(() => {
        if (producto) {
            setForm({
                sku: producto.sku || "",
                nombre: producto.nombre || "",
                descripcion: producto.descripcion || "",
                precioCosto: producto.precioCosto?.toString() || "",
                precioVenta: producto.precioVenta?.toString() || "",
                stock: producto.stock ? Math.floor(producto.stock).toString() : "", // ✅ Redondear a entero
                unidadMedida: producto.unidadMedida || "",
                activo: producto.activo ?? true,
                fechaVencimiento: formatDate(producto.fechaVencimiento),
            });
        } else {
            setForm({
                sku: "",
                nombre: "",
                descripcion: "",
                precioCosto: "",
                precioVenta: "",
                stock: "",
                unidadMedida: "",
                activo: true,
                fechaVencimiento: "", // ← RESETEO FECHA
            });
        }
    }, [producto]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value;

        setForm((prev) => ({
            ...prev,
            [name]: val,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ...form,
            precioCosto: form.precioCosto ? parseFloat(form.precioCosto) : 0,
            precioVenta: form.precioVenta ? parseFloat(form.precioVenta) : 0,
            stock: form.stock ? parseInt(form.stock, 10) : 0, // ✅ Cambiar a parseInt para enteros
            fechaVencimiento: form.fechaVencimiento ? form.fechaVencimiento : null,

        };

        if (producto?.id) {
            payload.id = producto.id;
        }

        onSave(payload);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
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
                                    className="modern-input"
                                    required
                                />
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
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Precio Costo</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="precioCosto"
                                    value={form.precioCosto}
                                    onChange={handleChange}
                                    className="modern-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Precio Venta</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="precioVenta"
                                    value={form.precioVenta}
                                    onChange={handleChange}
                                    className="modern-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stock (unidades)</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    name="stock"
                                    value={form.stock}
                                    onChange={handleChange}
                                    className="modern-input"
                                    placeholder="Ej: 100"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Unidad de Medida</label>
                                <input
                                    name="unidadMedida"
                                    value={form.unidadMedida}
                                    onChange={handleChange}
                                    className="modern-input"
                                    placeholder="Ej: unidades, kg, litros"
                                />
                            </div>

                            {/* CAMPO FECHA DE VENCIMIENTO */}
                            <div className="form-group">
                                <label className="form-label">Fecha de Vencimiento</label>
                                <input
                                    type="date"
                                    name="fechaVencimiento"
                                    value={form.fechaVencimiento || ""}
                                    onChange={handleChange}
                                    className="modern-input"
                                />
                            </div>

                            <div className="form-group full-width">
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
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            {producto ? "Actualizar Producto" : "Crear Producto"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}