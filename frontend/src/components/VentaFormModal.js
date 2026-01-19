import React, { useEffect, useState, useRef } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import CamposCheque from "./CamposCheque";
import "../index.css";

export default function VentaFormModal({ onClose, onSaved, ventaEditar }) {
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [medioPago, setMedioPago] = useState("EFECTIVO");

    // Campos de la venta
    const [nombreCliente, setNombreCliente] = useState("");
    const [descripcion, setDescripcion] = useState("");

    // Estados para autocompletado de clientes
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const clienteInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Estados para datos del cheque
    const [banco, setBanco] = useState("");
    const [numeroCheque, setNumeroCheque] = useState("");
    const [librador, setLibrador] = useState("");
    const [fechaEmision, setFechaEmision] = useState("");
    const [fechaCobro, setFechaCobro] = useState("");

    const API_PRODUCTOS = "http://localhost:8080/api/productos";
    const API_CLIENTES = "http://localhost:8080/api/clientes";
    const API_VENTAS = "http://localhost:8080/api/ventas";

    useEffect(() => {
        const load = async () => {
            try {
                const [productosRes, clientesRes] = await Promise.all([
                    fetch(API_PRODUCTOS),
                    fetch(API_CLIENTES)
                ]);
                const productosJson = await productosRes.json();
                const clientesJson = await clientesRes.json();
                setProductos(productosJson || []);
                setClientes(clientesJson || []);
            } catch (err) {
                console.error("Error cargando datos:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                clienteInputRef.current && !clienteInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
        if (items.length === 0 && productos.length > 0 && !ventaEditar) {
            addEmptyItem();
        }
    }, [productos.length]);

    // Manejar cambio en el input de cliente con autocompletado
    const handleClienteChange = (e) => {
        const value = e.target.value;
        setNombreCliente(value);

        if (value.trim().length > 0) {
            const filtered = clientes.filter(cliente =>
                cliente.nombre?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredClientes(filtered);
            setShowSuggestions(true);
            setSelectedIndex(-1);
        } else {
            setShowSuggestions(false);
            setFilteredClientes([]);
        }
    };

    // Seleccionar cliente de la lista
    const handleSelectCliente = (cliente) => {
        setNombreCliente(cliente.nombre);
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    // Navegación con teclado en sugerencias
    const handleClienteKeyDown = (e) => {
        if (!showSuggestions || filteredClientes.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < filteredClientes.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            handleSelectCliente(filteredClientes[selectedIndex]);
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

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
                        <p>Cargando datos...</p>
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
                        {/* Campo de cliente con autocompletado */}
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label">Nombre del Cliente *</label>
                            <input
                                ref={clienteInputRef}
                                value={nombreCliente}
                                onChange={handleClienteChange}
                                onKeyDown={handleClienteKeyDown}
                                onFocus={() => {
                                    if (nombreCliente.trim().length > 0 && filteredClientes.length > 0) {
                                        setShowSuggestions(true);
                                    }
                                }}
                                className="modern-input"
                                placeholder="Buscar o escribir nombre del cliente..."
                                autoComplete="off"
                                required
                            />

                            {/* Sugerencias de clientes */}
                            {showSuggestions && filteredClientes.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        backgroundColor: "white",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        marginTop: "4px",
                                        maxHeight: "200px",
                                        overflowY: "auto",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                        zIndex: 1000,
                                    }}
                                >
                                    {filteredClientes.map((cliente, index) => (
                                        <div
                                            key={cliente.id}
                                            onClick={() => handleSelectCliente(cliente)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            style={{
                                                padding: "10px 12px",
                                                cursor: "pointer",
                                                backgroundColor: index === selectedIndex ? "#f3f4f6" : "white",
                                                borderBottom: index < filteredClientes.length - 1 ? "1px solid #f3f4f6" : "none",
                                                transition: "background-color 0.15s",
                                            }}
                                        >
                                            <div style={{ fontWeight: "500", color: "#111827" }}>
                                                {cliente.nombre}
                                            </div>
                                            {cliente.telefono && (
                                                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                                                    {cliente.telefono}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Mensaje cuando no hay coincidencias */}
                            {showSuggestions && nombreCliente.trim().length > 0 && filteredClientes.length === 0 && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        backgroundColor: "white",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        marginTop: "4px",
                                        padding: "10px 12px",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                        zIndex: 1000,
                                        color: "#6b7280",
                                        fontSize: "0.875rem",
                                    }}
                                >
                                    Cliente nuevo - se registrará con este nombre
                                </div>
                            )}
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