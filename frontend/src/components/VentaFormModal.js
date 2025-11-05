import React, { useEffect, useState } from "react";
import "../index.css";

/*
 Payload esperado (ajusta si tu backend usa otros nombres):
 {
   cliente: { id: <clienteId> },
   items: [
     { producto: { id: <productoId> }, cantidad: 2.5, precioUnitario: 100.0, subtotal: 250.0 },
     ...
   ],
   total: 250.0,
   estado: "COMPLETA"
 }
*/

export default function VentaFormModal({ onClose, onSaved }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [loading, setLoading] = useState(true);

  const API_CLIENTES = "http://localhost:8080/api/clientes";
  const API_PRODUCTOS = "http://localhost:8080/api/productos";
  const API_VENTAS = "http://localhost:8080/api/ventas";

  useEffect(() => {
    const load = async () => {
      try {
        const [rc, rp] = await Promise.all([fetch(API_CLIENTES), fetch(API_PRODUCTOS)]);
        const [clientesJson, productosJson] = await Promise.all([rc.json(), rp.json()]);
        setClientes(clientesJson || []);
        setProductos(productosJson || []);
      } catch (err) {
        console.error("Error cargando clientes/productos:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (items.length === 0) addEmptyItem();
    // eslint-disable-next-line
  }, [productos, clientes]);

  const addEmptyItem = () => {
    setItems((s) => [...s, { productoId: "", cantidad: 1, precioUnitario: 0, subtotal: 0 }]);
  };

  const removeItem = (idx) => setItems((s) => s.filter((_, i) => i !== idx));

  const updateItem = (idx, newVals) => {
    setItems((s) => {
      const copy = [...s];
      copy[idx] = { ...copy[idx], ...newVals };
      const cantidad = Number(copy[idx].cantidad || 0);
      const precioUnitario = Number(copy[idx].precioUnitario || 0);
      copy[idx].subtotal = +(cantidad * precioUnitario).toFixed(2);
      return copy;
    });
  };

  const calcularTotal = () => items.reduce((acc, it) => acc + Number(it.subtotal || 0), 0).toFixed(2);

  const handleProductoChange = (idx, productoId) => {
    const prod = productos.find((p) => String(p.id) === String(productoId));
    if (!prod) {
      updateItem(idx, { productoId: "", precioUnitario: 0 });
      return;
    }
    const precio = prod.precioVenta !== undefined && prod.precioVenta !== null ? prod.precioVenta : prod.precio_venta;
    updateItem(idx, { productoId: prod.id, precioUnitario: Number(precio) || 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId) return alert("Seleccione un cliente.");
    if (items.length === 0) return alert("Agregue al menos un item.");
    for (const it of items) {
      if (!it.productoId) return alert("Complete todos los productos.");
      if (!it.cantidad || Number(it.cantidad) <= 0) return alert("Cantidad inválida en un item.");
    }

    const payload = {
      cliente: { id: clienteId },
      items: items.map((it) => ({
        producto: { id: it.productoId },
        cantidad: Number(it.cantidad),
        precioUnitario: Number(it.precioUnitario),
        subtotal: Number(it.subtotal)
      })),
      total: Number(calcularTotal()),
      estado: "COMPLETA"
    };

    try {
      const res = await fetch(API_VENTAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al registrar la venta");
      }
      onSaved && onSaved();
    } catch (err) {
      console.error("Error guardando venta:", err);
      alert("No se pudo registrar la venta: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-card">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{maxWidth:1100}}>
        <h2 style={{margin:0}}>Registrar Venta Interna</h2>

        <form onSubmit={handleSubmit} style={{marginTop:12}}>
          <div style={{marginBottom:12}}>
            <label className="form-label">Cliente</label>
            <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">-- Seleccione cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.documento ? `(${c.documento})` : ""}</option>
              ))}
            </select>
          </div>

          <div style={{marginTop:8}}>
            <label className="form-label">Items</label>

            <div style={{display:'grid', gap:12}}>
              {items.map((it, idx) => (
                <div key={idx} style={{display:'grid', gridTemplateColumns: '48% 12% 12% 18% 10%', gap:12, alignItems:'center'}}>
                  <select className="input" value={it.productoId} onChange={(e) => handleProductoChange(idx, e.target.value)}>
                    <option value="">-- producto --</option>
                    {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.sku ? `(${p.sku})` : ""} - stock: {p.stock}</option>)}
                  </select>

                  <input className="input" type="number" step="0.0001" value={it.cantidad} onChange={(e) => updateItem(idx, { cantidad: e.target.value })} />

                  <input className="input" type="number" step="0.01" value={it.precioUnitario} onChange={(e) => updateItem(idx, { precioUnitario: e.target.value })} />

                  <input className="input" disabled value={it.subtotal || 0} />

                  <div style={{display:'flex', justifyContent:'flex-end'}}>
                    <button type="button" onClick={() => removeItem(idx)} className="btn btn-ghost">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:12}}>
              <button type="button" onClick={addEmptyItem} className="btn btn-primary">Agregar item</button>
            </div>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18}}>
            <div style={{fontWeight:700, fontSize:18}}>Total: ${calcularTotal()}</div>
            <div>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{marginRight:8}}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Registrar Venta</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
