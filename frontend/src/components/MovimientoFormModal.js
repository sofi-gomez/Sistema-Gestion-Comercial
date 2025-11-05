import React, { useState } from "react";
import "../index.css";

export default function MovimientoFormModal({ movimiento = null, onClose, onSaved }) {
  const [form, setForm] = useState({
    tipo: movimiento?.tipo || "INGRESO",
    medioPago: movimiento?.medioPago || movimiento?.medio_pago || "",
    importe: movimiento?.importe ?? 0,
    descripcion: movimiento?.descripcion || "",
    referencia: movimiento?.referencia || ""
  });

  const API_POST = "http://localhost:8080/api/tesoreria/movimientos";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medioPago) return alert("Seleccione medio de pago.");
    if (!form.importe || Number(form.importe) <= 0) return alert("Importe inválido.");

    // Normalizamos nombres: si tu backend espera medio_pago o medioPago ajusta aquí
    const payload = {
      tipo: form.tipo,
      medioPago: form.medioPago,
      importe: Number(form.importe),
      descripcion: form.descripcion,
      referencia: form.referencia
    };

    try {
      const res = await fetch(API_POST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error creando movimiento");
      }
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      alert("No se pudo registrar el movimiento: " + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 style={{margin:0}}>{ movimiento ? "Editar movimiento" : "Nuevo movimiento" }</h3>

        <form onSubmit={handleSubmit} style={{marginTop:12}}>
          <div style={{display:'grid', gap:10}}>
            <div>
              <label className="form-label">Tipo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
                <option value="INGRESO">INGRESO</option>
                <option value="EGRESO">EGRESO</option>
              </select>
            </div>

            <div>
              <label className="form-label">Medio de pago</label>
              <input name="medioPago" value={form.medioPago} onChange={handleChange} className="input" placeholder="Efectivo / Transferencia / Tarjeta" />
            </div>

            <div>
              <label className="form-label">Importe</label>
              <input name="importe" value={form.importe} onChange={handleChange} type="number" step="0.01" className="input" />
            </div>

            <div>
              <label className="form-label">Referencia (opcional)</label>
              <input name="referencia" value={form.referencia} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="form-label">Descripción (opcional)</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="input" style={{minHeight:90}} />
            </div>
          </div>

          <div style={{display:'flex', justifyContent:'flex-end', gap:12, marginTop:14}}>
            <button type="button" onClick={onClose} className="btn">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
