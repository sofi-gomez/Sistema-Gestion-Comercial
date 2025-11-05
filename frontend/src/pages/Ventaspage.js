import React, { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import VentaFormModal from "../components/VentaFormModal";
import "../index.css";

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const API_LIST = "http://localhost:8080/api/ventas"; // endpoint para listar ventas si existe

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_LIST);
      if (!res.ok) {
        setVentas([]);
        return;
      }
      const data = await res.json();
      setVentas(data);
    } catch (err) {
      console.error("Error cargando ventas:", err);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  return (
    <div className="home-main">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28, margin:0}}>Ventas (Internas)</h1>
          <p style={{margin:4, color:'var(--muted)'}}>Registrar ventas internas y mantener el historial de transacciones</p>
        </div>

        <div>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary">
            <FiPlus /> &nbsp; Nueva Venta
          </button>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="text-gray-500 p-6">Cargando ventas...</p>
        ) : ventas.length === 0 ? (
          <p className="text-gray-500 p-6">Aún no hay ventas registradas.</p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>N° Interno</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id}>
                  <td>{v.numeroInterno || v.numero_interno}</td>
                  <td>{v.fecha ? new Date(v.fecha).toLocaleString() : ""}</td>
                  <td>{v.cliente ? (v.cliente.nombre || v.cliente) : "-"}</td>
                  <td>${v.total}</td>
                  <td>{v.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <VentaFormModal
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchVentas(); }}
        />
      )}
    </div>
  );
}
