import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import ProveedoresFormModal from "../components/ProveedoresFormModal";
import "../index.css";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const API = "http://localhost:8080/api/proveedores";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setProveedores(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar proveedor?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const handleSave = async (prov) => {
    const method = prov.id ? "PUT" : "POST";
    const url = prov.id ? `${API}/${prov.id}` : API;
    await fetch(url, {
      method,
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(prov),
    });
    setModalOpen(false);
    setEditing(null);
    fetchAll();
  };

  return (
    <div className="home-main">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28, margin:0}}>Proveedores</h1>
          <p style={{margin:4, color:'var(--muted)'}}>Gestioná remitos, facturas y datos de tus proveedores</p>
        </div>
        <div>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn btn-primary">
            <FiPlus /> &nbsp; Nuevo proveedor
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando proveedores...</p>
      ) : proveedores.length === 0 ? (
        <p className="text-gray-500">No hay proveedores registrados.</p>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>CUIT</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th style={{textAlign:'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.cuit}</td>
                  <td>{p.telefono}</td>
                  <td>{p.email}</td>
                  <td>{p.direccion}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="icon-btn" title="Editar" onClick={() => { setEditing(p); setModalOpen(true); }}>
                      <FiEdit2 />
                    </button>
                    &nbsp;
                    <button className="icon-btn" title="Eliminar" onClick={() => handleDelete(p.id)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ProveedoresFormModal
          proveedor={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
