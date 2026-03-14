import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiSave, FiX } from "react-icons/fi";
import ProductoFormModal from "./ProductoFormModal";
import { apiFetch } from "../utils/api";
import "../index.css";

const API_PROD = "/api/productos";
const API_COMPRA = "/api/compras";

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

    // Estado para el buscador de productos por fila
    const [searchTerms, setSearchTerms] = useState({}); // { idx: "nombre..." }
    const [showResults, setShowResults] = useState({}); // { idx: true/false }

    const fetchProds = async () => {
        try {
            const res = await apiFetch(API_PROD);
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
            setShowResults(prev => ({ ...prev, [idx]: false }));
            return;
        }

        setForm(f => {
            const items = [...f.items];
            items[idx] = { ...items[idx], [key]: val };
            if (key === 'producto') {
                const prod = productos.find(p => String(p.id) === String(val));
                if (prod) {
                    items[idx].precioUnitario = prod.precioCosto || 0;
                    setSearchTerms(prev => ({ ...prev, [idx]: `${prod.nombre} (${prod.sku || 'S/S'})` }));
                }
                setShowResults(prev => ({ ...prev, [idx]: false }));
            }
            return { ...f, items };
        });
    };

    const getFilteredProducts = (term) => {
        if (!term) return [];
        const t = term.toLowerCase();
        return productos.filter(p =>
            p.nombre.toLowerCase().includes(t) ||
            (p.sku && p.sku.toLowerCase().includes(t))
        ).slice(0, 8); // Limitar resultados para mejor rendimiento
    };

    const handleQuickProductSave = async (payload) => {
        try {
            const res = await apiFetch(API_PROD, {
                method: "POST",
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
            const res = await apiFetch(API_COMPRA, {
                method: "POST",
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
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type="text"
                                            className="modern-input"
                                            placeholder="🔍 Buscar producto o SKU..."
                                            value={searchTerms[idx] || ""}
                                            autoComplete="off"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSearchTerms(prev => ({ ...prev, [idx]: val }));
                                                setShowResults(prev => ({ ...prev, [idx]: true }));
                                                if (!val) updateItem(idx, 'producto', null);
                                            }}
                                            onFocus={() => setShowResults(prev => ({ ...prev, [idx]: true }))}
                                        />
                                        {showResults[idx] && (searchTerms[idx] || "").length > 0 && (
                                            <div className="search-dropdown" style={{
                                                position: "absolute",
                                                top: "100%",
                                                left: 0,
                                                right: 0,
                                                background: "white",
                                                border: "1px solid var(--border)",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                zIndex: 1000,
                                                maxHeight: "250px",
                                                overflowY: "auto"
                                            }}>
                                                <div
                                                    style={{ padding: "10px", color: "var(--primary)", fontWeight: "bold", cursor: "pointer", borderBottom: "1px solid #eee" }}
                                                    onClick={() => updateItem(idx, 'producto', 'NEW')}
                                                >
                                                    + Crear nuevo producto: "{searchTerms[idx]}"
                                                </div>
                                                {getFilteredProducts(searchTerms[idx]).map(p => (
                                                    <div
                                                        key={p.id}
                                                        style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #f8f8f8" }}
                                                        onMouseDown={() => updateItem(idx, 'producto', p.id)} // onMouseDown para que ocurra antes del blur
                                                        className="search-item-hover"
                                                    >
                                                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{p.nombre}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>SKU: {p.sku || 'S/S'} | Stock: {p.stock}</div>
                                                    </div>
                                                ))}
                                                {getFilteredProducts(searchTerms[idx]).length === 0 && (
                                                    <div style={{ padding: "10px", color: "var(--muted)", fontSize: "0.85rem" }}>No se encontraron coincidencias.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={it.cantidad}
                                        onChange={e => updateItem(idx, 'cantidad', e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="Cant."
                                        min="1"
                                        required
                                    />
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={it.precioUnitario}
                                        onChange={e => updateItem(idx, 'precioUnitario', e.target.value)}
                                        onWheel={(e) => e.target.blur()}
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
