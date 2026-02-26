import React, { useEffect, useState } from "react";
import { FiDollarSign, FiSearch, FiCheckCircle, FiClock, FiFileText, FiX } from "react-icons/fi";
import Toast from "./Toast";

const API_REMITOS = "http://localhost:8080/api/remitos";

export default function ValorizarSection({ onUpdate, initialRemito, onClose }) {
    const [remitos, setRemitos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(initialRemito || null);
    const [precios, setPrecios] = useState({});
    const [cotizacion, setCotizacion] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [currency, setCurrency] = useState("ARS");

    useEffect(() => {
        if (initialRemito) {
            const map = {};
            initialRemito.items.forEach(i => map[i.id] = "");
            setPrecios(map);
            setSelected(initialRemito);
        }
    }, [initialRemito]);

    const fetchPendientes = async () => {
        try {
            const res = await fetch(`${API_REMITOS}?estado=PENDIENTE`);
            setRemitos(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPendientes(); }, []);

    const handleValorizar = async () => {
        if (currency === "USD" && (!cotizacion || parseFloat(cotizacion) <= 0)) {
            alert("Debe ingresar una cotización válida para valorizar en dólares.");
            return;
        }

        setSaving(true);
        try {
            const tasa = currency === "USD" ? parseFloat(cotizacion) : 1;
            const body = {
                cotizacionDolar: cotizacion ? parseFloat(cotizacion) : null,
                precios: Object.fromEntries(
                    Object.entries(precios).map(([k, v]) => [k, parseFloat(v) * tasa])
                ),
            };
            const res = await fetch(`${API_REMITOS}/${selected.id}/valorizar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setToast({
                    title: "Remito valorizado",
                    message: `El remito #${selected.numero} ha sido valorizado con éxito.`,
                    type: "success"
                });
                setSelected(null);
                fetchPendientes();
                onUpdate();
            }
        } catch (e) {
            setToast({
                title: "Error",
                message: "No se pudo valorizar el remito.",
                type: "error"
            });
        }
        finally { setSaving(false); }
    };

    const calculateTotal = () => {
        if (!selected || !selected.items) return 0;
        return selected.items.reduce((acc, item) => {
            const precio = parseFloat(precios[item.id]) || 0;
            return acc + (precio * item.cantidad);
        }, 0);
    };

    const currentTotal = calculateTotal();
    const totalInArs = currency === "USD" ? currentTotal * (parseFloat(cotizacion) || 0) : currentTotal;

    if (initialRemito && selected) {
        return (
            <>
                <div className="modal-overlay" onClick={onClose}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <h2>Valorizar Remito #{selected.numero}</h2>
                            <button className="modal-close" onClick={onClose}><FiX /></button>
                        </div>
                        <div className="modal-content">
                            <div className="form-grid" style={{ gridTemplateColumns: currency === "USD" ? "1fr 1fr" : "1fr" }}>
                                <div className="form-group">
                                    <label className="form-label">Moneda de Valorización</label>
                                    <select
                                        className="modern-input"
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                    >
                                        <option value="ARS">Pesos (ARS)</option>
                                        <option value="USD">Dólares (USD)</option>
                                    </select>
                                </div>
                                {currency === "USD" && (
                                    <div className="form-group">
                                        <label className="form-label">Cotización Dólar</label>
                                        <input
                                            className="modern-input"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={cotizacion}
                                            onChange={e => setCotizacion(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: "1.5rem" }}>
                                <label className="form-label">Precios Unitarios ({currency})</label>
                                <div className="table-wrapper" style={{ border: "1px solid var(--border)", borderRadius: "8px", marginTop: "0.5rem" }}>
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cant.</th>
                                                <th>P. Unitario ({currency})</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selected.items.map(i => (
                                                <tr key={i.id}>
                                                    <td>
                                                        <div className="product-info">
                                                            <h4>{i.productoNombre || i.producto?.nombre}</h4>
                                                            <p>ID: {i.id}</p>
                                                        </div>
                                                    </td>
                                                    <td><span className="stock-badge in-stock">{i.cantidad}</span></td>
                                                    <td>
                                                        <div style={{ position: "relative" }}>
                                                            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>{currency === "ARS" ? "$" : "u$d"}</span>
                                                            <input
                                                                className="modern-input"
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                style={{ paddingLeft: currency === "ARS" ? "25px" : "40px" }}
                                                                value={precios[i.id]}
                                                                onChange={e => setPrecios({ ...precios, [i.id]: e.target.value })}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="total-calculator" style={{
                                marginTop: "1.5rem",
                                padding: "1.2rem",
                                background: "var(--success-bg, #e8f5e9)",
                                borderRadius: "12px",
                                border: "1px solid var(--success-border, #c8e6c9)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ color: "var(--success, #2e7d32)", fontSize: "0.9rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Total a Valorizar ({currency})
                                    </div>
                                    <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "#1b5e20", fontFamily: "monospace" }}>
                                        {currency === "ARS" ? "$" : "u$s"} {currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                {currency === "USD" && (
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderTop: "1px dashed #c8e6c9",
                                        paddingTop: "8px",
                                        marginTop: "4px"
                                    }}>
                                        <div style={{ color: "#388e3c", fontSize: "0.85rem", fontStyle: "italic" }}>Equivalente en Pesos (ARS)</div>
                                        <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#2e7d32" }}>
                                            $ {totalInArs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                            <button className="btn-primary" onClick={handleValorizar} disabled={saving} style={{ backgroundColor: "var(--success)" }}>
                                {saving ? "Valorizando..." : <><FiCheckCircle /> Confirmar Valorización</>}
                            </button>
                        </div>
                    </div>
                </div>
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
            </>
        );
    }

    return (
        <div className="valorizar-section">
            <div className="table-container">
                {remitos.length === 0 ? (
                    <div className="empty-state">
                        <FiCheckCircle size={40} />
                        <h3>Todo valorizado</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Nº Remito</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remitos.map(r => (
                                <tr key={r.id}>
                                    <td className="sku-cell"><span className="sku-badge">#{r.numero}</span></td>
                                    <td>{new Date(r.fecha).toLocaleDateString()}</td>
                                    <td>{r.clienteNombre}</td>
                                    <td>
                                        <button className="btn-primary" style={{ backgroundColor: "var(--success)" }} onClick={() => {
                                            setSelected(r);
                                            setCurrency("ARS"); // Reset a pesos al elegir uno nuevo
                                            const map = {};
                                            r.items.forEach(i => map[i.id] = "");
                                            setPrecios(map);
                                        }}>
                                            <FiDollarSign /> Valorizar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selected && !initialRemito && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <h2>Valorizar Remito #{selected.numero}</h2>
                            <button className="modal-close" onClick={() => setSelected(null)}><FiX /></button>
                        </div>
                        <div className="modal-content">
                            <div className="form-grid" style={{ gridTemplateColumns: currency === "USD" ? "1fr 1fr" : "1fr" }}>
                                <div className="form-group">
                                    <label className="form-label">Moneda de Valorización</label>
                                    <select
                                        className="modern-input"
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                    >
                                        <option value="ARS">Pesos (ARS)</option>
                                        <option value="USD">Dólares (USD)</option>
                                    </select>
                                </div>
                                {currency === "USD" && (
                                    <div className="form-group">
                                        <label className="form-label">Cotización Dólar</label>
                                        <input
                                            className="modern-input"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={cotizacion}
                                            onChange={e => setCotizacion(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: "1.5rem" }}>
                                <label className="form-label">Precios Unitarios ({currency})</label>
                                <div className="table-wrapper" style={{ border: "1px solid var(--border)", borderRadius: "8px", marginTop: "0.5rem" }}>
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cant.</th>
                                                <th>P. Unitario ({currency})</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selected.items.map(i => (
                                                <tr key={i.id}>
                                                    <td>
                                                        <div className="product-info">
                                                            <h4>{i.productoNombre || i.producto?.nombre}</h4>
                                                            <p>ID: {i.id}</p>
                                                        </div>
                                                    </td>
                                                    <td><span className="stock-badge in-stock">{i.cantidad}</span></td>
                                                    <td>
                                                        <div style={{ position: "relative" }}>
                                                            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>{currency === "ARS" ? "$" : "u$d"}</span>
                                                            <input
                                                                className="modern-input"
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                style={{ paddingLeft: currency === "ARS" ? "25px" : "40px" }}
                                                                value={precios[i.id]}
                                                                onChange={e => setPrecios({ ...precios, [i.id]: e.target.value })}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="total-calculator" style={{
                                marginTop: "1.5rem",
                                padding: "1.2rem",
                                background: "var(--success-bg, #e8f5e9)",
                                borderRadius: "12px",
                                border: "1px solid var(--success-border, #c8e6c9)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ color: "var(--success, #2e7d32)", fontSize: "0.9rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Total a Valorizar ({currency})
                                    </div>
                                    <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "#1b5e20", fontFamily: "monospace" }}>
                                        {currency === "ARS" ? "$" : "u$s"} {currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                {currency === "USD" && (
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderTop: "1px dashed #c8e6c9",
                                        paddingTop: "8px",
                                        marginTop: "4px"
                                    }}>
                                        <div style={{ color: "#388e3c", fontSize: "0.85rem", fontStyle: "italic" }}>Equivalente en Pesos (ARS)</div>
                                        <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#2e7d32" }}>
                                            $ {totalInArs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setSelected(null)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleValorizar} disabled={saving} style={{ backgroundColor: "var(--success)" }}>
                                {saving ? "Valorizando..." : <><FiCheckCircle /> Confirmar Valorización</>}
                            </button>
                        </div>
                    </div>
                </div>
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
