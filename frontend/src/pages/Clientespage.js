import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiUser, FiSearch, FiEdit2, FiPlus, FiPhone, FiMail,
  FiMapPin, FiFileText, FiArrowLeft, FiDollarSign
} from "react-icons/fi";
import ClienteCtaCteSection from "../components/ClienteCtaCteSection";
import ClienteRemitosSection from "../components/ClienteRemitosSection";
import ClienteFormModal from "../components/ClienteFormModal";
import Toast from "../components/Toast";
import { apiFetch } from "../utils/api";

const API = "/api/clientes";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [viewDetail, setViewDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("ctacte");
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API);
      setClientes(await res.json() || []);
    } catch (e) { setClientes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // Lógica de Deep Linking (Auto-abrir cliente si viene de Tesorería)
  useEffect(() => {
    if (clientes.length > 0 && location.state && location.state.autoOpenClienteId) {
      const c = clientes.find(cli => cli.id === location.state.autoOpenClienteId);
      if (c) {
        setSelectedCliente(c);
        setViewDetail(true);
        if (location.state.autoOpenTab) {
          setActiveTab(location.state.autoOpenTab);
        }
        // Limpiamos el state para evitar reaperturas accidentales
        navigate('.', { replace: true, state: {} });
      }
    }
  }, [clientes, location.state, navigate]);

  const filteredClientes = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documento?.includes(searchTerm)
  );

  const handleSave = async (payload) => {
    try {
      const method = payload.id ? "PUT" : "POST";
      const url = payload.id ? `${API}/${payload.id}` : API;
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setModalOpen(false);
        if (!viewDetail) {
          setSelectedCliente(null);
        } else {
          setSelectedCliente({ ...selectedCliente, ...payload });
        }
        fetchAll();
        setToast({
          title: payload.id ? "Cliente actualizado" : "Cliente creado",
          message: `El cliente ${payload.nombre} se guardó correctamente.`,
          type: "success"
        });
      } else {
        alert("Error al guardar: " + await res.text());
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  // Detail View (Only for Cta Cte and Remitos)
  if (selectedCliente && viewDetail) {
    return (
      <div className="mercaderia-container">
        <div className="page-header" style={{ marginBottom: "1.5rem" }}>
          <div className="header-content">
            <div className="header-title">
              <button className="icon-btn" onClick={() => { setViewDetail(false); setSelectedCliente(null); }} style={{ marginRight: "1rem" }}>
                <FiArrowLeft />
              </button>
              <div className="title-icon"><FiUser /></div>
              <div>
                <h1>{selectedCliente.nombre}</h1>
                <p>{selectedCliente.documento || "Sin documento"}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="icon-btn edit" onClick={() => setModalOpen(true)} title="Editar Cliente">
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
          <button className={`tab-btn-modern ${activeTab === "ctacte" ? "active" : ""}`} onClick={() => setActiveTab("ctacte")}><FiDollarSign /> Cuenta Corriente</button>
          <button className={`tab-btn-modern ${activeTab === "remitos" ? "active" : ""}`} onClick={() => setActiveTab("remitos")}><FiFileText /> Historial Remitos</button>
        </div>

        <div className="tab-content">
          {activeTab === "ctacte" && <ClienteCtaCteSection clienteId={selectedCliente.id} />}
          {activeTab === "remitos" && <ClienteRemitosSection clienteId={selectedCliente.id} />}
        </div>

        {modalOpen && (
          <ClienteFormModal
            cliente={selectedCliente}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
          />
        )}

        {toast && (
          <div className="toast-container">
            <Toast title={toast.title} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mercaderia-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon"><FiUser /></div>
            <div>
              <h1>Gestión de Clientes</h1>
              <p>Listado completo con información de contacto y fiscal</p>
            </div>
          </div>
          <button onClick={() => { setSelectedCliente(null); setModalOpen(true); }} className="btn-primary"><FiPlus /> Nuevo Cliente</button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre o documento..."
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
                  <th>Cliente / Fiscal</th>
                  <th>Contacto</th>
                  <th>Dirección</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="product-info">
                        <h4>{c.nombre}</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <span className="sku-badge" style={{ fontSize: "0.75rem" }}>{c.documento || "SIN DOC."}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                        <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}><FiPhone size={14} color="var(--muted)" /> {c.telefono || "-"}</p>
                        <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: "4px 0 0 0" }}><FiMail size={14} color="var(--muted)" /> {c.email || "-"}</p>
                      </div>
                    </td>
                    <td style={{ maxWidth: "250px" }}>
                      <p style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.9rem", margin: 0 }}>
                        <FiMapPin size={14} color="var(--muted)" style={{ marginTop: "3px" }} />
                        <span>{c.direccion || "-"}</span>
                      </p>
                    </td>
                    <td style={{ maxWidth: "200px" }}>
                      <p style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.9rem", margin: 0, color: "var(--muted)" }}>
                        <FiFileText size={14} style={{ marginTop: "3px", flexShrink: 0 }} />
                        <span style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }} title={c.notas || "Sin notas"}>
                          {c.notas || "-"}
                        </span>
                      </p>
                    </td>
                    <td className="actions-cell">
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="icon-btn edit"
                          onClick={() => { setSelectedCliente(c); setModalOpen(true); }}
                          title="Editar información"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn-primary"
                          style={{ padding: "6px 12px", fontSize: "0.85rem", gap: "6px" }}
                          onClick={() => { setSelectedCliente(c); setViewDetail(true); setActiveTab("ctacte"); }}
                        >
                          <FiDollarSign /> Cuenta e Historial
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

      {modalOpen && (
        <ClienteFormModal
          cliente={selectedCliente}
          onClose={() => { setModalOpen(false); setSelectedCliente(null); }}
          onSave={handleSave}
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
