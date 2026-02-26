import React, { useEffect, useState } from "react";
import { FiPlus, FiUser, FiSearch, FiArrowLeft, FiDollarSign, FiFileText, FiEdit2, FiPhone, FiMail, FiMapPin, FiExternalLink } from "react-icons/fi";
import ClienteFormModal from "../components/ClienteFormModal";
import ClienteCtaCteSection from "../components/ClienteCtaCteSection";
import ClienteRemitosSection from "../components/ClienteRemitosSection";
import Toast from "../components/Toast";
import "../index.css";

const API = "http://localhost:8080/api/clientes";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [activeTab, setActiveTab] = useState("ctacte");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      setClientes(await res.json() || []);
    } catch (e) { setClientes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredClientes = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documento?.includes(searchTerm)
  );

  // Detail View (Only for Cta Cte and Remitos)
  if (selectedCliente) {
    return (
      <div className="mercaderia-container">
        <div className="page-header" style={{ marginBottom: "1.5rem" }}>
          <div className="header-content">
            <div className="header-title">
              <button className="icon-btn" onClick={() => setSelectedCliente(null)} style={{ marginRight: "1rem" }}>
                <FiArrowLeft />
              </button>
              <div className="title-icon"><FiUser /></div>
              <div>
                <h1>{selectedCliente.nombre}</h1>
                <p>{selectedCliente.documento || "Sin documento"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tabs-container" style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
          <button className={`tab-btn ${activeTab === "ctacte" ? "active" : ""}`} onClick={() => setActiveTab("ctacte")}><FiDollarSign /> Cuenta Corriente</button>
          <button className={`tab-btn ${activeTab === "remitos" ? "active" : ""}`} onClick={() => setActiveTab("remitos")}><FiFileText /> Historial Remitos</button>
        </div>

        <div className="tab-content">
          {activeTab === "ctacte" && <ClienteCtaCteSection clienteId={selectedCliente.id} />}
          {activeTab === "remitos" && <ClienteRemitosSection clienteId={selectedCliente.id} />}
        </div>
      </div>
    );
  }

  const handleSave = async (payload) => {
    try {
      const method = payload.id ? "PUT" : "POST";
      const url = payload.id ? `${API}/${payload.id}` : API;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setModalOpen(false);
        setSelectedCliente(null);
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
                          onClick={() => { setSelectedCliente(c); setActiveTab("ctacte"); }}
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