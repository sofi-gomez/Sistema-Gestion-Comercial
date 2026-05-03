import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { FiX, FiPlus, FiTrash2, FiSearch, FiCheck, FiZap } from "react-icons/fi";
import "../index.css";

export default function VentaRapidaModal({ onClose, onSaved }) {
    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        clienteNombre: "CONSUMIDOR FINAL",
        observaciones: "",
        items: [{ producto: null, cantidad: 1, precioVenta: 0 }]
    });

    const [medioPago, setMedioPago] = useState("EFECTIVO");

    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cotizacionDolar, setCotizacionDolar] = useState(0);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [searchTerms, setSearchTerms] = useState({});
    const [showResults, setShowResults] = useState({});
    
    const [clienteSearchTerm, setClienteSearchTerm] = useState("CONSUMIDOR FINAL");
    const [showClienteResults, setShowClienteResults] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);

    const getFilteredProducts = (term) => {
        if (!term) return [];
        const t = term.toLowerCase();
        return productos.filter(p =>
            p.nombre.toLowerCase().includes(t) ||
            (p.sku && p.sku.toLowerCase().includes(t))
        ).slice(0, 8);
    };

    const getFilteredClientes = (term) => {
        if (!term) return clientes.slice(0, 8);
        const t = term.toLowerCase();
        return clientes.filter(c =>
            (c.nombre && c.nombre.toLowerCase().includes(t)) ||
            (c.documento && c.documento.toLowerCase().includes(t))
        ).slice(0, 8);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [productsRes, clientsRes, configRes] = await Promise.all([
                    apiFetch("/api/productos"),
                    apiFetch("/api/clientes"),
                    apiFetch("/api/configuracion/cotizacion-dolar")
                ]);
                setProductos(productsRes.ok ? await productsRes.json() : []);
                setClientes(clientsRes.ok ? await clientsRes.json() : []);
                if (configRes.ok) {
                    const data = await configRes.json();
                    setCotizacionDolar(data.valor || 0);
                }
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { producto: null, cantidad: 1, precioVenta: 0 }]
        }));
    };

    const removeItem = (index) => {
        setForm(prev => {
            const items = [...prev.items];
            items.splice(index, 1);
            return { ...prev, items };
        });
        setSearchTerms(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
        setShowResults(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    const updateItem = (index, key, value) => {
        setForm(prev => {
            const items = [...prev.items];
            items[index] = { ...items[index], [key]: value };

            if (key === 'producto' && value) {
                const prod = value;
                setSearchTerms(prevTerms => ({
                    ...prevTerms,
                    [index]: prod.nombre + (prod.sku ? ` (${prod.sku})` : "")
                }));
                setShowResults(prevRes => ({ ...prevRes, [index]: false }));
                // Set default price
                items[index].precioVenta = prod.precioVenta || 0;
            } else if (key === 'producto' && !value) {
                setShowResults(prevRes => ({ ...prevRes, [index]: false }));
                items[index].precioVenta = 0;
            }

            return { ...prev, items };
        });
    };

    const calcularTotal = () => {
        return form.items.reduce((acc, item) => {
            const qty = parseFloat(item.cantidad) || 0;
            const price = parseFloat(item.precioVenta) || 0;
            return acc + (qty * price);
        }, 0);
    };

    const totalCalculado = calcularTotal();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!form.items || form.items.length === 0) {
            alert("Debe agregar al menos un ítem.");
            return;
        }

        for (let i = 0; i < form.items.length; i++) {
            const item = form.items[i];
            if (!item.producto) {
                alert(`El ítem ${i + 1} no tiene un producto seleccionado.`);
                return;
            }
            if (item.cantidad <= 0) {
                alert(`El ítem ${i + 1} debe tener una cantidad mayor a 0.`);
                return;
            }
            if (item.cantidad > item.producto.stock) {
                alert(`Stock insuficiente para ${item.producto.nombre}. Disponible: ${item.producto.stock}`);
                return;
            }
        }

        setSaving(true);
        try {
            const preciosMap = {};
            const itemsToSave = form.items.map(it => {
                preciosMap[it.producto.id] = parseFloat(it.precioVenta) || 0;
                return {
                    producto: { id: it.producto.id },
                    cantidad: it.cantidad,
                    notas: ""
                };
            });

            const remitoRequest = {
                fecha: form.fecha + "T00:00:00",
                cliente: selectedCliente ? { id: selectedCliente.id } : null,
                clienteNombre: selectedCliente ? selectedCliente.nombre : form.clienteNombre,
                observaciones: form.observaciones,
                items: itemsToSave
            };

            const payload = {
                remito: remitoRequest,
                precios: preciosMap,
                mediosPago: [
                    {
                        medio: medioPago,
                        importe: totalCalculado
                    }
                ],
                cotizacionDolar: cotizacionDolar
            };

            const res = await apiFetch("/api/ventas/rapida", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Error al procesar la venta rápida");
            }

            const remitoCreado = await res.json();
            
            // Confirmación
            const imprimir = window.confirm(`¡Venta rápida registrada con éxito por $${totalCalculado.toLocaleString()}!\n\n¿Desea imprimir el comprobante?`);
            if (imprimir) {
                window.open(`/api/remitos/${remitoCreado.id}/pdf`, "_blank");
            }
            
            onSaved();
        } catch (err) {
            console.error("Error guardando:", err);
            alert("Error: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="modal-header" style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FiZap style={{ color: '#fbbf24', fontSize: '1.5rem', fill: '#fbbf24' }} />
                        <h2 style={{ color: 'white', margin: 0 }}>Venta Rápida</h2>
                    </div>
                    <button className="modal-close" onClick={onClose} style={{ color: 'white' }}><FiX /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        {/* DATOS BÁSICOS */}
                        <div className="form-section">
                            <div className="form-grid-inner" style={{ gridTemplateColumns: '2fr 1fr' }}>
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label className="form-label">Cliente (Opcional)</label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="🔍 Buscar cliente (vacío = Consumidor Final)"
                                        value={clienteSearchTerm}
                                        autoComplete="off"
                                        onChange={(e) => {
                                            setClienteSearchTerm(e.target.value);
                                            setForm(prev => ({ ...prev, clienteNombre: e.target.value }));
                                            setSelectedCliente(null);
                                            setShowClienteResults(true);
                                        }}
                                        onFocus={() => setShowClienteResults(true)}
                                        onBlur={() => setTimeout(() => setShowClienteResults(false), 200)}
                                    />
                                    {showClienteResults && (
                                        <ul className="autocomplete-dropdown" style={{ width: '100%', top: '100%' }}>
                                            {getFilteredClientes(clienteSearchTerm).map(c => (
                                                <li
                                                    key={c.id}
                                                    onClick={() => {
                                                        setSelectedCliente(c);
                                                        setClienteSearchTerm(c.nombre);
                                                        setForm(prev => ({ ...prev, clienteNombre: c.nombre }));
                                                        setShowClienteResults(false);
                                                    }}
                                                >
                                                    <div className="prod-name">{c.nombre}</div>
                                                    <div className="prod-sku">{c.documento && `Documento: ${c.documento}`}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Fecha</label>
                                    <input
                                        type="date"
                                        className="modern-input"
                                        value={form.fecha}
                                        onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PRODUCTOS */}
                        <div className="form-section" style={{ background: '#f8fafc', borderColor: '#e2e8f0', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div className="form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Productos a Facturar</div>
                            </div>
                            
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '45%' }}>Producto</th>
                                        <th style={{ width: '15%' }}>Cantidad</th>
                                        <th style={{ width: '20%' }}>P. Unitario ($)</th>
                                        <th style={{ width: '15%' }}>Subtotal</th>
                                        <th style={{ width: '5%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    className="modern-input"
                                                    placeholder="🔍 Buscar producto por SKU o Nombre"
                                                    value={searchTerms[index] || ""}
                                                    autoComplete="off"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSearchTerms(prev => ({ ...prev, [index]: val }));
                                                        if (!val) updateItem(index, 'producto', null);
                                                    }}
                                                    onFocus={() => setShowResults(prev => ({ ...prev, [index]: true }))}
                                                    onBlur={() => setTimeout(() => setShowResults(prev => ({ ...prev, [index]: false })), 200)}
                                                />
                                                {showResults[index] && (searchTerms[index] || "").length > 0 && (
                                                    <ul className="autocomplete-dropdown" style={{ width: '100%', top: '100%' }}>
                                                        {getFilteredProducts(searchTerms[index]).map(p => (
                                                            <li
                                                                key={p.id}
                                                                onClick={() => updateItem(index, 'producto', p)}
                                                            >
                                                                <div className="prod-name">{p.nombre}</div>
                                                                <div className="prod-sku">
                                                                    SKU: {p.sku || 'S/S'} | 
                                                                    <span style={{ color: p.stock > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}> Stock: {p.stock}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                        {getFilteredProducts(searchTerms[index]).length === 0 && (
                                                            <li className="no-results">No se encontraron productos</li>
                                                        )}
                                                    </ul>
                                                )}
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    className="modern-input"
                                                    value={item.cantidad}
                                                    onChange={(e) => updateItem(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                    onWheel={(e) => e.target.blur()}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                            <td style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="modern-input"
                                                    value={item.precioVenta}
                                                    onChange={(e) => updateItem(index, 'precioVenta', parseFloat(e.target.value) || 0)}
                                                    onWheel={(e) => e.target.blur()}
                                                    onFocus={(e) => e.target.select()}
                                                    style={item.producto && item.precioVenta < item.producto.precioCosto ? { borderColor: '#ef4444', color: '#ef4444', fontWeight: '600' } : {}}
                                                />
                                                {item.producto && item.precioVenta < item.producto.precioCosto && (
                                                    <span 
                                                        title={`¡Alerta! El precio está por debajo del costo ($${item.producto.precioCosto})`} 
                                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'help' }}
                                                    >
                                                        ⚠️
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: '600' }}>
                                                $ {((item.cantidad || 0) * (item.precioVenta || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <button type="button" className="action-btn delete-btn" onClick={() => removeItem(index)} title="Eliminar ítem" style={{ width: '32px', height: '32px', padding: 0 }}>
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" className="btn-secondary" onClick={addItem} style={{ marginTop: '10px' }}>
                                <FiPlus /> Agregar otro producto
                            </button>
                        </div>

                        {/* PAGO Y TOTAL */}
                        <div className="form-section" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, paddingRight: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#16a34a' }}>Medio de Pago</label>
                                    <select
                                        className="modern-input"
                                        value={medioPago}
                                        onChange={(e) => setMedioPago(e.target.value)}
                                        style={{ borderColor: '#86efac' }}
                                    >
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                                        <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                                        <option value="MERCADO_PAGO">Mercado Pago</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label className="form-label">Observaciones</label>
                                    <input 
                                        type="text" 
                                        className="modern-input" 
                                        value={form.observaciones}
                                        onChange={e => setForm({...form, observaciones: e.target.value})}
                                        placeholder="Ej: Retira el cliente"
                                    />
                                </div>
                            </div>
                            
                            <div style={{ background: '#16a34a', padding: '1.5rem', borderRadius: '12px', color: 'white', minWidth: '250px', textAlign: 'right', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.4)' }}>
                                <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '5px' }}>Total a cobrar</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                                    $ {totalCalculado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                    <FiCheck /> Cobro instantáneo
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: "1rem" }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving} style={{ background: '#10b981', borderColor: '#10b981' }}>
                            <FiZap style={{ fill: 'white' }} /> {saving ? "Procesando..." : "Confirmar Venta"}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .btn-primary:hover:not(:disabled) {
                    background: #059669 !important;
                }
            `}</style>
        </div>
    );
}
