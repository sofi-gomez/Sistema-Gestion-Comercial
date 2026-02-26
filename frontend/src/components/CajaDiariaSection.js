import React, { useEffect, useState } from "react";
import { FiPlus, FiDollarSign, FiSearch, FiTrendingUp, FiTrendingDown, FiEdit2 } from "react-icons/fi";
import MovimientoFormModal from "../components/MovimientoFormModal";

const API_BASE = "http://localhost:8080/api/tesoreria";

export default function CajaDiariaSection() {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [movimientoEditar, setMovimientoEditar] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAll = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}`);
            const data = await res.json();
            setMovimientos(data || []);
        } catch (err) {
            console.error(err);
            setMovimientos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSaved = () => { setModalOpen(false); setMovimientoEditar(null); fetchAll(); };

    const filtered = movimientos.filter(m =>
        m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const ingresos = movimientos.filter(m => !m.anulado && m.tipo?.toUpperCase() === 'INGRESO').reduce((acc, m) => acc + Number(m.importe || 0), 0);
    const egresos = movimientos.filter(m => !m.anulado && m.tipo?.toUpperCase() === 'EGRESO').reduce((acc, m) => acc + Number(m.importe || 0), 0);
    const saldo = ingresos - egresos;

    return (
        <div className="caja-diaria-section">
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon total"><FiTrendingUp /></div>
                    <div className="stat-info">
                        <h3>${ingresos.toLocaleString()}</h3>
                        <p>Ingresos</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon active"><FiTrendingDown /></div>
                    <div className="stat-info">
                        <h3>${egresos.toLocaleString()}</h3>
                        <p>Egresos</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stock"><FiDollarSign /></div>
                    <div className="stat-info">
                        <h3>${saldo.toLocaleString()}</h3>
                        <p>Saldo Actual</p>
                    </div>
                </div>
            </div>

            <div className="filters-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div className="search-box" style={{ flex: 1, maxWidth: "400px" }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar movimientos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <button onClick={() => { setMovimientoEditar(null); setModalOpen(true); }} className="btn-primary">
                    <FiPlus /> Nuevo Movimiento
                </button>
            </div>

            <div className="table-container">
                {loading ? <div className="loading-spinner" /> : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Medio</th>
                                <th>Importe</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(m => (
                                <tr key={m.id} style={m.anulado ? { opacity: 0.6, textDecoration: 'line-through' } : {}}>
                                    <td>{new Date(m.fecha || m.createdAt).toLocaleDateString()}</td>
                                    <td><span className={`status-badge ${m.tipo?.toUpperCase() === 'INGRESO' ? 'active' : 'inactive'}`}>{m.tipo}</span></td>
                                    <td>{m.medioPago?.replace(/_/g, ' ')}</td>
                                    <td className={m.tipo?.toUpperCase() === 'INGRESO' ? 'highlight' : 'danger'}>${m.importe.toLocaleString()}</td>
                                    <td>{m.descripcion}</td>
                                    <td>{!m.anulado && <button onClick={() => { setMovimientoEditar(m); setModalOpen(true); }} className="icon-btn edit"><FiEdit2 /></button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modalOpen && <MovimientoFormModal onClose={() => setModalOpen(false)} onSaved={handleSaved} movimientoEditar={movimientoEditar} />}
        </div>
    );
}
