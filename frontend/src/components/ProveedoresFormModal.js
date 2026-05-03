import React, { useState, useEffect } from "react";
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
  const [saving, setSaving] = useState(false);

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

  const handleCuitChange = (e) => {
    const { name, value } = e.target;
    // Solo permitir números y guiones
    const filteredValue = value.replace(/[^0-9-]/g, "");
    setForm(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        cuit: form.cuit.replace(/[^0-9-]/g, ""), // Limpieza final
        id: proveedor?.id
      };
      await onSave(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{proveedor ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Nombre *</label>
                <input 
                  name="nombre" 
                  value={form.nombre} 
                  onChange={handleChange} 
                  className="modern-input" 
                  required 
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="form-group">
                <label className="form-label">CUIT</label>
                <input 
                  name="cuit" 
                  value={form.cuit} 
                  onChange={handleCuitChange} 
                  className="modern-input" 
                  placeholder="00-00000000-0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input 
                  name="telefono" 
                  value={form.telefono} 
                  onChange={handleChange} 
                  className="modern-input" 
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  className="modern-input" 
                  placeholder="proveedor@ejemplo.com"
                  type="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Condición IVA</label>
                <select 
                  name="condicionIva" 
                  value={form.condicionIva} 
                  onChange={handleChange} 
                  className="modern-input"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributista">Monotributista</option>
                  <option value="Exento">Exento</option>
                  <option value="Consumidor Final">Consumidor Final</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Dirección</label>
                <input 
                  name="direccion" 
                  value={form.direccion} 
                  onChange={handleChange} 
                  className="modern-input" 
                  placeholder="Dirección completa"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Notas</label>
                <textarea 
                  name="notas" 
                  value={form.notas} 
                  onChange={handleChange} 
                  className="modern-textarea" 
                  placeholder="Información adicional sobre el proveedor"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : (proveedor ? "Actualizar Proveedor" : "Crear Proveedor")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
