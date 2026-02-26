import React, { useEffect, useState } from "react";
import { FiPlus, FiUsers, FiSearch, FiArrowLeft, FiDollarSign, FiShoppingCart, FiEdit2, FiPhone, FiMail, FiMapPin, FiSave } from "react-icons/fi";
import ProveedoresFormModal from "../components/ProveedoresFormModal";
import ProveedorCtaCteSection from "../components/ProveedorCtaCteSection";
import ProveedorComprasSection from "../components/ProveedorComprasSection";
import CompraFormModal from "../components/CompraFormModal";
import Toast from "../components/Toast";
import "../index.css";

const API = "http://localhost:8080/api/proveedores";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProv, setSelectedProv] = useState(null);
  const [viewDetail, setViewDetail] = useState(false); // ✅ Nuevo: controla si mostramos la lista o el detalle
  const [activeTab, setActiveTab] = useState("ctacte");
  const [modalOpen, setModalOpen] = useState(false);
  const [compraModalOpen, setCompraModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      setProveedores(await res.json() || []);
    } catch (e) { setProveedores([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = proveedores.filter(p =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || p.cuit?.includes(searchTerm)
  );

  return (
    <div className="mercaderia-container">
      {viewDetail && selectedProv ? (
        <>
          <div className="page-header" style={{ marginBottom: "1.5rem" }}>
            <div className="header-content">
              <div className="header-title">
                <button className="icon-btn" onClick={() => { setViewDetail(false); setSelectedProv(null); }} style={{ marginRight: "1rem" }}>
                  <FiArrowLeft />
                </button>
                <div className="title-icon"><FiUsers /></div>
                <div>
                  <h1>{selectedProv.nombre}</h1>
                  <p>{selectedProv.cuit || "Sin CUIT"}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn-primary" onClick={() => setCompraModalOpen(true)}>
                  <FiPlus /> Registrar Compra
                </button>
                <button className="icon-btn edit" onClick={() => setModalOpen(true)} title="Editar Proveedor">
                  <FiEdit2 />
                </button>
              </div>
            </div>
          </div>

          <div className="tabs-container" style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
            <button className={`tab-btn ${activeTab === "ctacte" ? "active" : ""}`} onClick={() => setActiveTab("ctacte")}><FiDollarSign /> Cuenta e Historial</button>
            <button className={`tab-btn ${activeTab === "compras" ? "active" : ""}`} onClick={() => setActiveTab("compras")}><FiShoppingCart /> Historial Compras</button>
          </div>

          <div className="tab-content">
            {activeTab === "ctacte" && <ProveedorCtaCteSection proveedorId={selectedProv.id} />}
            {activeTab === "compras" && <ProveedorComprasSection proveedorId={selectedProv.id} />}
          </div>
        </>
      ) : (
        <>
          <div className="page-header">
            <div className="header-content">
              <div className="header-title">
                <div className="title-icon"><FiUsers /></div>
                <div>
                  <h1>Gestión de Proveedores</h1>
                  <p>Administrá información comercial y cuentas a pagar</p>
                </div>
              </div>
              <button onClick={() => { setSelectedProv(null); setViewDetail(false); setModalOpen(true); }} className="btn-primary"><FiPlus /> Nuevo Proveedor</button>
            </div>
          </div>

          <div className="filters-bar">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="table-container">
            {loading ? <div className="loading-spinner" /> : (
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Proveedor / CUIT</th>
                      <th>Contacto</th>
                      <th>Ubicación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="product-info">
                            <h4>{p.nombre}</h4>
                            <span className="sku-badge" style={{ fontSize: "0.75rem", marginTop: "4px" }}>{p.cuit || "S/C"}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.9rem" }}>
                            <p style={{ margin: 0 }}><FiPhone size={14} color="var(--muted)" /> {p.telefono || "-"}</p>
                            <p style={{ margin: "4px 0 0 0" }}><FiMail size={14} color="var(--muted)" /> {p.email || "-"}</p>
                          </div>
                        </td>
                        <td>
                          <p style={{ margin: 0, fontSize: "0.9rem" }}><FiMapPin size={14} color="var(--muted)" /> {p.direccion || "-"}</p>
                        </td>
                        <td className="actions-cell">
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="icon-btn edit" onClick={() => { setSelectedProv(p); setViewDetail(false); setModalOpen(true); }} title="Editar"><FiEdit2 /></button>
                            <button
                              className="btn-primary"
                              style={{ padding: "6px 12px", fontSize: "0.85rem", gap: "6px" }}
                              onClick={() => { setSelectedProv(p); setViewDetail(true); setActiveTab("ctacte"); }}
                              title="Ver Cuenta e Historial"
                            >
                              <FiDollarSign /> Cuenta e Historial
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "0.85rem", gap: "6px", background: "#e3f2fd", color: "#1976d2", border: "1px solid #bbdefb" }}
                              onClick={() => { setSelectedProv(p); setViewDetail(false); setCompraModalOpen(true); }}
                              title="Registrar Nueva Compra"
                            >
                              <FiPlus /> Nueva Compra
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {modalOpen && (
        <ProveedoresFormModal
          proveedor={selectedProv}
          onClose={() => { setModalOpen(false); }}
          onSave={() => { setModalOpen(false); fetchAll(); }}
        />
      )}

      {compraModalOpen && (
        <CompraFormModal
          proveedor={selectedProv}
          onClose={() => setCompraModalOpen(false)}
          onSaved={() => {
            setCompraModalOpen(false);
            fetchAll();
            setToast({
              title: "Compra registrada",
              message: "El ingreso de mercadería se procesó correctamente.",
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