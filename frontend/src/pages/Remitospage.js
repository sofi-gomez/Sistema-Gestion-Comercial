import React, { useEffect, useState } from "react";
import RemitoFormModal from "../components/RemitoFormModal";
import "../index.css";

export default function RemitosPage() {
  const [remitos, setRemitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const API = "http://localhost:8080/api/remitos";

  const fetchRemitos = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Error al obtener remitos");
      const data = await res.json();
      setRemitos(data || []);
    } catch (err) {
      console.error(err);
      setRemitos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemitos();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    fetchRemitos();
  };

  const descargarPdf = async (id, numero) => {
    try {
      const res = await fetch(`${API}/${id}/pdf`);
      if (!res.ok) throw new Error("Error descargando PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `remito_${numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar PDF");
    }
  };

  return (
    <div className="home-main">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18}}>
        <div>
          <h1 style={{fontSize:28, margin:0}}>Remitos</h1>
          <p style={{margin:4, color:'var(--muted)'}}>Generá y descargá remitos. Numeración automática.</p>
        </div>

        <div>
          <button onClick={handleCreate} className="btn btn-primary">
            Nuevo remito
          </button>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="text-gray-500 p-6">Cargando remitos...</p>
        ) : remitos.length === 0 ? (
          <p className="text-gray-500 p-6">No hay remitos registrados.</p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Cliente</th>
                <th>Items</th>
                <th style={{textAlign:'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {remitos.map((r) => (
                <tr key={r.id}>
                  <td>{r.numero}</td>
                  <td>{r.fecha ? new Date(r.fecha).toLocaleString() : ""}</td>
                  <td>{r.proveedor?.nombre || "-"}</td>
                  <td>{r.cliente?.nombre || "-"}</td>
                  <td>{r.items ? r.items.length : 0}</td>
                  <td style={{textAlign:'right'}}>
                    <button onClick={() => descargarPdf(r.id, r.numero)} className="btn" style={{marginRight:8}}>PDF</button>
                    <button onClick={() => { setEditing(r); setModalOpen(true); }} className="btn" style={{background:'#f59e0b', color:'#fff', border:'none'}}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <RemitoFormModal remito={editing} onClose={() => setModalOpen(false)} onSaved={handleSaved} />}
    </div>
  );
}
