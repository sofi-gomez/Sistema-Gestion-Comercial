import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiUsers, FiSearch, FiEdit2, FiPlus, FiPhone, FiMail,
  FiMapPin, FiArrowLeft, FiShoppingCart, FiDollarSign, FiFileText
} from "react-icons/fi";
import ProveedoresFormModal from "../components/ProveedoresFormModal";
import CompraFormModal from "../components/CompraFormModal";
import PagoProveedorFormModal from "../components/PagoProveedorFormModal";
import ProveedorCtaCteSection from "../components/ProveedorCtaCteSection";
import ProveedorComprasSection from "../components/ProveedorComprasSection";
import ReporteProveedorTab from "../components/ReporteProveedorTab";
import Toast from "../components/Toast";
import { apiFetch } from "../utils/api";

const API = "/api/proveedores";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [compraModalOpen, setCompraModalOpen] = useState(false);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [selectedProv, setSelectedProv] = useState(null);
  const [viewDetail, setViewDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("compras");
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pagoParaEditar, setPagoParaEditar] = useState(null);
  const [returnPath, setReturnPath] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API);
      setProveedores(await res.json() || []);
    } catch (e) { setProveedores([]); }
    finally { setLoading(false); }
  };

  const handleSaveProveedor = async (payload) => {
    try {
      const isEdit = !!payload.id;
      const url = isEdit ? `${API}/${payload.id}` : API;
      const method = isEdit ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setToast({
          title: isEdit ? "Proveedor actualizado" : "Proveedor creado",
          message: `La información de ${payload.nombre} se guardó correctamente.`,
          type: "success"
        });
        setModalOpen(false);
        fetchAll();
      } else {
        const errorData = await res.json();
        setToast({
          title: "Error al guardar",
          message: errorData.message || "Ocurrió un problema en el servidor.",
          type: "error"
        });
      }
    } catch (e) {
      setToast({
        title: "Error de conexión",
        message: "No se pudo comunicar con el servidor.",
        type: "error"
      });
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Lógica de Deep Linking desde Tesorería u otras áreas
  useEffect(() => {
    if (proveedores.length > 0 && location.state && location.state.autoOpenProveedorId) {
      const p = proveedores.find(prov => prov.id === location.state.autoOpenProveedorId);
      if (p) {
        setSelectedProv(p);
        setViewDetail(true);
        if (location.state.autoOpenTab) {
          setActiveTab(location.state.autoOpenTab);
        }
        
        // Capturamos el path de retorno
        if (location.state.returnTo) {
          setReturnPath({
            path: location.state.returnTo,
            label: location.state.returnLabel || 'Atrás'
          });
        }

        // Limpiamos el state para que no se auto-abra repetidamente si el usuario navega
        navigate('.', { replace: true, state: {} });
      }
    }
  }, [proveedores, location.state, navigate]);

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
                   <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                     <h1>{selectedProv.nombre}</h1>
                     {returnPath && (
                       <button 
                         onClick={() => navigate(returnPath.path)}
                         className="btn-modern"
                         style={{ 
                           padding: "6px 14px", 
                           fontSize: "0.8rem", 
                           background: "#eff6ff", 
                           color: "#2563eb",
                           border: "1px solid #bfdbfe",
                           fontWeight: "700",
                           borderRadius: "10px",
                           display: "flex",
                           alignItems: "center",
                           gap: "6px",
                           boxShadow: "0 2px 4px rgba(37, 99, 235, 0.1)",
                           cursor: "pointer",
                           transition: "all 0.2s"
                         }}
                         onMouseOver={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                         onMouseOut={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "translateY(0)"; }}
                       >
                         <FiArrowLeft /> Volver a {returnPath.label}
                       </button>
                     )}
                   </div>
                   <p>{selectedProv.cuit || "Sin CUIT"}</p>
                 </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn-modern success" onClick={() => setCompraModalOpen(true)}>
                  <FiPlus /> Registrar Compra
                </button>
                <button className="btn-modern danger" style={{ background: "#e11d48", color: "white" }} onClick={() => setPagoModalOpen(true)}>
                  <FiDollarSign /> Registrar Pago
                </button>
                <button className="icon-btn edit" onClick={() => setModalOpen(true)} title="Editar Proveedor">
                  <FiEdit2 />
                </button>
              </div>
            </div>
          </div>

          <div className="tabs-container" style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            paddingBottom: "12px",
            borderBottom: "1px solid #e2e8f0"
          }}>
            <button className={`tab-btn-modern ${activeTab === "compras" ? "active" : ""}`} onClick={() => setActiveTab("compras")}><FiShoppingCart /> Historial Compras</button>
            <button className={`tab-btn-modern ${activeTab === "ctacte" ? "active" : ""}`} onClick={() => setActiveTab("ctacte")}><FiDollarSign /> Historial de Pago</button>
            <button className={`tab-btn-modern ${activeTab === "reporte" ? "active" : ""}`} onClick={() => setActiveTab("reporte")}><FiFileText /> Reporte</button>
          </div>

          <div className="tab-content">
            {activeTab === "ctacte" && (
              <ProveedorCtaCteSection 
                proveedorId={selectedProv.id} 
                refreshKey={refreshKey} 
                onEditPago={(p) => { setPagoParaEditar(p); setPagoModalOpen(true); }}
              />
            )}
            {activeTab === "compras" && <ProveedorComprasSection proveedorId={selectedProv.id} refreshKey={refreshKey} />}
            {activeTab === "reporte" && <ReporteProveedorTab proveedorId={selectedProv.id} refreshKey={refreshKey} />}
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
                      <th style={{ textAlign: "center" }}>Acciones</th>
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
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button className="icon-btn edit" onClick={() => { setSelectedProv(p); setViewDetail(false); setModalOpen(true); }} title="Editar"><FiEdit2 /></button>
                            <button
                              className="btn-primary"
                              style={{ padding: "6px 12px", fontSize: "0.85rem", gap: "6px" }}
                              onClick={() => { setSelectedProv(p); setViewDetail(true); setActiveTab("compras"); }}
                              title="Ver Historial de Compras"
                            >
                              <FiShoppingCart /> Historial de Compras
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "0.85rem", gap: "6px", background: "#e3f2fd", color: "#1976d2", border: "1px solid #bbdefb" }}
                              onClick={() => { setSelectedProv(p); setViewDetail(false); setCompraModalOpen(true); }}
                              title="Registrar Nueva Compra"
                            >
                              <FiPlus /> Nueva Compra
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "0.85rem", gap: "6px", background: "#fef2f2", color: "#e11d48", border: "1px solid #fecaca" }}
                              onClick={() => { setSelectedProv(p); setViewDetail(false); setPagoModalOpen(true); }}
                              title="Registrar Pago"
                            >
                              <FiDollarSign /> Pago
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
          onSave={handleSaveProveedor}
        />
      )}

      {compraModalOpen && (
        <CompraFormModal
          proveedor={selectedProv}
          onClose={() => setCompraModalOpen(false)}
          onSaved={() => {
            setCompraModalOpen(false);
            fetchAll();
            setRefreshKey(prev => prev + 1); // ✅ Fuerza refresco de historial/reporte
            setToast({
              title: "Compra registrada",
              message: "El ingreso de mercadería se procesó correctamente.",
              type: "success"
            });
          }}
        />
      )}

      {pagoModalOpen && (
        <PagoProveedorFormModal
          proveedorIdPreselected={selectedProv?.id}
          pagoEditar={pagoParaEditar}
          onClose={() => { setPagoModalOpen(false); setPagoParaEditar(null); }}
          onSaved={() => {
            setPagoModalOpen(false);
            setPagoParaEditar(null);
            fetchAll();
            setRefreshKey(prev => prev + 1);
            setToast({
              title: pagoParaEditar ? "Pago actualizado" : "Pago registrado",
              message: pagoParaEditar ? "Los cambios se guardaron correctamente." : "El pago al proveedor se ha guardado correctamente.",
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

    </div>
  );
}
