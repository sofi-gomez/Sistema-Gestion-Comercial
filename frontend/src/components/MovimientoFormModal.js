import React, { useState } from "react";
import "../index.css";

export default function MovimientoFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    tipo: "INGRESO",
    medioPago: "EFECTIVO",
    importe: "",
    referencia: "",
    descripcion: ""
  });

  const mediosPago = [
    "EFECTIVO",
    "TRANSFERENCIA",
    "TARJETA_DEBITO",
    "TARJETA_CREDITO",
    "CHEQUE",
      "CHEQUE_ELECTRONICO",
    "MERCADO_PAGO"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.importe || Number(form.importe) <= 0) {
      alert("El importe debe ser mayor a 0");
      return;
    }

    if (!form.descripcion.trim()) {
      alert("La descripción es requerida");
      return;
    }

    const payload = {
      ...form,
      importe: Number(form.importe),
      fecha: new Date().toISOString()
    };

    try {
      const res = await fetch("http://localhost:8080/api/tesoreria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al registrar el movimiento");
      }
      
      onSaved && onSaved();
    } catch (err) {
      console.error("Error guardando movimiento:", err);
      alert("No se pudo registrar el movimiento: " + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Nuevo Movimiento</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select 
                  name="tipo" 
                  value={form.tipo} 
                  onChange={handleChange} 
                  className="modern-input"
                  required
                >
                  <option value="INGRESO">Ingreso</option>
                  <option value="EGRESO">Egreso</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Medio de Pago *</label>
                <select 
                  name="medioPago" 
                  value={form.medioPago} 
                  onChange={handleChange} 
                  className="modern-input"
                  required
                >
                  {mediosPago.map(medio => (
                    <option key={medio} value={medio}>
                      {medio.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Importe *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="importe" 
                  value={form.importe} 
                  onChange={handleChange} 
                  className="modern-input" 
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Referencia</label>
                <input 
                  name="referencia" 
                  value={form.referencia} 
                  onChange={handleChange} 
                  className="modern-input" 
                  placeholder="Número de referencia, comprobante, etc."
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Descripción *</label>
                <textarea 
                  name="descripcion" 
                  value={form.descripcion} 
                  onChange={handleChange} 
                  className="modern-textarea" 
                  placeholder="Descripción detallada del movimiento"
                  rows="3"
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Registrar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}