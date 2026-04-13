import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiSave, FiX } from "react-icons/fi";
import ProductoFormModal from "./ProductoFormModal";
import { apiFetch } from "../utils/api";
import "../index.css";

const API_PROD = "/api/productos";
const API_COMPRA = "/api/compras";

export default function CompraFormModal({ proveedor, onClose, onSaved, compraEditar = null }) {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        anotaciones: "",
        items: [{ producto: null, cantidad: 1, precioUnitario: 0, descuento: 0 }],
        estado: "PENDIENTE",
        incluyeIva: false,
        porcentajeIva: 21,
        descuentoTipo: "PORCENTAJE",
        descuentoValor: 0,
        moneda: "ARS",
        tipoCambio: 1.0
    });

    // Estado para Creación Rápida de Producto
    const [quickProdOpen, setQuickProdOpen] = useState(false);
    const [pendingItemIdx, setPendingItemIdx] = useState(null);

    // Estado para el buscador de productos por fila
    const [searchTerms, setSearchTerms] = useState({}); // { idx: "nombre..." }
    const [showResults, setShowResults] = useState({}); // { idx: true/false }

    const fetchConfig = async () => {
        try {
            const res = await apiFetch("/api/configuracion");
            if (res.ok) {
                const config = await res.json();
                if (config.porcentajeIvaDefault !== undefined && config.porcentajeIvaDefault !== null && !compraEditar) {
                    setForm(f => ({ ...f, porcentajeIva: config.porcentajeIvaDefault }));
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchProds = async () => {
        try {
            const res = await apiFetch(API_PROD);
            if (res.ok) {
                const data = await res.json();
                setProductos(data);
                
                // Si estamos editando, inicializar los searchTerms una vez que tenemos los productos
                if (compraEditar && compraEditar.items) {
                    const terms = {};
                    compraEditar.items.forEach((it, idx) => {
                        if (it.producto) {
                            const p = data.find(p => p.id === it.producto.id);
                            if (p) terms[idx] = `${p.nombre} (${p.sku || 'S/S'})`;
                        }
                    });
                    setSearchTerms(terms);
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchConfig();
        if (compraEditar) {
            setForm({
                fecha: compraEditar.fecha ? compraEditar.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
                anotaciones: compraEditar.anotaciones || "",
                estado: compraEditar.estado || "PENDIENTE",
                incluyeIva: !!compraEditar.incluyeIva,
                porcentajeIva: compraEditar.porcentajeIva || 21,
                descuentoTipo: compraEditar.descuentoTipo || "PORCENTAJE",
                descuentoValor: compraEditar.descuentoValor || 0,
                moneda: compraEditar.moneda || "ARS",
                tipoCambio: compraEditar.tipoCambio || 1.0,
                items: compraEditar.items.map(it => {
                    const isUSD = (compraEditar.moneda === "USD");
                    return {
                        producto: it.producto?.id || null,
                        cantidad: it.cantidad,
                        precioUnitario: isUSD && it.precioUnitarioUSD ? it.precioUnitarioUSD : it.precioUnitario,
                        descuento: it.descuento || 0
                    };
                })
            });
        }
        fetchProds();
    }, [compraEditar]);

    const addItem = () => {
        setForm(f => ({ ...f, items: [...f.items, { producto: null, cantidad: 1, precioUnitario: 0, descuento: 0 }] }));
    };

    const removeItem = (idx) => {
        setForm(f => {
            const items = [...f.items];
            items.splice(idx, 1);
            return { ...f, items };
        });
        const newSearchTerms = { ...searchTerms };
        delete newSearchTerms[idx];
        setSearchTerms(newSearchTerms);
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
                    items[idx].precioUnitario = form.moneda === "USD" ? (prod.precioCostoUSD || 0) : (prod.precioCosto || 0);
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

    const calculateTotals = () => {
        // 1. Subtotal bruto (suma de ítems sin descuentos)
        const subtotalBruto = form.items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitario), 0);
        // 2. Descuento por ítems
        const descuentoItems = form.items.reduce((acc, it) => {
            const lineTotal = it.cantidad * it.precioUnitario;
            return acc + (lineTotal * (it.descuento || 0) / 100);
        }, 0);
        const subtotalNeto = subtotalBruto - descuentoItems;
        // 3. Descuento global
        let descuentoGlobal = 0;
        if (form.descuentoValor > 0) {
            descuentoGlobal = form.descuentoTipo === "PORCENTAJE"
                ? subtotalNeto * (form.descuentoValor / 100)
                : Number(form.descuentoValor);
        }
        const baseImponible = subtotalNeto - descuentoGlobal;
        // 4. IVA
        let ivaImporte = 0;
        const calcPorcentaje = Number(form.porcentajeIva) || 0;
        if (form.incluyeIva) {
            ivaImporte = baseImponible * (calcPorcentaje / 100);
        }

        const isUSD = form.moneda === "USD";
        const tc = isUSD ? (Number(form.tipoCambio) || 1) : 1;

        return {
            subtotalBrutoInput: subtotalBruto,
            descuentoItemsInput: descuentoItems,
            subtotalNetoInput: subtotalNeto,
            descuentoGlobalInput: descuentoGlobal,
            baseImponibleInput: baseImponible,
            ivaImporteInput: ivaImporte,
            totalInput: baseImponible + ivaImporte,

            // Conversion a ARS obligatoria si es USD
            subtotalBrutoARS: subtotalBruto * tc,
            descuentoItemsARS: descuentoItems * tc,
            descuentoGlobalARS: descuentoGlobal * tc,
            ivaImporteARS: ivaImporte * tc,
            totalARS: (baseImponible + ivaImporte) * tc,
            
            // Dolares puros
            totalDolares: isUSD ? (baseImponible + ivaImporte) : 0
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.items.some(it => !it.producto)) return alert("Seleccioná todos los productos.");

        const totals = calculateTotals();
        const isUSD = form.moneda === "USD";
        const tc = isUSD ? (Number(form.tipoCambio) || 1) : 1;

        const payload = {
            proveedor: { id: proveedor.id },
            fecha: new Date(form.fecha).toISOString(),
            anotaciones: form.anotaciones,
            
            subtotal: totals.subtotalBrutoARS,
            ivaImporte: totals.ivaImporteARS,
            porcentajeIva: Number(form.porcentajeIva) || 0,
            incluyeIva: form.incluyeIva,
            descuentoTipo: form.descuentoTipo,
            descuentoValor: form.descuentoValor,
            descuentoImporte: totals.descuentoItemsARS + totals.descuentoGlobalARS,
            total: totals.totalARS,
            
            moneda: form.moneda,
            tipoCambio: tc,
            totalDolares: totals.totalDolares,

            estado: form.estado,
            items: form.items.map(it => {
                const subtotalBrutoLocal = Number(it.cantidad) * Number(it.precioUnitario) * (1 - (it.descuento || 0) / 100);
                return {
                    producto: { id: it.producto },
                    cantidad: Number(it.cantidad),
                    precioUnitario: isUSD ? (Number(it.precioUnitario) * tc) : Number(it.precioUnitario),
                    precioUnitarioUSD: isUSD ? Number(it.precioUnitario) : 0,
                    descuento: Number(it.descuento || 0),
                    subtotal: subtotalBrutoLocal * tc
                };
            })
        };

        setSaving(true);
        try {
            const url = compraEditar ? `${API_COMPRA}/${compraEditar.id}` : API_COMPRA;
            const method = compraEditar ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });
            if (res.ok) { onSaved(); }
            else { throw new Error(await res.text()); }
        } catch (err) {
            alert("Error al guardar: " + err.message);
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
                        <h2>{compraEditar ? `Editar Compra Nº ${compraEditar.numero}` : `Registrar Compra a ${proveedor?.nombre || "Proveedor"}`}</h2>
                        <button className="modal-close" onClick={onClose}><FiX /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="modal-content">
                        <div className="form-grid" style={{ marginBottom: "15px", gridTemplateColumns: "1fr 1.5fr 1fr" }}>
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
                                <label className="form-label">Estado</label>
                                <select 
                                    className="modern-input"
                                    value={form.estado}
                                    onChange={e => setForm({ ...form, estado: e.target.value })}
                                >
                                    <option value="PENDIENTE">SIN PRECIO (Pendiente)</option>
                                    <option value="CONFIRMADA">CONFIRMADA (Cierra stock y tesorería)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Anotaciones</label>
                                <input
                                    className="modern-input"
                                    value={form.anotaciones}
                                    onChange={e => setForm({ ...form, anotaciones: e.target.value })}
                                    placeholder="Nº Factura, etc."
                                />
                            </div>
                        </div>

                        <div className="form-grid" style={{ marginBottom: "15px", gridTemplateColumns: "1fr 1fr 2fr", background: "#f1f5f9", padding: "12px", borderRadius: "8px" }}>
                            <div className="form-group">
                                <label className="form-label" style={{color: "#334155"}}>Moneda Facturada</label>
                                <select 
                                    className="modern-input"
                                    value={form.moneda}
                                    onChange={e => setForm({ ...form, moneda: e.target.value })}
                                >
                                    <option value="ARS">Pesos (ARS)</option>
                                    <option value="USD">Dólares (USD)</option>
                                </select>
                            </div>
                            {form.moneda === "USD" && (
                                <div className="form-group">
                                    <label className="form-label" style={{color: "#334155"}}>Tipo de Cambio (T/C)</label>
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={form.tipoCambio}
                                        onChange={e => setForm({ ...form, tipoCambio: e.target.value })}
                                        onWheel={(e) => e.target.blur()}
                                        step="0.01"
                                        min="1"
                                        required
                                    />
                                </div>
                            )}
                            <div></div>
                        </div>

                        <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", color: "var(--text)", whiteSpace: "nowrap" }}>
                                <input
                                    type="checkbox"
                                    checked={form.incluyeIva}
                                    onChange={e => setForm({ ...form, incluyeIva: e.target.checked })}
                                    style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                                />
                                Incluye IVA
                            </label>
                            {form.incluyeIva && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <label style={{ fontSize: "0.85rem", color: "var(--muted)", whiteSpace: "nowrap" }}>Porcentaje:</label>
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={form.porcentajeIva}
                                        onChange={e => setForm({ ...form, porcentajeIva: e.target.value === '' ? '' : e.target.value })}
                                        onWheel={(e) => e.target.blur()}
                                        style={{ width: "80px", padding: "6px 10px" }}
                                        placeholder="21"
                                        step="0.01"
                                    />
                                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>%</span>
                                </div>
                            )}
                        </div>

                        <div className="items-container">
                            <label className="form-label" style={{ fontWeight: "bold" }}>Items de la Compra</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 40px", gap: "10px", marginBottom: "6px", padding: "0 4px" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "600" }}>Producto</span>
                                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "600" }}>Cant.</span>
                                <span style={{ fontSize: "0.75rem", color: form.moneda==="USD"?"#059669":"var(--muted)", fontWeight: "600" }}>{form.moneda==="USD" ? "Precio Unit. U$D" : "Precio Unit. ($)"}</span>
                                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "600" }}>Desc. %</span>
                                <span></span>
                            </div>
                            {form.items.map((it, idx) => (
                                <div key={idx} className="item-row" style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 40px", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
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
                                        required={form.estado === 'CONFIRMADA'}
                                    />
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={it.descuento}
                                        onChange={e => updateItem(idx, 'descuento', e.target.value)}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        style={{ textAlign: "center" }}
                                    />
                                    <button type="button" className="icon-btn delete" onClick={() => removeItem(idx)}><FiTrash2 /></button>
                                </div>
                            ))}
                            <button type="button" className="btn-secondary" style={{ width: "100%", marginTop: "5px" }} onClick={addItem}><FiPlus /> Agregar Ítem</button>
                        </div>

                        {/* Descuento Global */}
                        <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "15px", padding: "12px 16px", background: "#fef7f0", borderRadius: "10px", border: "1px solid #fed7aa" }}>
                            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#92400e", whiteSpace: "nowrap" }}>Descuento adicional:</span>
                            <select
                                className="modern-input"
                                value={form.descuentoTipo}
                                onChange={e => setForm({ ...form, descuentoTipo: e.target.value })}
                                style={{ width: "130px", padding: "6px 10px" }}
                            >
                                <option value="PORCENTAJE">Porcentaje %</option>
                                <option value="MONTO">Monto fijo $</option>
                            </select>
                            <input
                                type="number"
                                className="modern-input"
                                value={form.descuentoValor}
                                onChange={e => setForm({ ...form, descuentoValor: e.target.value === '' ? '' : e.target.value })}
                                onWheel={(e) => e.target.blur()}
                                style={{ width: "100px", padding: "6px 10px" }}
                                placeholder="0"
                                min="0"
                                step="0.01"
                            />
                            <span style={{ fontSize: "0.8rem", color: "#92400e" }}>{form.descuentoTipo === "PORCENTAJE" ? "%" : "$"}</span>
                        </div>

                        <div className="modal-summary" style={{ marginTop: "1.5rem", padding: "1.5rem", background: "var(--bg)", borderRadius: "12px", textAlign: "right" }}>
                            {(() => { 
                                const t = calculateTotals(); 
                                const isUSD = form.moneda === "USD";
                                const symb = isUSD ? "U$D" : "$";
                            return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", color: "var(--muted)" }}>
                                    <span>Subtotal bruto:</span>
                                    <span style={{ fontWeight: "600", minWidth: "120px" }}>{symb} {t.subtotalBrutoInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                {t.descuentoItemsInput > 0 && (
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", color: "#e11d48" }}>
                                        <span>Desc. por ítems:</span>
                                        <span style={{ fontWeight: "600", minWidth: "120px" }}>- {symb} {t.descuentoItemsInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {t.descuentoGlobalInput > 0 && (
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", color: "#e11d48" }}>
                                        <span>Desc. adicional ({form.descuentoTipo === "PORCENTAJE" ? form.descuentoValor + "%" : symb + " " + form.descuentoValor}):</span>
                                        <span style={{ fontWeight: "600", minWidth: "120px" }}>- {symb} {t.descuentoGlobalInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {form.incluyeIva && (
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", color: "#f97316" }}>
                                        <span>IVA ({form.porcentajeIva}%) s/ {symb} {t.baseImponibleInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}:</span>
                                        <span style={{ fontWeight: "600", minWidth: "120px" }}>+ {symb} {t.ivaImporteInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", color: isUSD ? "#059669" : "var(--primary)", marginTop: "8px", borderTop: "2px solid #ddd", paddingTop: "8px" }}>
                                    <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{isUSD ? "Total Facturado USD:" : "Total Final ARS:"}</span>
                                    <span style={{ fontSize: "1.4rem", fontWeight: "800", minWidth: "120px" }}>{symb} {t.totalInput.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                {isUSD && (
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", color: "#64748b", marginTop: "4px" }}>
                                        <span style={{ fontSize: "0.9rem" }}>Equivalente convertido en Pesos (T/C {form.tipoCambio}):</span>
                                        <span style={{ fontSize: "0.9rem", fontWeight: "600", minWidth: "120px" }}>$ {t.totalARS.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                            </div>
                            ); })()}
                        </div>

                        <div className="modal-actions" style={{ marginTop: "2rem" }}>
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" disabled={saving} className="btn-primary"><FiSave /> {saving ? "Guardando..." : (compraEditar ? "Guardar Cambios" : "Confirmar Compra")}</button>
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
