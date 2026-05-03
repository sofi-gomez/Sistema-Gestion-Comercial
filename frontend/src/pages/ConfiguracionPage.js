import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiSave, FiDollarSign, FiArrowLeft, FiActivity,
    FiPercent, FiFileText, FiDownload, FiUpload, FiAlertTriangle, FiInfo
} from "react-icons/fi";
import Toast from "../components/Toast";
import { apiFetch } from "../utils/api";

const API_CONFIG = "/api/configuracion";
const API_PRODUCTOS = "/api/productos";

export default function ConfiguracionPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [config, setConfig] = useState({
        cotizacionDolar: 1000,
        stockMinimoGlobal: 5
    });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Estados para utilidades de precios
    const [porcentaje, setPorcentaje] = useState(0);
    const [tipoPrecio, setTipoPrecio] = useState("VENTA"); // "COSTO", "VENTA", "AMBOS"
    const [actualizandoPrecios, setActualizandoPrecios] = useState(false);

    useEffect(() => {
        apiFetch(API_CONFIG)
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error al cargar config:", err);
                setLoading(false);
            });
    }, []);

    const handleSaveConfig = async () => {
        try {
            const cleanConfig = {
                ...config,
                cuit: (config.cuit || "").replace(/[^0-9-]/g, "") // Limpieza final
            };
            const res = await apiFetch(API_CONFIG, {
                method: "PUT",
                body: JSON.stringify(cleanConfig)
            });
            if (res.ok) {
                setToast({ title: "Ajustes Guardados", message: "Los parámetros globales se actualizaron correctamente.", type: "success" });
            }
        } catch (err) {
            setToast({ title: "Error", message: "No se pudieron guardar los ajustes.", type: "error" });
        }
    };

    const handleActualizarPrecios = async () => {
        if (porcentaje === 0) return;
        if (!window.confirm(`¿Estás seguro de actualizar masivamente los precios (${tipoPrecio}) en un ${porcentaje}%? Esta acción no se puede deshacer.`)) return;

        setActualizandoPrecios(true);
        try {
            const res = await apiFetch(`${API_PRODUCTOS}/actualizar-precios?porcentaje=${porcentaje}&tipo=${tipoPrecio}`, {
                method: "POST"
            });
            if (res.ok) {
                setToast({ title: "Precios Actualizados", message: `Se aplicó un ajuste del ${porcentaje}% a todos los productos.`, type: "success" });
                setPorcentaje(0);
            }
        } catch (err) {
            setToast({ title: "Error", message: "Hubo un problema al actualizar los precios.", type: "error" });
        } finally {
            setActualizandoPrecios(false);
        }
    };

    const handleExportarExcel = async () => {
        try {
            const response = await apiFetch(`${API_PRODUCTOS}/exportar-excel`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `catalogo_productos_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            setToast({ title: "Error", message: "No se pudo generar el archivo Excel.", type: "error" });
        }
    };

    const handleImportarExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);
            const res = await apiFetch(`${API_PRODUCTOS}/importar-excel`, {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                setToast({
                    title: "Importación Exitosa",
                    message: "Los productos se actualizaron desde el Excel. Podés revisar los cambios en el módulo de Mercadería.",
                    type: "success"
                });
            }
        } catch (err) {
            setToast({ title: "Error", message: "Error al procesar el archivo Excel.", type: "error" });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (loading) return (
        <div className="home-root">
            <div className="flex items-center justify-center h-screen">
                <div className="loading-spinner"></div>
            </div>
        </div>
    );

    return (
        <div className="configuracion-content">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <main className="home-main config-main">
                <div className="config-container">
                    <div className="config-header-actions">
                        <div>
                            <h2 className="section-title">Centro de Control</h2>
                            <p className="section-subtitle">Utilidades potentes para la gestión diaria de tu negocio</p>
                        </div>
                    </div>

                    <div className="config-grid">
                        {/* TARJETA 1: ACTUALIZADOR MASIVO */}
                        <div className="config-card">
                            <div className="card-top-accent orange" />
                            <h3 className="card-inner-title">
                                <span className="icon-badge orange"><FiPercent /></span>
                                Actualizador Masivo de Precios
                            </h3>
                            <div className="card-form-grid">
                                <p className="util-description">Incrementa o decrementa precios de todo tu catálogo en un solo paso.</p>

                                <div className="input-field">
                                    <label>Porcentaje de Ajuste (%)</label>
                                    <input
                                        type="number"
                                        value={porcentaje}
                                        onChange={e => setPorcentaje(parseFloat(e.target.value))}
                                        placeholder="Ej: 10 o -5"
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </div>

                                <div className="input-field">
                                    <label>Aplicar a:</label>
                                    <select
                                        value={tipoPrecio}
                                        onChange={e => setTipoPrecio(e.target.value)}
                                        className="select-field"
                                    >
                                        <option value="VENTA">Solo Precios de Venta</option>
                                        <option value="COSTO">Solo Precios de Costo</option>
                                        <option value="AMBOS">Costo y Venta</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleActualizarPrecios}
                                    disabled={actualizandoPrecios || porcentaje === 0}
                                    className={`btn-action-util orange ${actualizandoPrecios ? 'loading' : ''}`}
                                >
                                    <FiActivity /> {actualizandoPrecios ? 'Procesando...' : 'Aplicar Cambio Masivo'}
                                </button>

                                <p className="field-hint warning">
                                    <FiAlertTriangle /> ¡Cuidado! Esta acción modifica todos los productos del sistema.
                                </p>
                            </div>
                        </div>

                        {/* TARJETA 2: EXCEL / DATOS */}
                        <div className="config-card">
                            <div className="card-top-accent blue" />
                            <h3 className="card-inner-title">
                                <span className="icon-badge blue"><FiFileText /></span>
                                Importación y Exportación de productos mediante excel
                            </h3>
                            <div className="card-form-grid">
                                <p className="util-description">Administra tus productos usando Excel para una edición más cómoda.</p>

                                <button onClick={handleExportarExcel} className="btn-action-util blue outline">
                                    <FiDownload /> Exportar Catálogo a Excel
                                </button>

                                <div className="divider"><span>o</span></div>

                                <button onClick={() => fileInputRef.current.click()} className="btn-action-util blue">
                                    <FiUpload /> Importar desde Excel
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept=".xlsx, .xls"
                                    onChange={handleImportarExcel}
                                />

                                <p className="field-hint">
                                    <FiInfo /> El archivo debe mantener el formato de columnas de la exportación.
                                </p>
                            </div>
                        </div>

                        {/* TARJETA 3: AJUSTES GLOBALES */}
                        <div className="config-card full-row">
                            <div className="card-top-accent emerald" />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h3 className="card-inner-title mb-0">
                                    <span className="icon-badge emerald"><FiDollarSign /></span>
                                    Parámetros Globales del Sistema
                                </h3>
                                <button onClick={handleSaveConfig} className="premium-save-btn small">
                                    <FiSave /> Guardar Ajustes
                                </button>
                            </div>

                            <div className="config-flex-grid" style={{ marginBottom: "2rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.5rem" }}>
                                <div className="input-field flex-2" style={{ minWidth: "300px" }}>
                                    <label>Nombre de la Empresa</label>
                                    <input
                                        type="text"
                                        value={config.nombreEmpresa || ""}
                                        onChange={e => setConfig({ ...config, nombreEmpresa: e.target.value })}
                                        placeholder="Ej: Agro-Ferretería Gomez"
                                    />
                                </div>
                                <div className="input-field flex-1">
                                    <label>CUIL / CUIT</label>
                                    <input
                                        type="text"
                                        value={config.cuit || ""}
                                        onChange={e => setConfig({ ...config, cuit: e.target.value.replace(/[^0-9-]/g, "") })}
                                        placeholder="Ej: 20-XXXXXXXX-X"
                                    />
                                </div>
                                <div className="input-field flex-2" style={{ minWidth: "350px", width: "100%" }}>
                                    <label>Dirección Comercial</label>
                                    <input
                                        type="text"
                                        value={config.direccion || ""}
                                        onChange={e => setConfig({ ...config, direccion: e.target.value })}
                                        placeholder="Calle, Número, Localidad..."
                                    />
                                </div>
                            </div>

                            <div className="config-flex-grid">
                                <div className="input-field flex-1">
                                    <label>Cotización Dólar (Venta)</label>
                                    <div className="price-input-wrapper">
                                        <span className="currency-prefix">$</span>
                                        <input
                                            type="number"
                                            className="highlight-input"
                                            value={config.cotizacionDolar}
                                            onChange={e => setConfig({ ...config, cotizacionDolar: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <p className="field-hint">Usado para deudas y remitos en USD.</p>
                                </div>

                                <div className="input-field flex-1">
                                    <label>IVA por defecto (%)</label>
                                    <div className="price-input-wrapper">
                                        <input
                                            type="number"
                                            className="highlight-input"
                                            value={config.porcentajeIvaDefault}
                                            onChange={e => setConfig({ ...config, porcentajeIvaDefault: parseFloat(e.target.value) })}
                                            placeholder="Ej: 21"
                                            onWheel={(e) => e.target.blur()}
                                        />
                                        <span className="currency-prefix" style={{ left: "auto", right: "14px" }}>%</span>
                                    </div>
                                    <p className="field-hint">IVA sugerido al registrar compras (ej: 21).</p>
                                </div>

                                <div className="input-field flex-1">
                                    <label>Umbral de Stock Crítico</label>
                                    <input
                                        type="number"
                                        value={config.stockMinimoGlobal}
                                        onChange={e => setConfig({ ...config, stockMinimoGlobal: parseInt(e.target.value) })}
                                    />
                                    <p className="field-hint">Nivel para disparar alarmas de reposición.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="home-footer">
                <p>© 2024 Sistema de Gestión Comercial • Módulo de Herramientas Avanzadas</p>
            </footer>

            <style>{`
                .config-main { background: #f8fafc; padding-top: 3rem; padding-bottom: 5rem; }
                .config-container { max-width: 1100px; margin: 0 auto; width: 100%; }
                
                .back-btn-header {
                    position: absolute;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .back-btn-header:hover { background: rgba(255, 255, 255, 0.2); }

                .config-header-actions { margin-bottom: 2.5rem; }
                .section-title { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0; }
                .section-subtitle { color: #64748b; margin: 4px 0 0; }

                .config-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
                .full-row { grid-column: 1 / -1; }
                
                .config-card {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02);
                    position: relative;
                }
                .card-top-accent { position: absolute; top: 0; left: 0; right: 0; height: 5px; }
                .card-top-accent.blue { background: #3b82f6; }
                .card-top-accent.emerald { background: #10b981; }
                .card-top-accent.orange { background: #f97316; }
                
                .card-inner-title { font-size: 1.1rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
                .util-description { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.5; }

                .icon-badge {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }
                .icon-badge.blue { background: #eff6ff; color: #3b82f6; }
                .icon-badge.emerald { background: #ecfdf5; color: #10b981; }
                .icon-badge.orange { background: #fff7ed; color: #f97316; }

                .card-form-grid { display: grid; gap: 1.25rem; }
                .config-flex-grid { display: flex; gap: 2rem; flex-wrap: wrap; }
                
                .input-field label { display: block; font-size: 0.85rem; font-weight: 600; color: #64748b; margin-bottom: 6px; }
                .input-field input, .select-field {
                    width: 100%;
                    padding: 12px 14px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    font-size: 0.95rem;
                    color: #1e293b;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .input-field input:focus, .select-field:focus { border-color: #3b82f6; background: white; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

                .btn-action-util {
                    width: 100%;
                    padding: 12px;
                    border-radius: 12px;
                    font-weight: 700;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-action-util.orange { background: #f97316; color: white; }
                .btn-action-util.orange:hover:not(:disabled) { background: #ea580c; transform: translateY(-1px); }
                .btn-action-util.blue { background: #3b82f6; color: white; }
                .btn-action-util.blue:hover { background: #2563eb; }
                .btn-action-util.outline { background: transparent; border: 2px solid #e2e8f0; color: #64748b; }
                .btn-action-util.outline:hover { background: #f1f5f9; border-color: #cbd5e1; color: #334155; }
                .btn-action-util:disabled { opacity: 0.5; cursor: not-allowed; }

                .divider { display: flex; align-items: center; text-align: center; color: #cbd5e1; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
                .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #f1f5f9; }
                .divider span { padding: 0 10px; }

                .premium-save-btn {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
                    transition: all 0.2s;
                }
                .premium-save-btn.small { padding: 8px 16px; font-size: 0.85rem; }
                .premium-save-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35); }

                .price-input-wrapper { position: relative; }
                .currency-prefix { position: absolute; left: 14px; top: 12px; font-weight: 700; color: #94a3b8; }
                .highlight-input { padding-left: 30px !important; font-size: 1.2rem !important; font-weight: 800 !important; color: #059669 !important; }
                
                .field-hint { font-size: 0.75rem; color: #94a3b8; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
                .field-hint.warning { color: #f97316; font-weight: 600; }

                @media (max-width: 900px) {
                    .config-grid { grid-template-columns: 1fr; }
                    .back-btn-header { right: 10px; padding: 6px 12px; font-size: 0.8rem; }
                }
                .mb-0 { margin-bottom: 0 !important; }
            `}</style>
        </div>
    );
}
