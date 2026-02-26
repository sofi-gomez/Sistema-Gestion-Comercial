import React, { useEffect, useState } from "react";
import { FiCheck, FiClock, FiAlertCircle, FiSearch, FiFileText } from "react-icons/fi";

const API_BASE = "http://localhost:8080/api/tesoreria";

export default function CarteraChequesSection() {
    const [cheques, setCheques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchCheques = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}`);
            const data = await res.json();
            // Filtrar solo medios de pago CHEQUE o CHEQUE_ELECTRONICO
            const filtrados = (data || []).filter(m =>
                (m.medioPago === 'CHEQUE' || m.medioPago === 'CHEQUE_ELECTRONICO') && !m.anulado
            );
            setCheques(filtrados);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCheques(); }, []);

    const handleCobrar = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/${id}/cobrar`, { method: "PUT" });
            if (res.ok) fetchCheques();
        } catch (err) { alert("Error al marcar como cobrado"); }
    };

    const filtered = cheques.filter(c =>
        c.banco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.numeroCheque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.librador?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="cartera-cheques-section">
            <div className="filters-bar" style={{ marginBottom: "1.5rem" }}>
                <div className="search-box" style={{ maxWidth: "400px" }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por banco, Nº o librador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="table-container">
                {cheques.length === 0 && !loading ? (
                    <div className="empty-state">
                        <FiFileText size={40} />
                        <h3>No hay cheques en cartera</h3>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Vencimiento</th>
                                <th>Banco</th>
                                <th>Nº Cheque</th>
                                <th>Importe</th>
                                <th>Librador</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => {
                                const vencido = c.fechaVencimiento && new Date(c.fechaVencimiento) < new Date();
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <span className={`status-badge ${c.cobrado ? 'active' : vencido ? 'inactive' : 'warning'}`}>
                                                {c.cobrado ? 'Cobrado' : vencido ? 'Vencido' : 'En Cartera'}
                                            </span>
                                        </td>
                                        <td>{c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString() : '-'}</td>
                                        <td>{c.banco || '-'}</td>
                                        <td className="sku-cell"><span className="sku-badge">#{c.numeroCheque || '-'}</span></td>
                                        <td className="price-cell" style={{ fontWeight: 'bold' }}>${c.importe?.toLocaleString()}</td>
                                        <td>{c.librador || '-'}</td>
                                        <td>
                                            {!c.cobrado && (
                                                <button onClick={() => handleCobrar(c.id)} className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                                                    <FiCheck /> Cobrar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
