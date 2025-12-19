import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import CamposCheque from "./CamposCheque";
import "../index.css";

export default function VentaFormModal({ onClose, onSaved, ventaEditar }) {
    const [productos, setProductos] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [medioPago, setMedioPago] = useState("EFECTIVO");

    // Campos de la venta
    const [nombreCliente, setNombreCliente] = useState("");
    const [descripcion, setDescripcion] = useState("");

    // Estados para datos del cheque
    const [banco, setBanco] = useState("");
    const [numeroCheque, setNumeroCheque] = useState("");
    const [librador, setLibrador] = useState("");
    const [fechaEmision, setFechaEmision] = useState("");
    const [fechaCobro, setFechaCobro] = useState("");

    const API_PRODUCTOS = "http://localhost:8080/api/productos";
    const API_VENTAS = "http://localhost:8080/api/ventas";

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch(API_PRODUCTOS);
                const productosJson = await response.json();
                setProductos(productosJson || []);
            } catch (err) {
                console.error("Error cargando productos:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Cargar datos de la venta si estamos editando
    useEffect(() => {
        if (ventaEditar) {
            setNombreCliente(ventaEditar.nombreCliente || ventaEditar.nombre_cliente || "");
            setDescripcion(ventaEditar.descripcion || "");
            setMedioPago(ventaEditar.medioPago || ventaEditar.medio_pago || "EFECTIVO");

            // Cargar datos del cheque si existen
            setBanco(ventaEditar.chequeBanco || ventaEditar.cheque_banco || "");
            setNumeroCheque(ventaEditar.chequeNumero || ventaEditar.cheque_numero || "");
            setLibrador(ventaEditar.chequeLibrador || ventaEditar.cheque_librador || "");
            setFechaEmision(ventaEditar.chequeFechaEmision || ventaEditar.cheque_fecha_emision || "");
            setFechaCobro(ventaEditar.chequeFechaCobro || ventaEditar.cheque_fecha_cobro || "");

            // Cargar items
            if (ventaEditar.items && ventaEditar.items.length > 0) {
                const itemsFormateados = ventaEditar.items.map(item => ({
                    productoId: item.producto?.id || item.producto_id || "",
                    cantidad: item.cantidad || 0,
                    precioUnitario: item.precioUnitario || item.precio_unitario || 0,
                    subtotal: item.subtotal || 0
                }));
                setItems(itemsFormateados);
            }
        }
    }, [ventaEditar]);

    useEffect(() => {
        if (items.length === 0) addEmptyItem();
    }, [productos]);

    const addEmptyItem = () => {
        setItems((s) => [...s, { productoId: "", cantidad: 1, precioUnitario: 0, subtotal: 0 }]);
    };

    const removeItem = (idx) => setItems((s) => s.filter((_, i) => i !== idx));

    const updateItem = (idx, newVals) => {
        setItems((s) => {
            const copy = [...s];
            copy[idx] = { ...copy[idx], ...newVals };
            const cantidad = Number(copy[idx].cantidad || 0);
            const precioUnitario = Number(copy[idx].precioUnitario || 0);
            copy[idx].subtotal = +(cantidad * precioUnitario).toFixed(2);
            return copy;
        });
    };

    const calcularTotal = () => items.reduce((acc, it) => acc + Number(it.subtotal || 0), 0).toFixed(2);

    const handleProductoChange = (idx, productoId) => {
        const prod = productos.find((p) => String(p.id) === String(productoId));
        if (!prod) {
            updateItem(idx, { productoId: "", precioUnitario: 0 });
            return;
        }
        const precio = prod.precioVenta !== undefined && prod.precioVenta !== null ? prod.precioVenta : prod.precio_venta;
        updateItem(idx, { productoId: prod.id, precioUnitario: Number(precio) || 0 });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar nombre del cliente
        if (!nombreCliente.trim()) {
            return alert("El nombre del cliente es requerido");
        }

        // Validar items
        if (items.length === 0) return alert("Agregue al menos un item.");
        for (const it of items) {
            if (!it.productoId) return alert("Complete todos los productos.");
            if (!it.cantidad || Number(it.cantidad) <= 0) return alert("Cantidad inválida en un item.");
        }

        // Validar datos de cheque si corresponde
        const esCheque = medioPago === "CHEQUE" || medioPago === "CHEQUE_ELECTRONICO";
        if (esCheque) {
            if (!banco || !numeroCheque || !librador || !fechaEmision || !fechaCobro) {
                return alert("Complete todos los datos del cheque");
            }
        }

        // Preparar payload
        const payload = {
            nombreCliente: nombreCliente.trim(),
            descripcion: descripcion.trim() || null,
            items: items.map((it) => ({
                producto: { id: it.productoId },
                cantidad: Number(it.cantidad),
                precioUnitario: Number(it.precioUnitario),
                subtotal: Number(it.subtotal)
            })),
            total: Number(calcularTotal()),
            estado: "COMPLETA",
            medioPago: medioPago,
            // Agregar datos de cheque si corresponde
            ...(esCheque && {
                chequeBanco: banco,
                chequeNumero: numeroCheque,
                chequeLibrador: librador,
                chequeFechaEmision: fechaEmision,
                chequeFechaCobro: fechaCobro
            })
        };

        try {
            const url = ventaEditar ? `${API_VENTAS}/${ventaEditar.id}` : API_VENTAS;
            const method = ventaEditar ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Error al registrar la venta");
            }
            onSaved && onSaved();
        } catch (err) {
            console.error("Error guardando venta:", err);
            alert("No se pudo registrar la venta: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-card">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Cargando productos...</p>
                    </div>
                </div>
            </div>
        );
    }

    const esCheque = medioPago === "CHEQUE" || medioPago === "CHEQUE_ELECTRONICO";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1000 }}>
                <div className="modal-header">
                    <h2>{ventaEditar ? "Editar Venta" : "Registrar Nueva Venta"}</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        {/* Datos del cliente */}
                        <div className="form-group">
                            <label className="form-label">Nombre del Cliente *</label>
                            <input
                                value={nombreCliente}
                                onChange={(e) => setNombreCliente(e.target.value)}
                                className="modern-input"
                                placeholder="Nombre del cliente"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <textarea
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                className="modern-textarea"
                                placeholder="Descripción o notas de la venta (opcional)"
                                rows="2"
                            />
                        </div>

                        {/* Selector de medio de pago */}
                        <div className="form-group">
                            <label className="form-label">Medio de Pago</label>
                            <select
                                value={medioPago}
                                onChange={(e) => setMedioPago(e.target.value)}
                                className="modern-input"
                            >
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                                <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                                <option value="MERCADO_PAGO">Mercado Pago</option>
                                <option value="CHEQUE">Cheque</option>
                                <option value="CHEQUE_ELECTRONICO">Cheque Electrónico</option>
                            </select>
                        </div>

                        {/* Componente reutilizable de campos de cheque */}
                        <CamposCheque
                            mostrar={esCheque}
                            banco={banco}
                            setBanco={setBanco}
                            numeroCheque={numeroCheque}
                            setNumeroCheque={setNumeroCheque}
                            librador={librador}
                            setLibrador={setLibrador}
                            fechaEmision={fechaEmision}
                            setFechaEmision={setFechaEmision}
                            fechaCobro={fechaCobro}
                            setFechaCobro={setFechaCobro}
                        />

                        {/* Items de la venta */}
                        <div className="form-group full-width">
                            <div className="items-header">
                                <label className="form-label">Productos Vendidos</label>
                                <button type="button" onClick={addEmptyItem} className="btn-primary small">
                                    <FiPlus />
                                    Agregar Producto
                                </button>
                            </div>

                            <div className="items-container">
                                {items.map((it, idx) => (
                                    <div key={idx} className="item-row">
                                        <div className="item-producto">
                                            <select
                                                className="modern-input"
                                                value={it.productoId}
                                                onChange={(e) => handleProductoChange(idx, e.target.value)}
                                                required
                                            >
                                                <option value="">-- Seleccione producto --</option>
                                                {productos.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nombre} {p.sku ? `(${p.sku})` : ""} - Stock: {p.stock}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="item-cantidad">
                                            <input
                                                className="modern-input"
                                                type="number"
                                                step="0.001"
                                                min="0.001"
                                                value={it.cantidad}
                                                onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
                                                placeholder="Cantidad"
                                                required
                                            />
                                        </div>

                                        <div className="item-precio">
                                            <input
                                                className="modern-input"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={it.precioUnitario}
                                                onChange={(e) => updateItem(idx, { precioUnitario: e.target.value })}
                                                placeholder="Precio"
                                                required
                                            />
                                        </div>

                                        <div className="item-subtotal">
                                            <input
                                                className="modern-input"
                                                disabled
                                                value={`$${it.subtotal || 0}`}
                                            />
                                        </div>

                                        <div className="item-actions">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="icon-btn delete"
                                                disabled={items.length === 1}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="total-section">
                            <div className="total-amount">
                                <span className="total-label">Total de la Venta:</span>
                                <span className="total-value">${calcularTotal()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            {ventaEditar ? "Actualizar Venta" : "Registrar Venta"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}