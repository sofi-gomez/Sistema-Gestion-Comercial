import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiPackage, FiUsers, FiFileText, FiTruck, FiDollarSign,
    FiArrowRight, FiAlertCircle, FiClock, FiCheckSquare, FiTrendingUp, FiCreditCard, FiActivity, FiSettings, FiLogOut, FiUser
} from "react-icons/fi";
import "../index.css";
import { apiFetch } from "../utils/api";

const API_REMITOS = "/api/remitos";
const API_TESORERIA = "/api/tesoreria/resumen";
const API_PRODUCTOS = "/api/productos/dashboard-summary";
const API_COBROS = "/api/cobros/dashboard-summary";
const API_PROVEEDORES = "/api/proveedores";

const modules = [
    { title: "Mercadería", desc: "Productos, stock y movimientos", path: "/mercaderia", icon: <FiPackage />, color: "from-green-500 to-emerald-600" },
    { title: "Clientes", desc: "Cuentas corrientes,cobros y remitos", path: "/clientes", icon: <FiUsers />, color: "from-blue-600 to-cyan-500" },
    { title: "Remitos y Ventas", desc: "Crear,valorizar y cobrar remitos de ventas", path: "/remitos", icon: <FiFileText />, color: "from-orange-500 to-amber-600" },
    { title: "Proveedores", desc: "Compras, deudas y pagos", path: "/proveedores", icon: <FiTruck />, color: "from-purple-500 to-violet-600" },
    { title: "Tesorería", desc: "Caja diaria y cheques", path: "/tesoreria", icon: <FiDollarSign />, color: "from-gray-600 to-slate-700" },
    { title: "Herramientas", desc: "Precios, Excel y ajustes", path: "/configuracion", icon: <FiSettings />, color: "from-slate-400 to-slate-500" },
];

