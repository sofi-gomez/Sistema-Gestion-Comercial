import React, { useEffect, useState } from "react";
import { FiDollarSign, FiCheckCircle, FiX, FiAlertTriangle } from "react-icons/fi";
import Toast from "./Toast";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_REMITOS = "/api/remitos";

export default function ValorizarSection({ onUpdate, initialRemito, onClose }) {
    const [remitos, setRemitos] = useState([]);
    const [selected, setSelected] = useState(initialRemito || null);
    const [precios, setPrecios] = useState({});
    const [cotizacion, setCotizacion] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [currency, setCurrency] = useState("ARS");

    // Helper para convertir strings con comas a números válidos
    const parseSafeFloat = (val) => {
        if (val === undefined || val === null || val === "") return 0;
        const stringVal = val.toString().replace(/\./g, "").replace(",", ".");
        const parsed = parseFloat(stringVal);
        return isNaN(parsed) ? 0 : parsed;
    };

    const getSuggestedPrice = (item, cur) => {
        if (cur === "USD") return item.producto?.precioVentaUSD?.toString() || "";
        return item.producto?.precioVenta?.toString() || "";
    };

    const getInitialPrices = (items, cur) => {
        const map = {};
        items.forEach(i => {
            // Si el remito ya estaba valorizado y estamos en ARS, mantenemos los precios actuales
            if (i.precioUnitario && cur === "ARS") {
                map[i.id] = i.precioUnitario.toString().replace(".", ",");
            } else {
                map[i.id] = getSuggestedPrice(i, cur).replace(".", ",");
            }
        });
        return map;
    };

    // Efecto para manejar el remito inicial (edición/re-valorización)
    useEffect(() => {
        if (initialRemito) {
            const isUsd = initialRemito.cotizacionDolar && initialRemito.cotizacionDolar > 0;
            if (isUsd) {
                setCurrency("USD");
                setCotizacion(initialRemito.cotizacionDolar.toString().replace(".", ","));
                
                const map = {};
                initialRemito.items.forEach(item => {
                    const priceArs = item.precioUnitario || 0;
                    const priceUsd = priceArs / initialRemito.cotizacionDolar;
                    map[item.id] = priceUsd.toFixed(2).replace(".", ",");
                });
                setPrecios(map);
            } else {
                setCurrency("ARS");
                setPrecios(getInitialPrices(initialRemito.items, "ARS"));
            }
            setSelected(initialRemito);
        }
    }, [initialRemito]);

    // Cargar remitos pendientes para la lista
    const fetchPendientes = async () => {
        try {
            const res = await apiFetch(`${API_REMITOS}?estado=PENDIENTE`);
            if (res.ok) setRemitos(await res.json());
        } catch (e) { console.error("Error cargando pendientes:", e); }
    };

    useEffect(() => {
        if (!initialRemito) fetchPendientes();
    }, [initialRemito]);

    const handleValorizar = async () => {
        const cotizacionNum = parseSafeFloat(cotizacion);
        if (currency === "USD" && cotizacionNum <= 0) {
            alert("Debe ingresar una cotización válida para valorizar en dólares.");
            return;
        }

        if (!selected || !selected.items || selected.items.length === 0) {
            alert("El remito no tiene ítems.");
            return;
        }

        const preciosFinales = {};
        let tienePrecioInvalido = false;

        selected.items.forEach(i => {
            const p = parseSafeFloat(precios[i.id]);
            if (p <= 0) tienePrecioInvalido = true;
            preciosFinales[i.id] = p * (currency === "USD" ? cotizacionNum : 1);
        });

        if (tienePrecioInvalido) {
            alert("Todos los precios unitarios deben ser mayores a 0 para poder valorizar.");
            return;
        }

        setSaving(true);
        try {
            const body = {
                cotizacionDolar: currency === "USD" ? cotizacionNum : null,
                precios: preciosFinales
            };

            const res = await apiFetch(`${API_REMITOS}/${selected.id}/valorizar`, {
                method: "POST",
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                setToast({
                    title: "Éxito",
                    message: `Remito #${selected.numero} valorizado correctamente.`,
                    type: "success"
                });
                if (initialRemito) {
                    setTimeout(() => onUpdate(data), 1500);
                } else {
                    setSelected(null);
                    fetchPendientes();
                    onUpdate(data);
                }
            } else {
                throw new Error("Fallo en el servidor");
            }
        } catch (e) {
            setToast({
                title: "Error",
                message: "No se pudo guardar la valorización. Revisa los datos.",
                type: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    const calculateTotal = () => {
        if (!selected || !selected.items) return 0;
        return selected.items.reduce((acc, item) => {
            const precio = parseSafeFloat(precios[item.id]);
            return acc + (precio * item.cantidad);
        }, 0);
    };

    const currentTotal = calculateTotal();
    const cotizacionValue = parseSafeFloat(cotizacion);
    const totalInArs = currency === "USD" ? currentTotal * cotizacionValue : currentTotal;

    const renderModal = () => {
        if (!selected) return null;

        const isReValorizar = selected.estado === "VALORIZADO" || selected.estado === "COBRADO";

        return (
            <div className="modal-overlay" onClick={() => initialRemito ? onClose() : setSelected(null)}>
                <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "750px" }}>
                    <div className="modal-header">
                        <h2>{isReValorizar ? "Re-valorizar" : "Valorizar"} Remito #{selected.numero}</h2>
                        <button className="modal-close" onClick={() => initialRemito ? onClose() : setSelected(null)}><FiX /></button>
                    </div>
                    
                    <div className="modal-content">
                        {selected.estado === "COBRADO" && (
                            <div className="alert-banner" style={{ 
                                backgroundColor: "#fff3cd", 
                                color: "#856404", 
                                padding: "12px", 
                                borderRadius: "8px", 
                                marginBottom: "1rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "1px solid #ffeeba"
                            }}>
                                <FiAlertTriangle />
                                <span><strong>Atención:</strong> Este remito ya está cobrado. Al re-valorizarlo, su estado volverá a "VALORIZADO".</span>
                            </div>
                        )}

                        <div className="form-grid" style={{ gridTemplateColumns: currency === "USD" ? "1fr 1fr" : "1fr" }}>
                            <div className="form-group">
                                <label className="form-label">Moneda</label>
                                <select 
                                    className="modern-input" 
                                    value={currency}
                                    onChange={e => {
                                        const cur = e.target.value;
                                        setCurrency(cur);
                                        setPrecios(getInitialPrices(selected.items, cur));
                                    }}
                                >
                                    <option value="ARS">Pesos (ARS)</option>
                                    <option value="USD">Dólares (USD)</option>
                                </select>
                            </div>
                            {currency === "USD" && (
                                <div className="form-group">
                                    <label className="form-label">Cotización</label>
                                    <input 
                                        className="modern-input"
                                        type="text"
                                        placeholder="0,00"
                                        value={cotizacion}
                                        onChange={e => setCotizacion(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="table-wrapper" style={{ marginTop: "1.5rem", border: "1px solid var(--border)", borderRadius: "8px" }}>
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th style={{ textAlign: "center" }}>Cant.</th>
                                        <th>Precio Unit. ({currency})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selected.items.map(i => (
                                        <tr key={i.id}>
                                            <td>
                                                <div className="product-info">
                                                    <strong>{i.productoNombre || i.producto?.nombre}</strong>
                                                    <small style={{ display: "block", color: "var(--muted)" }}>ID: {i.id}</small>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <span className="stock-badge in-stock">{i.cantidad}</span>
                                            </td>
                                            <td>
                                                <div style={{ position: "relative" }}>
                                                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
                                                        {currency === "ARS" ? "$" : "u$s"}
                                                    </span>
                                                    <input 
                                                        className="modern-input"
                                                        type="text"
                                                        style={{ paddingLeft: "35px" }}
                                                        value={precios[i.id] || ""}
                                                        onChange={e => setPrecios({ ...precios, [i.id]: e.target.value })}
                                                    />
                                                    {(() => {
                                                        const sug = getSuggestedPrice(i, currency);
                                                        if (!sug) return null;
                                                        return (
                                                            <div style={{ fontSize: "0.7rem", marginTop: "2px", display: "flex", justifyContent: "space-between" }}>
                                                                <span>Catálogo: {sug}</span>
                                                                <button 
                                                                    className="text-link" 
                                                                    onClick={() => setPrecios({ ...precios, [i.id]: sug.replace(".", ",") })}
                                                                    style={{ color: "var(--primary)", border: "none", background: "none", cursor: "pointer", fontSize: "0.7rem" }}
                                                                >Usar sugerencia</button>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="total-calculator" style={{ 
                            marginTop: "1.5rem", 
                            padding: "1rem", 
                            background: "#f8f9fa", 
                            borderRadius: "10px",
                            border: "1px solid #dee2e6"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: "600" }}>TOTAL ({currency}):</span>
                                <span style={{ fontSize: "1.4rem", fontWeight: "BOLD" }}>
                                    {currency === "ARS" ? "$" : "u$s"} {currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            {currency === "USD" && (
                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #ccc", marginTop: "8px", paddingTop: "8px" }}>
                                    <small>Total en Pesos:</small>
                                    <strong style={{ color: "var(--success)" }}>
                                        $ {totalInArs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </strong>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => initialRemito ? onClose() : setSelected(null)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleValorizar} disabled={saving} style={{ backgroundColor: "var(--success)" }}>
                            {saving ? "Guardando..." : "Confirmar Valorización"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (initialRemito) return <>{renderModal()}{toast && <Toast {...toast} onClose={() => setToast(null)} />}</>;

    return (
        <div className="valorizar-section">
            <div className="table-container">
                {remitos.length === 0 ? (
                    <div className="empty-state">
                        <FiCheckCircle size={40} color="var(--success)" />
                        <h3>Sin remitos pendientes</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th># Remito</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remitos.map(r => (
                                <tr key={r.id}>
                                    <td><strong>#{r.numero}</strong></td>
                                    <td>{formatDateLocal(r.fecha)}</td>
                                    <td>{r.clienteNombre}</td>
                                    <td>
                                        <button className="btn-primary" style={{ backgroundColor: "var(--success)" }} onClick={() => {
                                            setSelected(r);
                                            setCurrency("ARS");
                                            setPrecios(getInitialPrices(r.items, "ARS"));
                                        }}><FiDollarSign /> Valorizar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {renderModal()}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}
