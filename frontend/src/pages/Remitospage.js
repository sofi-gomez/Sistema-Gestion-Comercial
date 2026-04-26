import React, { useState, useEffect } from "react";
import {
  FiFileText, FiSearch, FiEdit2, FiTrash2, FiPlus,
  FiDownload, FiDollarSign, FiClock, FiCreditCard,
  FiShoppingCart, FiList, FiTrendingUp, FiActivity, FiCalendar, FiTag
} from "react-icons/fi";
import RemitoFormModal from "../components/RemitoFormModal";
import ValorizarSection from "../components/ValorizarSection";
import CobrosSection from "../components/CobrosSection";
import CobroFormModal from "../components/CobroFormModal";
import Toast from "../components/Toast";
import ItemsTooltip from "../components/ItemsTooltip";
import { apiFetch } from "../utils/api";
import { formatDateLocal } from "../utils/dateUtils";

const API_REMITOS = "/api/remitos";

export default function RemitosPage() {
  const [remitos, setRemitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [modalRemitoOpen, setModalRemitoOpen] = useState(false);
  const [editingRemito, setEditingRemito] = useState(null);
  const [valorizingRemito, setValorizingRemito] = useState(null);
  const [cobrandoRemito, setCobrandoRemito] = useState(null);
  const [toast, setToast] = useState(null);
  const [metrics, setMetrics] = useState({ ventasHoy: 0, ventasSemana: 0, ventasMes: 0 });
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const fetchData = async () => {
    try {
      const [resR, resM] = await Promise.all([
        apiFetch(API_REMITOS),
        apiFetch("/api/cobros/dashboard-summary")
      ]);

      if (resR.ok) setRemitos(await resR.json());
      if (resM.ok) {
        const data = await resM.json();
        setMetrics({
          ventasHoy: data.ventasHoy || 0,
          ventasSemana: data.ventasSemana || 0,
          ventasMes: data.ventasMes || 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPdf = async (id, numero) => {
    try {
      const res = await apiFetch(`${API_REMITOS}/${id}/pdf`);
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
      const res = await apiFetch(`${API_REMITOS}/${id}`, {
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

      {/* Metrics Cards Section */}
      <div className="metrics-grid">
        <div className="metric-card cyan">
          <div className="metric-icon"><FiActivity /></div>
          <div className="metric-content">
            <span className="metric-label">Ventas de Hoy</span>
            <h3 className="metric-value">${metrics.ventasHoy.toLocaleString()}</h3>
          </div>
        </div>
        <div className="metric-card emerald">
          <div className="metric-icon"><FiTrendingUp /></div>
          <div className="metric-content">
            <span className="metric-label">Esta Semana</span>
            <h3 className="metric-value">${metrics.ventasSemana.toLocaleString()}</h3>
          </div>
        </div>
        <div className="metric-card amber">
          <div className="metric-icon"><FiCalendar /></div>
          <div className="metric-content">
            <span className="metric-label">Este Mes</span>
            <h3 className="metric-value">${metrics.ventasMes.toLocaleString()}</h3>
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
                  <th style={{ width: "1%", whiteSpace: "nowrap", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRemitos.filter(r => r.estado === "PENDIENTE").map(r => (
                  <React.Fragment key={r.id}>
                    <tr className={expandedRows.has(r.id) ? "expanded-parent" : ""}>
                      <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                      <td>{formatDateLocal(r.fecha)}</td>
                      <td>
                        <div style={{ fontWeight: "500" }}>{r.clienteNombre}</div>
                        {r.cliente?.notas && (
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px", maxWidth: "200px", whiteSpace: "normal" }}>
                            <strong>Notas:</strong> {r.cliente.notas}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-modern secondary"
                          style={{ padding: "4px 8px", fontSize: "0.75rem", gap: "4px", display: "flex", alignItems: "center" }}
                          onClick={() => toggleRow(r.id)}
                        >
                          {expandedRows.has(r.id) ? "▲" : "▼"} {r.items?.length || 0} ítems
                        </button>
                      </td>
                      <td className="actions-cell">
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
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
                    {expandedRows.has(r.id) && (
                      <tr className="expanded-row">
                        <td colSpan="7" style={{ padding: "0" }}>
                          <div className="expanded-content-wrapper">
                            <table className="modern-table mini">
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th style={{ textAlign: "center" }}>Cantidad</th>
                                  {(r.estado === "VALORIZADO" || r.estado === "COBRADO") && <th style={{ textAlign: "right" }}>Precio Unit.</th>}
                                  {(r.estado === "VALORIZADO" || r.estado === "COBRADO") && <th style={{ textAlign: "right" }}>Subtotal</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {r.items?.map((it, idx) => (
                                  <tr key={idx}>
                                    <td>{it.producto?.nombre || "Producto desconocido"}</td>
                                    <td style={{ textAlign: "center" }}>{it.cantidad}</td>
                                    {(r.estado === "VALORIZADO" || r.estado === "COBRADO") && <td style={{ textAlign: "right" }}>{it.precioUnitario ? `$${it.precioUnitario.toLocaleString()}` : "-"}</td>}
                                    {(r.estado === "VALORIZADO" || r.estado === "COBRADO") && <td style={{ textAlign: "right" }}>{it.precioUnitario ? `$${(it.cantidad * it.precioUnitario).toLocaleString()}` : "-"}</td>}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
                  <th>Observaciones</th>
                  <th>Total</th>
                  <th style={{ width: "1%", whiteSpace: "nowrap", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRemitos.map(r => (
                  <tr key={r.id}>
                    <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                    <td>{formatDateLocal(r.fecha)}</td>
                    <td>
                      <div style={{ fontWeight: "500" }}>{r.clienteNombre}</div>
                      {r.cliente?.notas && (
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px", maxWidth: "200px", whiteSpace: "normal" }}>
                          <strong>Notas:</strong> {r.cliente.notas}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${r.estado === 'COBRADO' ? 'active' :
                        r.estado === 'VALORIZADO' ? 'por-vencer' : 'inactive'
                        }`}>
                        {r.estado}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--muted)", maxWidth: "250px" }}>{r.observaciones || "-"}</td>
                    <td className="price-cell">{r.total ? `$${r.total.toLocaleString()}` : "-"}</td>
                    <td className="actions-cell">
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        {r.estado === "VALORIZADO" && (
                          <button
                            onClick={() => setCobrandoRemito(r)}
                            className="icon-btn edit"
                            style={{ color: "#10b981", background: "#f0fdf4" }}
                            title="Registrar Cobro"
                          >
                            <FiDollarSign />
                          </button>
                        )}
                        {(r.estado === "VALORIZADO" || r.estado === "COBRADO") && (
                          <button
                            onClick={() => {
                              if (r.estado === "COBRADO") {
                                if (!window.confirm("ADVERTENCIA: Este remito ya está COBRADO. Si cambias sus precios, volverá a estado VALORIZADO y podrías tener inconsistencias con los pagos recibidos. ¿Seguro que quieres continuar?")) return;
                              }
                              setValorizingRemito(r);
                            }}
                            className="icon-btn edit"
                            style={{ color: "#2563eb", background: "#dbeafe" }}
                            title="Re-valorizar precios"
                          >
                            <FiTag />
                          </button>
                        )}
                        <button onClick={() => handleDownloadPdf(r.id, r.numero)} className="icon-btn edit" title="Descargar PDF"><FiDownload /></button>
                        <button
                          onClick={() => {
                            if (r.estado !== "PENDIENTE") {
                              if (!window.confirm(`Este remito está ${r.estado}. Editarlo podría afectar la consistencia de los precios y cobros. ¿Deseas continuar?`)) {
                                return;
                              }
                            }
                            setEditingRemito(r);
                            setModalRemitoOpen(true);
                          }}
                          className="icon-btn edit"
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
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
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
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
                    <React.Fragment key={`${v.id}-${idx}`}>
                      <tr className={expandedRows.has(v.id) ? "expanded-parent" : ""}>
                        <td>
                          <span className="status-badge active" style={{ fontSize: '0.7rem' }}>
                            {v.displayName}
                          </span>
                        </td>
                        <td className="sku-cell"><span className="sku-badge">#{v.numeroInterno}</span></td>
                        <td>{formatDateLocal(v.fecha)}</td>
                        <td>{v.nombreCliente}</td>
                        <td>
                          <button
                            className="btn-modern secondary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem", gap: "4px", display: "flex", alignItems: "center" }}
                            onClick={() => toggleRow(v.id)}
                          >
                            {expandedRows.has(v.id) ? "▲" : "▼"} {v.items?.length || 0} ítems
                          </button>
                        </td>
                        <td className="price-cell">${v.total?.toLocaleString()}</td>
                        <td><span className="status-badge active">COBRADO</span></td>
                        <td className="actions-cell">
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => {
                                if (v.estado === "COBRADO") {
                                  if (!window.confirm("ADVERTENCIA: Este remito ya está COBRADO. Si cambias sus precios, volverá a estado VALORIZADO. ¿Seguro que quieres continuar?")) return;
                                }
                                setValorizingRemito(v);
                              }}
                              className="icon-btn edit"
                              style={{ color: "#2563eb", background: "#dbeafe" }}
                              title="Re-valorizar"
                            >
                              <FiTag />
                            </button>
                            <button onClick={() => handleDownloadPdf(v.id, v.numeroInterno)} className="icon-btn edit" title="Descargar PDF">
                              <FiDownload />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(v.id) && (
                        <tr className="expanded-row">
                          <td colSpan="8" style={{ padding: "0" }}>
                            <div className="expanded-content-wrapper">
                              <table className="modern-table mini">
                                <thead>
                                  <tr>
                                    <th>Producto</th>
                                    <th style={{ textAlign: "center" }}>Cantidad</th>
                                    <th style={{ textAlign: "right" }}>Precio Unit.</th>
                                    <th style={{ textAlign: "right" }}>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {v.items?.map((it, iidx) => (
                                    <tr key={iidx}>
                                      <td>{it.producto?.nombre || "Producto desconocido"}</td>
                                      <td style={{ textAlign: "center" }}>{it.cantidad}</td>
                                      <td style={{ textAlign: "right" }}>${it.precioUnitario?.toLocaleString() || "0"}</td>
                                      <td style={{ textAlign: "right" }}>${(it.cantidad * (it.precioUnitario || 0)).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
          onUpdate={(valorizedRemito) => {
            setValorizingRemito(null);
            fetchData();
            if (valorizedRemito && valorizedRemito.id) {
              if (window.confirm(`Remito #${valorizedRemito.numero} valorizado por $${valorizedRemito.total.toLocaleString()}. ¿Deseas registrar el cobro ahora?`)) {
                setCobrandoRemito(valorizedRemito);
              }
            }
          }}
        />
      )}

      {cobrandoRemito && (
        <CobroFormModal
          clienteIdPreselected={cobrandoRemito.cliente?.id}
          remitoId={cobrandoRemito.id}
          montoSugerido={cobrandoRemito.total}
          onClose={() => setCobrandoRemito(null)}
          onSaved={() => {
            setCobrandoRemito(null);
            fetchData();
            setToast({
              title: "Cobro registrado",
              message: `Se registró el pago del remito #${cobrandoRemito.numero}.`,
              type: "success"
            });
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

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 25px;
                    width: 100%;
                }
                .metric-card {
                    background: white;
                    padding: 1.25rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    border: 1px solid #f1f5f9;
                    min-height: 80px;
                }
                .metric-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                .metric-content {
                    flex: 1;
                    min-width: 0;
                }
                .metric-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .metric-value {
                    margin: 0.25rem 0 0 0;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                
                .metric-card.cyan .metric-icon { background: #ecfeff; color: #0891b2; }
                .metric-card.emerald .metric-icon { background: #ecfdf5; color: #059669; }
                .metric-card.amber .metric-icon { background: #fffbeb; color: #d97706; }

                @media (max-width: 768px) {
                    .metrics-grid { grid-template-columns: 1fr; }
                }
            `}</style>
    </div>
  );
}
