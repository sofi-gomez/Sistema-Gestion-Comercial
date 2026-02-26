import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiPackage, FiUsers, FiFileText, FiTruck, FiDollarSign,
    FiArrowRight, FiAlertCircle, FiClock, FiCheckSquare
} from "react-icons/fi";
import "../index.css";

const API_REMITOS = "http://localhost:8080/api/remitos";

const modules = [
    { title: "Mercadería", desc: "Productos, stock y movimientos", path: "/mercaderia", icon: <FiPackage />, color: "from-green-500 to-emerald-600" },
    { title: "Clientes", desc: "Cuentas corrientes y remitos", path: "/clientes", icon: <FiUsers />, color: "from-blue-600 to-cyan-500" },
    { title: "Remitos y Ventas", desc: "Flujo completo: Nueva -> Valorizar -> Cobrar", path: "/remitos", icon: <FiFileText />, color: "from-orange-500 to-amber-600" },
    { title: "Proveedores", desc: "Compras, deudas y pagos", path: "/proveedores", icon: <FiTruck />, color: "from-purple-500 to-violet-600" },
    { title: "Tesorería", desc: "Caja diaria y cartera de cheques", path: "/tesoreria", icon: <FiDollarSign />, color: "from-gray-600 to-slate-700" },
];

export default function HomePage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ remitosPendientes: 0, remitosValorizados: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(API_REMITOS);
                const remitos = await res.json();
                setStats({
                    remitosPendientes: remitos.filter(r => r.estado === "PENDIENTE").length,
                    remitosValorizados: remitos.filter(r => r.estado === "VALORIZADO").length,
                });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, []);

    return (
        <div className="home-root">
            <header className="home-header">
                <div className="brand">
                    <div className="logo-container">
                        <img src="/iSOTIPO.png" alt="Isotipo" className="brand-logo" />
                    </div>
                    <div className="brand-text">
                        <h1>SISTEMA DE GESTIÓN</h1>
                        <p className="subtitle">Software de Administración Comercial</p>
                    </div>
                </div>
            </header>

            <main className="home-main">
                <div className="modules-section">
                    {/* Alertas integradas (Dashboard) */}
                    <div className="dashboard-alerts" style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "1.25rem",
                        marginBottom: "2.5rem",
                        maxWidth: "1000px",
                        margin: "0 auto 2.5rem auto"
                    }}>
                        {stats.remitosPendientes > 0 && (
                            <div className="alert-box warning" onClick={() => navigate("/remitos")} style={{ cursor: "pointer" }}>
                                <FiAlertCircle className="alert-icon" />
                                <div>
                                    <h4>Remitos sin Valorizar</h4>
                                    <p>Tienes <strong>{stats.remitosPendientes}</strong> pendientes de asignar precio.</p>
                                </div>
                            </div>
                        )}
                        {stats.remitosValorizados > 0 && (
                            <div className="alert-box info" onClick={() => navigate("/remitos")} style={{ cursor: "pointer" }}>
                                <FiClock className="alert-icon" />
                                <div>
                                    <h4>Remitos por Cobrar</h4>
                                    <p>Hay <strong>{stats.remitosValorizados}</strong> listos para su cobro.</p>
                                </div>
                            </div>
                        )}
                        {stats.remitosPendientes === 0 && stats.remitosValorizados === 0 && (
                            <div className="alert-box success" style={{ gridColumn: "1 / -1", maxWidth: "400px", margin: "0 auto" }}>
                                <FiCheckSquare className="alert-icon" />
                                <div>
                                    <h4>Sin alertas pendientes</h4>
                                    <p>Toda la gestión operativa está al día.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Grilla de 5 Módulos - Usando Flexbox para centrado perfecto */}
                    <div className="cards-flex-container">
                        {modules.map((module, index) => (
                            <div
                                key={index}
                                className="module-card-flex"
                                onClick={() => navigate(module.path)}
                            >
                                <div className="card-content">
                                    <div className="icon-container" style={{ background: `linear-gradient(135deg, ${module.color.split(' ')[0].replace('from-', '')}, ${module.color.split(' ')[1].replace('to-', '')})` }}>
                                        {React.cloneElement(module.icon, { className: 'card-icon' })}
                                    </div>
                                    <div className="card-text">
                                        <h3 className="card-title">{module.title}</h3>
                                        <p className="card-desc">{module.desc}</p>
                                    </div>
                                    <FiArrowRight className="card-arrow" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="home-footer">
                <div className="footer-content">
                    <p>© 2024 Sistema de Gestión Comercial</p>
                    <p className="footer-tagline">Optimización y control total de su negocio</p>
                </div>
            </footer>

            <style>{`
                .alert-box {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 18px;
                    border-radius: 12px;
                    background: white;
                    border: 1px solid var(--border);
                    box-shadow: var(--shadow);
                    transition: all 0.2s ease;
                }
                .alert-box:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
                .alert-icon { font-size: 24px; flex-shrink: 0; }
                .alert-box.warning { border-left: 5px solid #f59e0b; }
                .alert-box.warning .alert-icon { color: #f59e0b; }
                .alert-box.info { border-left: 5px solid #3b82f6; }
                .alert-box.info .alert-icon { color: #3b82f6; }
                .alert-box.success { border-left: 5px solid #10b981; }
                .alert-box.success .alert-icon { color: #10b981; }
                .alert-box h4 { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text); }
                .alert-box p { margin: 4px 0 0; font-size: 0.85rem; color: var(--muted); }
                
                .cards-flex-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 1.5rem;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .module-card-flex {
                    background: var(--card);
                    border-radius: 12px;
                    padding: 1.25rem 1.5rem;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    border: 1px solid var(--border);
                    transition: all 0.2s ease;
                    box-shadow: var(--shadow);
                    min-height: 80px;
                    display: flex;
                    align-items: center;
                    width: calc(33.333% - 1.5rem);
                    min-width: 300px;
                    flex-grow: 0;
                }

                .module-card-flex:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                }

                @media (max-width: 768px) {
                    .module-card-flex {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}