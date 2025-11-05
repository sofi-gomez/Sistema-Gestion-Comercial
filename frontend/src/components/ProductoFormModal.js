import React, { useState, useEffect } from "react";
import "../index.css";

export default function ProductoFormModal({ producto, onClose, onSave }) {
  const [form, setForm] = useState({
    sku: "",
    nombre: "",
    descripcion: "",
    precioCosto: 0,
    precioVenta: 0,
    stock: 0,
    unidadMedida: "",
    activo: true,
  });

  useEffect(() => {
    if (producto) {
      // make sure numeric values convert to simple values for inputs
      setForm({
        ...producto,
        precioCosto: producto.precioCosto ?? 0,
        precioVenta: producto.precioVenta ?? 0,
        stock: producto.stock ?? 0,
      });
    }
  }, [producto]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // ensure numeric fields are numbers (and not empty strings)
    const payload = {
      ...form,
      precioCosto: Number(form.precioCosto || 0),
      precioVenta: Number(form.precioVenta || 0),
      stock: Number(form.stock || 0),
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" role="dialog" aria-modal="true">
        <h2>{producto ? "Editar producto" : "Nuevo producto"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label className="form-label">SKU</label>
              <input name="sku" value={form.sku || ""} onChange={handleChange} className="input" required />
            </div>

            <div>
              <label className="form-label">Nombre</label>
              <input name="nombre" value={form.nombre || ""} onChange={handleChange} className="input" required />
            </div>

            <div className="form-row-single">
              <label className="form-label">Descripción</label>
              <textarea name="descripcion" value={form.descripcion || ""} onChange={handleChange} className="textarea" />
            </div>

            <div>
              <label className="form-label">Precio costo</label>
              <input type="number" step="0.01" name="precioCosto" value={form.precioCosto} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="form-label">Precio venta</label>
              <input type="number" step="0.01" name="precioVenta" value={form.precioVenta} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="form-label">Stock</label>
              <input type="number" step="0.0001" name="stock" value={form.stock} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="form-label">Unidad de medida</label>
              <input name="unidadMedida" value={form.unidadMedida || ""} onChange={handleChange} className="input" />
            </div>

            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <input id="activo" type="checkbox" name="activo" checked={!!form.activo} onChange={handleChange} />
              <label htmlFor="activo" className="form-label" style={{margin:0}}>Activo</label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
