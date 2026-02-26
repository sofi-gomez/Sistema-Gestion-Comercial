import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiSave, FiX } from "react-icons/fi";
import ProductoFormModal from "./ProductoFormModal";
import "../index.css";

const API_PROD = "http://localhost:8080/api/productos";
const API_COMPRA = "http://localhost:8080/api/compras";

export default function CompraFormModal({ proveedor, onClose, onSaved }) {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        anotaciones: "",
        items: [{ producto: null, cantidad: 1, precioUnitario: 0 }]
    });

    // Estado para Creación Rápida de Producto
    const [quickProdOpen, setQuickProdOpen] = useState(false);
    const [pendingItemIdx, setPendingItemIdx] = useState(null);

    const fetchProds = async () => {
        try {
            const res = await fetch(API_PROD);
            if (res.ok) setProductos(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchProds();
    }, []);

    const addItem = () => {
        setForm(f => ({ ...f, items: [...f.items, { producto: null, cantidad: 1, precioUnitario: 0 }] }));
    };

    const removeItem = (idx) => {
        setForm(f => {
            const items = [...f.items];
            items.splice(idx, 1);
            return { ...f, items };
        });
    };

    const updateItem = (idx, key, val) => {
        if (key === 'producto' && val === 'NEW') {
            setPendingItemIdx(idx);
            setQuickProdOpen(true);
            return;
        }

        setForm(f => {
            const items = [...f.items];
            items[idx] = { ...items[idx], [key]: val };
            if (key === 'producto') {
                const prod = productos.find(p => String(p.id) === String(val));
                if (prod) items[idx].precioUnitario = prod.precioCosto || 0;
            }
            return { ...f, items };
        });
    };

    const handleQuickProductSave = async (payload) => {
        try {
            const res = await fetch(API_PROD, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const newProd = await res.json();
                // 1. Recargar lista completa de productos
                await fetchProds();
                // 2. Auto-seleccionar el producto en la fila pendiente
                setForm(f => {
                    const items = [...f.items];
                    items[pendingItemIdx] = {
                        ...items[pendingItemIdx],
                        producto: newProd.id,
                        precioUnitario: newProd.precioCosto || 0
                    };
                    return { ...f, items };
                });
                setQuickProdOpen(false);
            } else {
                alert("Error al crear producto: " + (await res.text()));
            }
        } catch (e) { console.error(e); }
    };

    const calculateTotal = () => {
        return form.items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitario), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.items.some(it => !it.producto)) return alert("Seleccioná todos los productos.");

        const payload = {
            proveedor: { id: proveedor.id },
            fecha: new Date(form.fecha).toISOString(),
            anotaciones: form.anotaciones,
            total: calculateTotal(),
            items: form.items.map(it => ({
                producto: { id: it.producto },
                cantidad: Number(it.cantidad),
                precioUnitario: Number(it.precioUnitario),
                subtotal: Number(it.cantidad) * Number(it.precioUnitario)
            }))
        };

        setSaving(true);
        try {
            const res = await fetch(API_COMPRA, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) { onSaved(); }
            else { throw new Error(await res.text()); }
        } catch (err) {
            alert("Error al registrar: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !proveedor) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "1000px" }}>
                    <div className="modal-header">
                        <h2>Registrar Compra a {proveedor?.nombre || "Proveedor"}</h2>
                        <button className="modal-close" onClick={onClose}><FiX /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="modal-content">
                        <div className="form-grid" style={{ marginBottom: "20px" }}>
                            <div className="form-group">
                                <label className="form-label">Fecha de Compra</label>
                                <input
                                    type="date"
                                    className="modern-input"
                                    value={form.fecha}
                                    onChange={e => setForm({ ...form, fecha: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Anotaciones (Nº Factura, etc.)</label>
                                <input
                                    className="modern-input"
                                    value={form.anotaciones}
                                    onChange={e => setForm({ ...form, anotaciones: e.target.value })}
                                    placeholder="Ej: Factura A-0001"
                                />
                            </div>
                        </div>

                        <div className="items-container">
                            <label className="form-label" style={{ fontWeight: "bold" }}>Items de la Compra</label>
                            {form.items.map((it, idx) => (
                                <div key={idx} className="item-row" style={{ display: "grid", gridTemplateColumns: "1fr 100px 140px 40px", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                                    <select
                                        className="modern-input"
                                        value={it.producto || ""}
                                        onChange={e => updateItem(idx, 'producto', e.target.value)}
                                        required
                                        style={{ fontWeight: it.producto === 'NEW' ? 'bold' : 'normal' }}
                                    >
                                        <option value="">-- Seleccionar Producto --</option>
                                        <option value="NEW" style={{ color: "var(--primary)", fontWeight: "bold" }}>+ Nuevo Producto...</option>
                                        <hr />
                                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku || 'S/S'})</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={it.cantidad}
                                        onChange={e => updateItem(idx, 'cantidad', e.target.value)}
                                        placeholder="Cant."
                                        min="1"
                                        required
                                    />
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={it.precioUnitario}
                                        onChange={e => updateItem(idx, 'precioUnitario', e.target.value)}
                                        placeholder="Costo Unit."
                                        step="0.01"
                                        required
                                    />
                                    <button type="button" className="icon-btn delete" onClick={() => removeItem(idx)} disabled={form.items.length === 1}><FiTrash2 /></button>
                                </div>
                            ))}
                            <button type="button" className="btn-secondary" style={{ width: "100%", marginTop: "5px" }} onClick={addItem}><FiPlus /> Agregar Ítem</button>
                        </div>

                        <div className="modal-summary" style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--bg)", borderRadius: "12px", textAlign: "right" }}>
                            <p style={{ color: "var(--muted)", margin: 0 }}>Total de la Compra:</p>
                            <h2 style={{ margin: 0, color: "var(--primary)" }}>${calculateTotal().toLocaleString()}</h2>
                        </div>

                        <div className="modal-actions" style={{ marginTop: "2rem" }}>
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" disabled={saving} className="btn-primary"><FiSave /> {saving ? "Registrando..." : "Confirmar Compra"}</button>
                        </div>
                    </form>
                </div>
            </div>

            {quickProdOpen && (
                <ProductoFormModal
                    onClose={() => setQuickProdOpen(false)}
                    onSave={handleQuickProductSave}
                />
            )}
        </>
    );
}
