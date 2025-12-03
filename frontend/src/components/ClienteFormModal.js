import React, { useState, useEffect } from "react";
import "../index.css";

export default function ClienteFormModal({ cliente, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    direccion: "",
    telefono: "",
    email: "",
    notas: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre || "",
        documento: cliente.documento || "",
        direccion: cliente.direccion || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
        notas: cliente.notas || ""
      });
    } else {
      setForm({
        nombre: "",
        documento: "",
        direccion: "",
        telefono: "",
        email: "",
        notas: ""
      });
    }
    setErrors({});
  }, [cliente]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "El email no es válido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const payload = cliente ? { ...form, id: cliente.id } : form;
    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{cliente ? "Editar Cliente" : "Nuevo Cliente"}</h2>
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
                  className={`modern-input ${errors.nombre ? 'error' : ''}`}
                  required 
                  placeholder="Nombre completo del cliente"
                />
                {errors.nombre && <span className="error-message">{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Documento</label>
                <input 
                  name="documento" 
                  value={form.documento} 
                  onChange={handleChange} 
                  className="modern-input" 
                  placeholder="DNI, CUIT, etc."
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
                  className={`modern-input ${errors.email ? 'error' : ''}`}
                  placeholder="cliente@ejemplo.com"
                  type="email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
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
                  placeholder="Información adicional sobre el cliente"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {cliente ? "Actualizar Cliente" : "Crear Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}