export default function HomePage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        remitosPendientes: 0,
        remitosValorizados: 0,
        saldoCaja: 0,
        cuentasPorCobrar: 0,
        cuentasPorPagar: 0,
        stockCritico: 0,
        proximosAVencer: 0,
        ventasSemana: 0,
        totalCheques: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                const [resRem, resTes, resProd, resCob, resProv] = await Promise.all([
                    apiFetch(API_REMITOS),
                    apiFetch(API_TESORERIA),
                    apiFetch(API_PRODUCTOS),
                    apiFetch(API_COBROS),
                    apiFetch(`${API_PROVEEDORES}/dashboard-summary`)
                ]);

                const getJson = async (res) => {
                    try {
                        const data = await res.json();
                        return Array.isArray(data) ? data : (data.content && Array.isArray(data.content) ? data.content : []);
                    } catch (e) { return []; }
                };

                const remitos = await getJson(resRem);
                const tesoreria = await resTes.json().catch(() => ({}));
                const productos = await resProd.json().catch(() => ({}));
                const cobros = await resCob.json().catch(() => ({}));
                const proveedores = await resProv.json().catch(() => ({}));

                setStats({
                    remitosPendientes: remitos.filter(r => r.estado === "PENDIENTE").length,
                    remitosValorizados: remitos.filter(r => r.estado === "VALORIZADO").length,
                    saldoCaja: tesoreria.saldoActual || 0,
                    cuentasPorCobrar: cobros.cuentasPorCobrar || 0,
                    cuentasPorPagarARS: proveedores.cuentasPorPagarARS || 0,
                    cuentasPorPagarUSD: proveedores.cuentasPorPagarUSD || 0,
                    stockCritico: productos.stockCritico || 0,
                    proximosAVencer: productos.proximosAVencer || 0,
                    ventasSemana: cobros.ventasSemana || 0,
                    totalCheques: tesoreria.totalCheques || 0,
                    chequesUrgentesCount: tesoreria.chequesUrgentesCount || 0,
                    chequesUrgentesImporte: tesoreria.chequesUrgentesImporte || 0,
                    chequesParaCobrarCount: tesoreria.chequesParaCobrarCount || 0,
                    chequesParaCobrarImporte: tesoreria.chequesParaCobrarImporte || 0
                });
            } catch (e) {
                console.error("Error fetching dashboard stats:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAllStats();
    }, []);

    return (
        <div className="homepage-content">
            <main className="home-main">
                <div className="modules-section">

                    {/* KPI Cards Section - Perfectly Symmetric 3x2 Grid */}
                    <div className="kpi-grid">
                        <div className="kpi-card" onClick={() => navigate("/tesoreria")}>
                            <div className="kpi-icon-wrapper blue"><FiDollarSign /></div>
                            <div className="kpi-info">
                                <p className="kpi-label">Disponible en Caja</p>
                                <h3 className="kpi-value text-blue-600">${stats.saldoCaja.toLocaleString()}</h3>
                            </div>
                        </div>

                        <div className="kpi-card" onClick={() => navigate("/clientes")}>
                            <div className="kpi-icon-wrapper emerald"><FiTrendingUp /></div>
                            <div className="kpi-info">
                                <p className="kpi-label">Cuentas por Cobrar</p>
                                <h3 className="kpi-value text-emerald-600">${stats.cuentasPorCobrar.toLocaleString()}</h3>
                            </div>
                        </div>

                        <div className="kpi-card" onClick={() => navigate("/proveedores")}>
                            <div className="kpi-icon-wrapper red"><FiUser /></div>
                            <div className="kpi-info">
                                <p className="kpi-label">Cuentas por Pagar</p>
                                <div className="kpi-dual-values">
                                    <h3 className="kpi-value text-red-600">
                                        <small className="currency-label">ARS</small> ${stats.cuentasPorPagarARS?.toLocaleString()}
                                    </h3>
                                    <h3 className="kpi-value text-red-400">
                                        <small className="currency-label">USD</small> ${stats.cuentasPorPagarUSD?.toLocaleString()}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="kpi-card" onClick={() => navigate("/mercaderia")}>
                            <div className="kpi-icon-wrapper orange"><FiClock /></div>
                            <div className="kpi-info">
                                <p className="kpi-label">Próximos a Vencer</p>
                                <h3 className="kpi-value text-orange-600">{stats.proximosAVencer} <small>30 Días</small></h3>
                            </div>
                        </div>

                        <div className="kpi-card alerts-card" onClick={() => navigate("/tesoreria?tab=cheques")}>
                            <div className="kpi-icon-wrapper purple"><FiCreditCard /></div>
                            <div className="kpi-info">
                                <p className="kpi-label">Alertas de Cheques</p>
                                <div className="alerts-summary">
                                    {(() => {
                                        const totalListosCount = stats.chequesParaCobrarCount + stats.chequesUrgentesCount;
                                        const totalListosImporte = stats.chequesParaCobrarImporte + stats.chequesUrgentesImporte;

                                        return (
                                            <>
                                                <div className={`alert-item ${totalListosCount > 0 ? 'success' : ''}`}>
                                                    <span className="alert-dot"></span>
                                                    <span className="alert-text">
                                                        {totalListosCount > 0
                                                            ? `P/Cobrar: $${totalListosImporte.toLocaleString()}`
                                                            : 'Nada p/cobrar hoy'}
                                                    </span>
                                                </div>
                                                <div className={`alert-item ${stats.chequesUrgentesCount > 0 ? 'danger' : ''}`}>
                                                    <span className="alert-dot"></span>
                                                    <span className="alert-text">
                                                        {stats.chequesUrgentesCount > 0
                                                            ? `Urgentes: $${stats.chequesUrgentesImporte.toLocaleString()}`
                                                            : 'Sin urgencias'}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="kpi-card stock-card" onClick={() => navigate("/mercaderia")}>
                            <div className="kpi-icon-wrapper orange"><FiAlertCircle /></div>
                            <div className="kpi-info">
                                <p className="kpi-label">Alertas de Stock</p>
                                <h3 className="kpi-value text-orange-600">{stats.stockCritico} <small>Críticos</small></h3>
                            </div>
                        </div>
                    </div>

                    {/* Module Cards Section - Perfectly Symmetric 2x3 Grid */}
                    <div className="cards-grid-unified">
                        {modules.map((module, index) => (
                            <div
                                key={index}
                                className="module-card-flex"
                                onClick={() => module.path !== "#" && navigate(module.path)}
                                style={{ width: "100%", cursor: module.path === "#" ? "default" : "pointer" }}
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
                    <p>© {new Date().getFullYear()} Leonel Gomez — Agro-Ferretería</p>
                    <p className="footer-tagline">NUESTRAS PLANTAS NUNCA DUERMEN</p>
                </div>
            </footer>


            <style>{`
                .home-root { background: #f8fafc; min-height: 100vh; overflow-x: hidden; }
                
                .modules-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    padding: 0 1rem;
                    box-sizing: border-box;
                    margin-bottom: 3rem;
                }

                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto 3rem auto;
                    box-sizing: border-box;
                }

                .cards-grid-unified {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                    box-sizing: border-box;
                }

                .kpi-card {
                    background: white;
                    padding: 1.25rem;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    border: 1px solid #f1f5f9;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                    min-width: 0;
                }

                .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

                .kpi-icon-wrapper {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }

                .kpi-info { min-width: 0; flex: 1; }

                .kpi-icon-wrapper.blue { background: #eff6ff; color: #2563eb; }
                .kpi-icon-wrapper.emerald { background: #ecfdf5; color: #059669; }
                .kpi-icon-wrapper.rose { background: #fff1f2; color: #e11d48; }
                .kpi-icon-wrapper.amber { background: #fffbeb; color: #d97706; }
                .kpi-icon-wrapper.purple { background: #f5f3ff; color: #7c3aed; }
                .kpi-icon-wrapper.orange { background: #fff7ed; color: #ea580c; }

                .kpi-label { font-size: 0.75rem; font-weight: 600; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 0.025em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .kpi-value { font-size: 1.15rem; font-weight: 700; margin: 0.15rem 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .kpi-value small { font-size: 0.7rem; color: #94a3b8; }

                .module-card-flex {
                    background: white;
                    border-radius: 12px;
                    padding: 1.25rem 1.5rem;
                    position: relative;
                    overflow: visible;
                    border: 1px solid var(--border);
                    transition: all 0.2s ease;
                    box-shadow: var(--shadow);
                    min-height: 90px;
                    display: flex;
                    align-items: center;
                    box-sizing: border-box;
                }

                .card-content { display: flex; align-items: center; gap: 1rem; width: 100%; }
                .card-text { flex: 1; min-width: 0; }
                .card-title { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
                .card-desc { margin: 2px 0 0; font-size: 0.85rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .module-card-flex:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                }

                @media (max-width: 1024px) {
                    .kpi-grid, .cards-grid-unified { gap: 1rem; max-width: 900px; }
                }

                @media (max-width: 900px) {
                    .kpi-grid, .cards-grid-unified { grid-template-columns: repeat(2, 1fr); }
                    .kpi-card { padding: 1rem; }
                }

                @media (max-width: 600px) {
                    .kpi-grid, .cards-grid-unified { grid-template-columns: 1fr; max-width: 100%; }
                }
            `}</style>
        </div>
    );
}
