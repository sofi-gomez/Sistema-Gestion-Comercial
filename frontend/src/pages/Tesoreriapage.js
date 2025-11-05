import React, { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import MovimientoFormModal from "../components/MovimientoFormModal";
import "../index.css";

export default function TesoreriaPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  const API_BASE = "http://localhost:8080/api/tesoreria";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}`);
      const data = await res.json();
      setMovimientos(data || []);
    } catch (err) {
      console.error("Error cargando movimientos:", err);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRango = async () => {
    if (!filterDesde || !filterHasta) return alert("Seleccione desde y hasta.");
    setLoading(true);
    try {
      const desde = encodeURIComponent(filterDesde);
      const hasta = encodeURIComponent(filterHasta);
      const res = await fetch(`${API_BASE}/rango?desde=${desde}&hasta=${hasta}`);
      if (!res.ok) throw new Error("Error al filtrar");
      const data = await res.json();
      setMovimientos(data || []);
    } catch (err) {
      console.error(err);
      alert("Error al obtener rango.");
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaved = () => {
    setModalOpen(false);
    if (filterDesde && filterHasta) fetchRango(); else fetchAll();
  };

  const total = movimientos.reduce((acc, m) => {
    const imp = Number(m.importe ?? m.amount ?? 0);
    // algunos backends usan 'tipo' en mayúscula o minúscula: normalizamos
    const tipo = (m.tipo || "").toString().toUpperCase();
    return tipo === "EGRESO" ? acc - imp : acc + imp;
  }, 0).toFixed(2);

  return (
    <div className="home-main">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18}}>
        <div>
          <h1 style={{fontSize:28, margin:0}}>Tesorería</h1>
          <p style={{margin:4, color:'var(--muted)'}}>Registrar movimientos de caja y ver historial / saldo</p>
        </div>

        <div>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{display:'inline-flex', alignItems:'center', gap:8}}>
            <FiPlus /> Nuevo movimiento
          </button>
        </div>
      </div>

      <div style={{display:'flex', gap:12, alignItems:'flex-end', marginBottom:16, flexWrap:'wrap'}}>
        <div>
          <label className="form-label">Desde</label>
          <input type="datetime-local" value={filterDesde} onChange={e => setFilterDesde(e.target.value)} className="input" />
        </div>

        <div>
          <label className="form-label">Hasta</label>
          <input type="datetime-local" value={filterHasta} onChange={e => setFilterHasta(e.target.value)} className="input" />
        </div>

        <div style={{display:'flex', gap:8}}>
          <button onClick={fetchRango} className="btn btn-primary">Filtrar</button>
          <button onClick={() => { setFilterDesde(""); setFilterHasta(""); fetchAll(); }} className="btn">Limpiar</button>
        </div>

        <div style={{marginLeft:'auto', fontWeight:700}}>
          Saldo: ${total}
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="text-gray-500 p-6">Cargando movimientos...</p>
        ) : movimientos.length === 0 ? (
          <p className="text-gray-500 p-6">No hay movimientos.</p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Medio</th>
                <th>Importe</th>
                <th>Referencia</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{ m.fecha ? new Date(m.fecha).toLocaleString() : (m.createdAt ? new Date(m.createdAt).toLocaleString() : "") }</td>
                  <td>{m.tipo}</td>
                  <td>{m.medioPago || m.medio_pago}</td>
                  <td style={{color: (String(m.tipo || "").toUpperCase() === "EGRESO") ? '#e11d48' : '#059669' }}>
                    ${m.importe}
                  </td>
                  <td>{m.referencia}</td>
                  <td>{m.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <MovimientoFormModal onClose={() => setModalOpen(false)} onSaved={handleSaved} />}
    </div>
  );
}
