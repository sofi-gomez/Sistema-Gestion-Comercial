import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiShoppingCart,
    FiPackage,
    FiUsers,
    FiFileText,
    FiDollarSign,
    FiBarChart2,
    FiAlertTriangle
} from "react-icons/fi";
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

    const [productos, setProductos] = useState([]);
    const [vencimientos, setVencimientos] = useState([]);

    const API_URL = "http://localhost:8080/api/productos";

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const res = await fetch(API_URL);
                const data = await res.json();
                setProductos(data);

                // ----------- Detectar productos próximos a vencer -----------
                const hoy = new Date();

                const proximos = data
                    .filter((p) => p.fechaVencimiento)
                    .map((p) => {
                        const fecha = new Date(p.fechaVencimiento);
                        const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
                        return { ...p, diasRestantes: diff };
                    })
                    .filter((p) => p.diasRestantes >= 0 && p.diasRestantes <= 10);

                setVencimientos(proximos);
            } catch (err) {
                console.error("Error cargando productos:", err);
            }
        };

        fetchProductos();
    }, []);

    return (
        <div className="home-root">
            {/* Header */}
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

            <main className="home-main">

                {/* ------------- PANEL DE ALERTAS ------------- */}
                {vencimientos.length > 0 && (
                    <div className="alert-box">
                        <div className="alert-header">
                            <FiAlertTriangle className="alert-icon" />
                            <div>
                                <h2>Productos próximos a vencer</h2>
                                <p>Tienes {vencimientos.length} productos que vencen dentro de 10 días.</p>
                            </div>
                        </div>

                        <ul className="alert-list">
                            {vencimientos.slice(0, 5).map((p) => (
                                <li key={p.id}>
                                    <strong>{p.nombre}</strong> — vence en {p.diasRestantes} días
                                </li>
                            ))}
                        </ul>

                        {vencimientos.length > 5 && (
                            <p className="alert-extra">
                                + {vencimientos.length - 5} productos más...
                            </p>
                        )}

                        <button className="alert-btn" onClick={() => navigate("/mercaderia")}>
                            Ir a Mercadería
                        </button>
                    </div>
                )}

                {/* ------------ Módulos ------------ */}
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

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <p>© {new Date().getFullYear()} Leonel Gomez — Agro-Ferretería</p>
                    <p className="footer-tagline">NUESTRAS PLANTAS NUNCA DUERMEN</p>
                </div>
            </footer>
        </div>
    );
}
