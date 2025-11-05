import React, { useEffect, useState } from "react";
import "../index.css";

export default function ProveedoresFormModal({ proveedor, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    cuit: "",
    direccion: "",
    telefono: "",
    email: "",
    condicionIva: "",
    notas: ""
  });

  useEffect(() => {
    if (proveedor) {
      setForm({
        nombre: proveedor.nombre || "",
        cuit: proveedor.cuit || "",
        direccion: proveedor.direccion || "",
        telefono: proveedor.telefono || "",
        email: proveedor.email || "",
        condicionIva: proveedor.condicionIva || proveedor.condicion_iva || "",
        notas: proveedor.notas || ""
      });
    } else {
      setForm({
        nombre: "",
        cuit: "",
        direccion: "",
        telefono: "",
        email: "",
        condicionIva: "",
        notas: ""
      });
    }
  }, [proveedor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = proveedor ? { ...form, id: proveedor.id } : form;
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 style={{margin:0}}>{proveedor ? "Editar proveedor" : "Nuevo proveedor"}</h2>

        <form onSubmit={handleSubmit} style={{marginTop:12}}>
          <div className="form-grid">
            <div className="form-row-single">
              <label className="form-label">Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className="input" required />
            </div>

            <div>
              <label className="form-label">CUIT</label>
              <input name="cuit" value={form.cuit} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="form-label">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} className="input" />
            </div>

            <div className="form-row-single">
              <label className="form-label">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className="input" />
            </div>

            <div className="form-row-single">
              <label className="form-label">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="form-label">Condición IVA</label>
              <input name="condicionIva" value={form.condicionIva} onChange={handleChange} className="input" />
            </div>

            <div className="form-row-single">
              <label className="form-label">Notas</label>
              <textarea name="notas" value={form.notas} onChange={handleChange} className="textarea" />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
