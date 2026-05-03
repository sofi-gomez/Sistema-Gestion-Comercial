import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { apiFetch } from "../utils/api";
import "../index.css";

export default function RemitoFormModal({ remito = null, onClose, onSaved }) {
    const [form, setForm] = useState({
        fecha: "",
        cliente: null,
        clienteNombre: "",
        clienteDireccion: "",
        clienteCodigoPostal: "",
        clienteAclaracion: "",
        observaciones: "",
        items: []
    });

    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [searchTerms, setSearchTerms] = useState({});
    const [showResults, setShowResults] = useState({});

    // Estados para el buscador de clientes
    const [clienteSearchTerm, setClienteSearchTerm] = useState("");
    const [showClienteResults, setShowClienteResults] = useState(false);

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

    const ivaOptions = [
        { value: "", label: "-- Seleccionar condición de IVA --" },
        { value: "CONSUMIDOR_FINAL", label: "Consumidor Final" },
        { value: "RESPONSABLE_INSCRIPTO", label: "Responsable Inscripto" },
        { value: "MONOTRIBUTO", label: "Monotributo" },
        { value: "EXENTO", label: "Exento" },
        { value: "NO_RESPONSABLE", label: "No Responsable" },
        { value: "OTRO", label: "Otro" }
    ];

    const API_PRODUCTS = "/api/productos";
    const API_REMITOS = "/api/remitos";
    const API_CLIENTES = "/api/clientes";

    const formatDateForInput = (isoDate) => {
        if (!isoDate) return "";
        return isoDate.split("T")[0];
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [productsRes, clientsRes] = await Promise.all([
                    apiFetch(API_PRODUCTS),
                    apiFetch(API_CLIENTES)
                ]);
                setProductos(productsRes.ok ? await productsRes.json() : []);
                setClientes(clientsRes.ok ? await clientsRes.json() : []);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        if (remito) {
            const initialSearchTerms = {};
            const initialItems = (remito.items ?? []).map((it, idx) => {
                if (it.producto) {
                    initialSearchTerms[idx] = it.producto.nombre + (it.producto.sku ? ` (${it.producto.sku})` : "");
                }
                return {
                    producto: it.producto ?? null,
                    cantidad: it.cantidad ?? 1,
                    notas: it.notas ?? ""
                };
            });
            setSearchTerms(initialSearchTerms);
            setForm({
                fecha: formatDateForInput(remito.fecha) || "",
                cliente: remito.cliente ?? null,
                clienteNombre: remito.clienteNombre ?? (remito.cliente?.nombre ?? ""),
                clienteDireccion: remito.clienteDireccion ?? "",
                clienteCodigoPostal: remito.clienteCodigoPostal ?? "",
                clienteAclaracion: remito.clienteAclaracion ?? "",
                observaciones: remito.observaciones ?? "",
                items: initialItems
            });
            setClienteSearchTerm(remito.clienteNombre ?? (remito.cliente?.nombre ?? ""));
        } else {
            const hoy = new Date().toISOString().split('T')[0];
            setSearchTerms({});
            setForm(prev => ({
                ...prev,
                fecha: hoy,
                cliente: null,
                clienteNombre: "",
                clienteDireccion: "",
                clienteCodigoPostal: "",
                clienteAclaracion: "",
                observaciones: "",
                items: [{ producto: null, cantidad: 1, notas: "" }]
            }));
            setClienteSearchTerm("");
        }
    }, [remito, clientes.length]);

    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { producto: null, cantidad: 1, notas: "" }]
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
            } else if (key === 'producto' && !value) {
                setShowResults(prevRes => ({ ...prevRes, [index]: false }));
            }
            return { ...prev, items };
        });
    };

    const handleClienteChange = (c) => {
        if (!c) return;
        setForm(prev => ({
            ...prev,
            cliente: c,
            clienteNombre: c.nombre || "",
            clienteDireccion: c.direccion || "",
            clienteCodigoPostal: c.codigoPostal || "",
            clienteAclaracion: c.condicionIva || ""
        }));
        setClienteSearchTerm(c.nombre || "");
        setShowClienteResults(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.items || form.items.length === 0) {
            return alert("Agregá al menos un item.");
        }

        for (const it of form.items) {
            if (!it.producto || !(it.producto.id || it.producto === 0)) {
                return alert("Cada item debe tener un producto seleccionado.");
            }
            if (!it.cantidad || Number(it.cantidad) <= 0) {
                return alert("Cantidad inválida en un item.");
            }
        }

        const payload = {
            fecha: form.fecha || null,
            cliente: form.cliente ? { id: form.cliente.id } : null,
            clienteNombre: form.clienteNombre || (form.cliente ? form.cliente.nombre : ""),
            clienteDireccion: form.clienteDireccion || "",
            clienteCodigoPostal: form.clienteCodigoPostal || "",
            clienteAclaracion: form.clienteAclaracion || "",
            observaciones: form.observaciones,
            items: form.items.map(it => ({
                producto: { id: it.producto.id || it.producto },
                cantidad: Number(it.cantidad),
                notas: it.notas || ""
            }))
        };

        setSaving(true);
        try {
            const method = remito && remito.id ? "PUT" : "POST";
            const url = remito && remito.id ? `${API_REMITOS}/${remito.id}` : API_REMITOS;
            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Error guardando remito");
            }

            onSaved && onSaved();
        } catch (err) {
            console.error(err);
            alert("No se pudo guardar el remito: " + (err.message || ""));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-card">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Cargando datos...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1000 }}>
                <div className="modal-header">
                    <h2>{remito ? `Editar Remito #${remito.numero}` : "Nuevo Remito de Venta"}</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="form-grid">

                            <div className="form-group full-width">
                                <label className="form-label">Fecha del Remito</label>
                                <input
                                    type="date"
                                    className="modern-input"
                                    value={form.fecha}
                                    onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Cliente</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="🔍 Buscar por nombre o documento..."
                                        value={clienteSearchTerm || form.clienteNombre || ""}
                                        autoComplete="off"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setClienteSearchTerm(val);
                                            setShowClienteResults(true);
                                            if (!val) {
                                                setForm(prev => ({ ...prev, cliente: null, clienteNombre: "" }));
                                            }
                                        }}
                                        onFocus={() => setShowClienteResults(true)}
                                    />
                                    {showClienteResults && (
                                        <ul className="autocomplete-dropdown" style={{ width: '100%', top: '100%' }}>
                                            {getFilteredClientes(clienteSearchTerm).map(c => (
                                                <li key={c.id} onClick={() => handleClienteChange(c)}>
                                                    <div className="prod-name">{c.nombre}</div>
                                                    <div className="prod-sku">
                                                        {c.documento ? `Documento: ${c.documento}` : "Sin documento"} 
                                                        {c.direccion ? ` | ${c.direccion}` : ""}
                                                    </div>
                                                </li>
                                            ))}
                                            {getFilteredClientes(clienteSearchTerm).length === 0 && (
                                                <li className="no-results">No se encontraron clientes</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Dirección</label>
                                <input
                                    className="modern-input"
                                    value={form.clienteDireccion || ""}
                                    onChange={e => setForm(prev => ({ ...prev, clienteDireccion: e.target.value }))}
                                    placeholder="Dirección del cliente"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Código postal</label>
                                <input
                                    className="modern-input"
                                    value={form.clienteCodigoPostal || ""}
                                    onChange={e => setForm(prev => ({ ...prev, clienteCodigoPostal: e.target.value }))}
                                    placeholder="Código postal"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Condición de IVA</label>
                                <select
                                    className="modern-input"
                                    value={form.clienteAclaracion || ""}
                                    onChange={e => setForm(prev => ({ ...prev, clienteAclaracion: e.target.value }))}
                                >
                                    {ivaOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Observaciones</label>
                                <textarea
                                    className="modern-textarea"
                                    value={form.observaciones}
                                    onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                                    placeholder="Observaciones adicionales"
                                    rows="3"
                                />
                            </div>
                        </div>

                        {/* Items del remito */}
                        <div className="form-group full-width">
                            <div className="items-header">
                                <label className="form-label">Items del Remito</label>
                            </div>

                            <div className="items-container">
                                {form.items.map((it, idx) => (
                                    <div key={idx} className="item-row" style={{ display: "grid", gridTemplateColumns: "1fr 100px 140px 40px", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type="text"
                                                className="modern-input"
                                                placeholder="🔍 Buscar producto o SKU..."
                                                value={searchTerms[idx] ?? ""}
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
                                                <ul className="autocomplete-dropdown">
                                                    {getFilteredProducts(searchTerms[idx]).map(p => (
                                                        <li key={p.id} onClick={() => updateItem(idx, 'producto', p)}>
                                                            <div className="prod-name">{p.nombre}</div>
                                                            <div className="prod-sku">SKU: {p.sku || 'S/S'} | Stock: {p.stock}</div>
                                                        </li>
                                                    ))}
                                                    {getFilteredProducts(searchTerms[idx]).length === 0 && (
                                                        <li className="no-results">No se encontraron productos</li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>

                                        <div className="item-cantidad">
                                            <input
                                                className="modern-input"
                                                type="number"
                                                step="1"
                                                min="1"
                                                value={it.cantidad}
                                                onChange={e => updateItem(idx, "cantidad", e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="Cantidad"
                                                required
                                            />
                                        </div>

                                        <div className="item-notas">
                                            <input
                                                className="modern-input"
                                                value={it.notas}
                                                onChange={e => updateItem(idx, "notas", e.target.value)}
                                                placeholder="Notas (opcional)"
                                            />
                                        </div>

                                        <div className="item-actions">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="icon-btn delete"
                                                disabled={form.items.length === 1}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="add-item-container">
                                    <button type="button" onClick={addItem} className="btn-primary full-width">
                                        <FiPlus />
                                        Agregar Item
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? "Guardando..." : (remito ? "Actualizar Remito" : "Crear Remito")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
