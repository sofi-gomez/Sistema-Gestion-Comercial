import React, { useEffect, useState } from "react";
import {
  FiPlus, FiFileText, FiSearch, FiFilter, FiDownload, FiEdit2,
  FiDollarSign, FiCreditCard, FiClock, FiShoppingCart, FiCheckCircle, FiTrash2, FiList
} from "react-icons/fi";
import RemitoFormModal from "../components/RemitoFormModal";
import ItemsTooltip from "../components/ItemsTooltip";
import ValorizarSection from "../components/ValorizarSection";
import CobrosSection from "../components/CobrosSection";
import Toast from "../components/Toast";
import "../index.css";

const API_REMITOS = "http://localhost:8080/api/remitos";

export default function RemitosPage() {
  const [activeTab, setActiveTab] = useState("pendientes");
  const [remitos, setRemitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modales
  const [modalRemitoOpen, setModalRemitoOpen] = useState(false);
  const [editingRemito, setEditingRemito] = useState(null);
  const [valorizingRemito, setValorizingRemito] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resR = await fetch(API_REMITOS);
      if (resR.ok) setRemitos(await resR.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPdf = async (id, numero) => {
    try {
      const res = await fetch(`${API_REMITOS}/${id}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remito_${numero}.pdf`;
      a.click();
    } catch (err) { alert("Error al descargar PDF"); }
  };

  const handleDeleteRemito = async (id, numero) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el remito #${numero}? Esta acción no se puede deshacer y afectará el stock.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_REMITOS}/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setToast({
          title: "Remito eliminado",
          message: `El remito #${numero} fue eliminado correctamente.`,
          type: "info"
        });
        fetchData();
      } else {
        const txt = await res.text();
        alert("No se pudo eliminar: " + txt);
      }
    } catch (err) {
      alert("Error de conexión al intentar eliminar");
    }
  };

  const filteredRemitos = remitos.filter(r =>
    r.numero?.toString().includes(searchTerm) ||
    r.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mercaderia-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon"><FiFileText /></div>
            <div>
              <h1>Ventas y Remitos</h1>
              <p>Gestión integral del flujo de salida de mercadería</p>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={() => { setEditingRemito(null); setModalRemitoOpen(true); }} className="btn-primary">
              <FiPlus /> Nuevo Remito
            </button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación Interna */}
      <div className="tabs-container" style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
        <button
          className={`tab-btn ${activeTab === "todos" ? "active" : ""}`}
          onClick={() => setActiveTab("todos")}
        >
          <FiList /> Todos los Remitos
        </button>
        <button
          className={`tab-btn ${activeTab === "pendientes" ? "active" : ""}`}
          onClick={() => setActiveTab("pendientes")}
        >
          <FiClock /> Por Valorizar
        </button>
        <button
          className={`tab-btn ${activeTab === "cobrar" ? "active" : ""}`}
          onClick={() => setActiveTab("cobrar")}
        >
          <FiCreditCard /> Por Cobrar
        </button>
        <button
          className={`tab-btn ${activeTab === "historial" ? "active" : ""}`}
          onClick={() => setActiveTab("historial")}
        >
          <FiShoppingCart /> Historial de Ventas Completas
        </button>
      </div>

      {activeTab === "pendientes" && (
        <>
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar remito..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRemitos.filter(r => r.estado === "PENDIENTE").map(r => (
                  <tr key={r.id}>
                    <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                    <td>{new Date(r.fecha).toLocaleDateString()}</td>
                    <td>{r.clienteNombre}</td>
                    <td>
                      <span className="stock-badge in-stock">{r.items?.length} ítems</span>
                      <ItemsTooltip items={r.items || []} />
                    </td>
                    <td className="actions-cell">
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          onClick={() => setValorizingRemito(r)}
                          className="btn-primary"
                          style={{ backgroundColor: "var(--success)", padding: "6px 12px", fontSize: "0.85rem" }}
                        >
                          <FiDollarSign /> Valorizar
                        </button>
                        <button onClick={() => handleDownloadPdf(r.id, r.numero)} className="icon-btn edit" title="Descargar PDF"><FiDownload /></button>
                        <button onClick={() => { setEditingRemito(r); setModalRemitoOpen(true); }} className="icon-btn edit" title="Editar"><FiEdit2 /></button>
                        <button onClick={() => handleDeleteRemito(r.id, r.numero)} className="icon-btn delete" title="Eliminar remito"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "todos" && (
        <>
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar en todos los remitos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRemitos.map(r => (
                  <tr key={r.id}>
                    <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                    <td>{new Date(r.fecha).toLocaleDateString()}</td>
                    <td>{r.clienteNombre}</td>
                    <td>
                      <span className={`status-badge ${r.estado === 'COBRADO' ? 'active' :
                        r.estado === 'VALORIZADO' ? 'por-vencer' : 'inactive'
                        }`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="price-cell">{r.total ? `$${r.total.toLocaleString()}` : "-"}</td>
                    <td className="actions-cell">
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleDownloadPdf(r.id, r.numero)} className="icon-btn edit" title="Descargar PDF"><FiDownload /></button>
                        <button onClick={() => handleDeleteRemito(r.id, r.numero)} className="icon-btn delete" title="Eliminar"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "cobrar" && <CobrosSection onUpdate={fetchData} />}
      {activeTab === "historial" && (
        <>
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar en el historial..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nº</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {remitos.filter(r => r.estado === "COBRADO")
                  .map(r => ({
                    ...r,
                    type: "remito",
                    displayName: "Remito/Venta",
                    numeroInterno: r.numero,
                    nombreCliente: r.clienteNombre
                  }))
                  .filter(item =>
                    item.numeroInterno?.toString().includes(searchTerm) ||
                    item.nombreCliente?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .map((v, idx) => (
                    <tr key={`${v.id}-${idx}`}>
                      <td>
                        <span className="status-badge active" style={{ fontSize: '0.7rem' }}>
                          {v.displayName}
                        </span>
                      </td>
                      <td className="sku-cell"><span className="sku-badge">#{v.numeroInterno}</span></td>
                      <td>{new Date(v.fecha).toLocaleDateString()}</td>
                      <td>{v.nombreCliente}</td>
                      <td className="price-cell">${v.total?.toLocaleString()}</td>
                      <td><span className="status-badge active">COBRADO</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalRemitoOpen && (
        <RemitoFormModal
          remito={editingRemito}
          onClose={() => { setModalRemitoOpen(false); setEditingRemito(null); }}
          onSaved={() => {
            setModalRemitoOpen(false);
            setEditingRemito(null);
            fetchData();
            setToast({
              title: editingRemito ? "Remito actualizado" : "Remito creado",
              message: "El comprobante se generó correctamente.",
              type: "success"
            });
          }}
        />
      )}

      {toast && (
        <div className="toast-container">
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {valorizingRemito && (
        <ValorizarSection
          initialRemito={valorizingRemito}
          onClose={() => setValorizingRemito(null)}
          onUpdate={() => {
            setValorizingRemito(null);
            fetchData();
          }}
        />
      )}

      <style>{`
                .tab-btn {
                    padding: 10px 16px;
                    border: none;
                    background: transparent;
                    color: var(--muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .tab-btn:hover { background: var(--bg); color: var(--text); }
                .tab-btn.active { background: #e8f5e9; color: #2e7d32; }
            `}</style>
    </div>
  );
}