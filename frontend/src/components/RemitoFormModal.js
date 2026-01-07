import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import "../index.css";

export default function RemitoFormModal({ remito = null, onClose, onSaved }) {
    const [form, setForm] = useState({
        fecha: "",
        proveedor: null,
        cliente: null,
        clienteNombre: "",
        clienteDireccion: "",
        clienteCodigoPostal: "",
        clienteAclaracion: "",
        observaciones: "",
        items: []
    });

    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Opciones predefinidas para el combo box de IVA
    const ivaOptions = [
        { value: "", label: "-- Seleccionar condición de IVA --" },
        { value: "CONSUMIDOR_FINAL", label: "Consumidor Final" },
        { value: "RESPONSABLE_INSCRIPTO", label: "Responsable Inscripto" },
        { value: "MONOTRIBUTO", label: "Monotributo" },
        { value: "EXENTO", label: "Exento" },
        { value: "NO_RESPONSABLE", label: "No Responsable" },
        { value: "OTRO", label: "Otro" }
    ];

    const API_PRODUCTS = "http://localhost:8080/api/productos";
    const API_REMITOS = "http://localhost:8080/api/remitos";
    const API_PROVEEDORES = "http://localhost:8080/api/proveedores";
    const API_CLIENTES = "http://localhost:8080/api/clientes";

    // Función para formatear fecha de ISO a YYYY-MM-DD
    const formatDateForInput = (isoDate) => {
        if (!isoDate) return "";
        return isoDate.split("T")[0];
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [productsRes, providersRes, clientsRes] = await Promise.all([
                    fetch(API_PRODUCTS),
                    fetch(API_PROVEEDORES),
                    fetch(API_CLIENTES)
                ]);

                const productsData = productsRes.ok ? await productsRes.json() : [];
                const providersData = providersRes.ok ? await providersRes.json() : [];
                const clientsData = clientsRes.ok ? await clientsRes.json() : [];

                setProductos(productsData);
                setProveedores(providersData);
                setClientes(clientsData);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        if (remito) {
            setForm({
                fecha: formatDateForInput(remito.fecha) || "",
                proveedor: remito.proveedor ?? null,
                cliente: remito.cliente ?? null,
                clienteNombre: remito.clienteNombre ?? (remito.cliente?.nombre ?? ""),
                clienteDireccion: remito.clienteDireccion ?? "",
                clienteCodigoPostal: remito.clienteCodigoPostal ?? "",
                clienteAclaracion: remito.clienteAclaracion ?? "",
                observaciones: remito.observaciones ?? "",
                items: (remito.items ?? []).map(it => ({
                    producto: it.producto ?? null,
                    cantidad: it.cantidad ?? 1,
                    notas: it.notas ?? ""
                }))
            });
        } else {
            // Al crear nuevo remito, usar fecha actual
            const hoy = new Date().toISOString().split('T')[0];
            setForm(prev => ({
                ...prev,
                fecha: hoy,
                proveedor: null,
                cliente: null,
                clienteNombre: "",
                clienteDireccion: "",
                clienteCodigoPostal: "",
                clienteAclaracion: "",
                observaciones: "",
                items: [{ producto: null, cantidad: 1, notas: "" }]
            }));
        }
    }, [remito]);

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
    };

    const updateItem = (index, key, value) => {
        setForm(prev => {
            const items = [...prev.items];
            items[index] = { ...items[index], [key]: value };
            return { ...prev, items };
        });
    };

    const handleProveedorChange = (id) => {
        const p = proveedores.find(x => String(x.id) === String(id)) || null;
        setForm(prev => ({ ...prev, proveedor: p }));
    };

    const handleClienteChange = (id) => {
        const c = clientes.find(x => String(x.id) === String(id)) || null;
        setForm(prev => ({
            ...prev,
            cliente: c,
            clienteNombre: c ? c.nombre : prev.clienteNombre
        }));
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
            proveedor: form.proveedor ? { id: form.proveedor.id } : null,
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
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1000 }}>
                <div className="modal-header">
                    <h2>{remito ? `Editar Remito #${remito.numero}` : "Nuevo Remito"}</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="form-grid">

                            {/* CAMPO FECHA AGREGADO */}
                            <div className="form-group">
                                <label className="form-label">Fecha *</label>
                                <input
                                    type="date"
                                    className="modern-input"
                                    value={form.fecha || ""}
                                    onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nombre cliente</label>
                                <input
                                    className="modern-input"
                                    value={form.clienteNombre || ""}
                                    onChange={e => setForm(prev => ({ ...prev, clienteNombre: e.target.value }))}
                                    placeholder="Nombre del cliente"
                                />
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
                                    <div key={idx} className="item-row">
                                        <div className="item-producto">
                                            <select
                                                className="modern-input"
                                                value={it.producto?.id || ""}
                                                onChange={e => {
                                                    const pid = e.target.value;
                                                    const prod = productos.find(p => String(p.id) === String(pid)) || { id: pid };
                                                    updateItem(idx, "producto", prod);
                                                }}
                                                required
                                            >
                                                <option value="">-- Seleccionar producto --</option>
                                                {productos.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nombre} {p.sku ? `(${p.sku})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="item-cantidad">
                                            <input
                                                className="modern-input"
                                                type="number"
                                                step="0.0001"
                                                min="0.0001"
                                                value={it.cantidad}
                                                onChange={e => updateItem(idx, "cantidad", e.target.value)}
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

                                {/* Botón Agregar Item debajo de la lista */}
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
                        <button type="button" className="btn-secondary" onClick={onClose}>
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