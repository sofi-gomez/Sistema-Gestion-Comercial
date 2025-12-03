import React from "react";
import { useNavigate } from "react-router-dom";
import { FiShoppingCart, FiPackage, FiUsers, FiFileText, FiDollarSign, FiBarChart2 } from "react-icons/fi";
import "../index.css";

const modules = [
  { title: "Mercadería", desc: "Carga de productos y stock", path: "/mercaderia", icon: <FiPackage />, color: "from-green-500 to-emerald-600" },
  { title: "Ventas", desc: "Registrar ventas e historial", path: "/ventas", icon: <FiShoppingCart />, color: "from-green-500 to-emerald-600" },
  { title: "Clientes", desc: "Datos de contacto", path: "/clientes", icon: <FiBarChart2 />, color: "from-green-500 to-emerald-600" },
  { title: "Remitos", desc: "Gestión de remitos", path: "/remitos", icon: <FiFileText />, color: "from-green-500 to-emerald-600" },
  { title: "Proveedores", desc: "Datos de contacto", path: "/proveedores", icon: <FiUsers />, color: "from-green-500 to-emerald-600"},
  { title: "Tesorería", desc: "Movimientos del negocio", path: "/tesoreria", icon: <FiDollarSign />, color: "from-green-500 to-emerald-600" },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      {/* Header más compacto */}
      <header className="home-header">
        <div className="brand">
          <div className="logo-container">
            <img src="/isotipo.png" alt="Logo" className="brand-logo" />
          </div>
          <div className="brand-text">
            <h1>LEONEL GOMEZ</h1>
            <p className="subtitle">Agro-Ferretería</p>
          </div>
        </div>
      </header>

      {/* Main Content más compacto */}
      <main className="home-main">
        <div className="modules-section">
          <div className="cards-grid">
            {modules.map((m) => (
              <article
                key={m.title}
                className={`module-card ${m.color}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(m.path)}
                onKeyDown={(e) => (e.key === "Enter" ? navigate(m.path) : null)}
              >
                <div className="card-content">
                  <div className="icon-container">
                    <div className="card-icon">{m.icon}</div>
                  </div>
                  <div className="card-text">
                    <h4 className="card-title">{m.title}</h4>
                    <p className="card-desc">{m.desc}</p>
                  </div>
                  <div className="card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      {/* Footer más compacto */}
      <footer className="home-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Leonel Gomez — Agro-Ferretería</p>
          <p className="footer-tagline">NUESTRAS PLANTAS NUNCA DUERMEN</p>
        </div>
      </footer>
    </div>
  );
}