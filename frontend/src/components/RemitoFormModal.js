// src/components/RemitoFormModal.js
import React, { useEffect, useState } from "react";

export default function RemitoFormModal({ remito = null, onClose, onSaved }) {
  const [form, setForm] = useState({
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

  const API_PRODUCTS = "http://localhost:8080/api/productos";
  const API_REMITOS = "http://localhost:8080/api/remitos";
  const API_PROVEEDORES = "http://localhost:8080/api/proveedores";
  const API_CLIENTES = "http://localhost:8080/api/clientes";

  useEffect(() => {
    // cargar auxiliares (silencioso si falla)
    fetch(API_PRODUCTS).then(r => r.ok ? r.json() : []).then(setProductos).catch(()=>{});
    fetch(API_PROVEEDORES).then(r => r.ok ? r.json() : []).then(setProveedores).catch(()=>{});
    fetch(API_CLIENTES).then(r => r.ok ? r.json() : []).then(setClientes).catch(()=>{});

    if (remito) {
      setForm({
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
      setForm(prev => ({
        ...prev,
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
    // eslint-disable-next-line
  }, [remito]);

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { producto: null, cantidad: 1,notas: "" }] }));
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
    setForm(prev => ({ ...prev, cliente: c, clienteNombre: c ? c.nombre : prev.clienteNombre }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.items || form.items.length === 0) return alert("Agregá al menos un item.");
    for (const it of form.items) {
      if (!it.producto || !(it.producto.id || it.producto === 0)) {
        return alert("Cada item debe tener un producto seleccionado.");
      }
      if (!it.cantidad || Number(it.cantidad) <= 0) return alert("Cantidad inválida en un item.");
    }

    const payload = {
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

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0 }}>{remito ? `Editar Remito #${remito.numero}` : "Nuevo Remito"}</h3>
          <div>
            <button onClick={onClose} className="btn">Cerrar</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          <div className="form-grid">
            <div>
              <label className="form-label">Proveedor (opcional)</label>
              <select className="input" value={form.proveedor?.id || ""} onChange={e => handleProveedorChange(e.target.value)}>
                <option value="">-- Sin proveedor --</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Cliente (opcional)</label>
              <select className="input" value={form.cliente?.id || ""} onChange={e => handleClienteChange(e.target.value)}>
                <option value="">-- Sin cliente --</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div className="form-row-single">
              <label className="form-label">Nombre cliente (si querés editar / cargar manual)</label>
              <input className="input" value={form.clienteNombre || ""} onChange={e => setForm(prev => ({ ...prev, clienteNombre: e.target.value }))} />
            </div>

            <div>
              <label className="form-label">Dirección</label>
              <input className="input" value={form.clienteDireccion || ""} onChange={e => setForm(prev => ({ ...prev, clienteDireccion: e.target.value }))} />
            </div>

            <div>
              <label className="form-label">Código postal</label>
              <input className="input" value={form.clienteCodigoPostal || ""} onChange={e => setForm(prev => ({ ...prev, clienteCodigoPostal: e.target.value }))} />
            </div>

            <div className="form-row-single">
              <label className="form-label">Condicion de IVA (ej: Consumidor final)</label>
              <input className="input" value={form.clienteAclaracion || ""} onChange={e => setForm(prev => ({ ...prev, clienteAclaracion: e.target.value }))} />
            </div>

            <div className="form-row-single">
              <label className="form-label">Observaciones</label>
              <textarea className="input textarea" value={form.observaciones} onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <h4 className="card-title" style={{ fontSize: 16, marginBottom: 8 }}>Items</h4>
            <div className="space-y-3">
              {form.items.map((it, idx) => (
                <div key={idx} className="grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, alignItems: 'center' }}>
                  <div style={{ gridColumn: 'span 5' }}>
                    <label className="form-label">Producto</label>
                    <select className="input" value={it.producto?.id || ""} onChange={e => {
                      const pid = e.target.value;
                      const prod = productos.find(p => String(p.id) === String(pid)) || { id: pid };
                      updateItem(idx, "producto", prod);
                    }}>
                      <option value="">-- seleccionar producto --</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku || ""})</option>)}
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Cantidad</label>
                    <input className="input" type="number" step="0.0001" value={it.cantidad} onChange={e => updateItem(idx, "cantidad", e.target.value)} />
                  </div>


                  <div style={{ gridColumn: 'span 1', textAlign: 'right' }}>
                    <label style={{ visibility: 'hidden' }}>X</label>
                    <button type="button" onClick={() => removeItem(idx)} className="btn" style={{ background: 'transparent', color: '#ef4444' }}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={addItem} className="btn">Agregar item</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
            <button type="button" onClick={onClose} className="btn">Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? "Guardando..." : "Guardar Remito"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
