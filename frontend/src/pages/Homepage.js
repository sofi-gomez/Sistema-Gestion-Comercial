import React from "react";
import { useNavigate } from "react-router-dom";
import { FiShoppingCart, FiPackage, FiUsers, FiFileText, FiDollarSign, FiBarChart2 } from "react-icons/fi";
import "../index.css";

const modules = [
  { title: "Mercadería", desc: "Carga de productos y stock", path: "/mercaderia", icon: <FiPackage /> },
  { title: "Proveedores", desc: "Remitos, facturas y datos", path: "/proveedores", icon: <FiUsers /> },
  { title: "Ventas", desc: "Registrar operaciones e historial", path: "/ventas", icon: <FiShoppingCart /> },
  { title: "Tesorería", desc: "Movimientos y medios de pago", path: "/tesoreria", icon: <FiDollarSign /> },
  { title: "Remitos", desc: "Gestión de remitos", path: "/remitos", icon: <FiFileText /> },
  { title: "Informes", desc: "Visualización y estadísticas", path: "/informes", icon: <FiBarChart2 /> },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      <header className="home-header">
        <div className="brand">
          <img src="/assets/logo.png" alt="Logo" className="brand-logo" />
          <div className="brand-text">
            <h1>LEONEL GOMEZ</h1>
            <p className="subtitle">Agro-Ferreteria</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-ghost">Usuario</button>
        </div>
      </header>

      <main className="home-main">
        <div className="cards-grid wide">
          {modules.map((m) => (
            <article
              key={m.title}
              className="card large"
              role="button"
              tabIndex={0}
              onClick={() => navigate(m.path)}
              onKeyDown={(e) => (e.key === "Enter" ? navigate(m.path) : null)}
            >
              <div className="card-left">
                <div className="card-icon-wrap">
                  <div className="card-icon">{m.icon}</div>
                </div>
                <div className="card-text">
                  <div className="card-title">{m.title}</div>
                  <div className="card-sub">{m.desc}</div>
                </div>
              </div>
              <div className="card-right">›</div>
            </article>
          ))}
        </div>
      </main>

      <footer className="home-footer">© {new Date().getFullYear()} Leonel Gomez — Agro-Ferretería</footer>
    </div>
  );
}
