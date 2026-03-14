import React, { useEffect, useState } from "react";
import { FiCheck, FiClock, FiAlertCircle, FiSearch, FiFileText, FiFilter, FiTrendingUp } from "react-icons/fi";
import { formatDateLocal } from "../utils/dateUtils";
import { apiFetch } from "../utils/api";

const API_BASE = "/api/tesoreria";

export default function CarteraChequesSection() {
    const [cheques, setCheques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [checkFilter, setCheckFilter] = useState("all"); // "all", "cobrados", "listos", "urgentes"

    const fetchCheques = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`${API_BASE}`);
            const data = await res.json();
            // Filtrar solo medios de pago CHEQUE o CHEQUE_ELECTRONICO y que NO estén anulados
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

    // Helper functions para lógica de fechas
    const isReadyToCollect = (fechaCobro) => {
        if (!fechaCobro) return true;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const parts = fechaCobro.split('T')[0].split('-');
        const fecha = new Date(parts[0], parts[1] - 1, parts[2]);
        return fecha <= hoy;
    };

    const isExpiringSoon = (fechaVencimiento) => {
        if (!fechaVencimiento) return false;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const parts = fechaVencimiento.split('T')[0].split('-');
        const fecha = new Date(parts[0], parts[1] - 1, parts[2]);
        const diff = (fecha - hoy) / (1000 * 60 * 60 * 24);
        return diff <= 7; // Umbral de urgencia: 7 días o ya vencido
    };

    const handleCobrar = async (id) => {
        try {
            const res = await apiFetch(`${API_BASE}/${id}/cobrar`, { method: "PUT" });
            if (res.ok) fetchCheques();
        } catch (err) { alert("Error al marcar como cobrado"); }
    };

    const filtered = cheques.filter(c => {
        const term = searchTerm.toLowerCase().trim();
        // Si no hay búsqueda, dejamos pasar todo. Si hay, buscamos coincidencia en campos.
        const matchesSearch = term === "" ||
            (c.banco?.toLowerCase() || "").includes(term) ||
            (c.numeroCheque?.toLowerCase() || "").includes(term) ||
            (c.librador?.toLowerCase() || "").includes(term);

        let matchesCard = true;
        if (checkFilter === "cobrados") {
            matchesCard = c.cobrado;
        } else if (checkFilter === "listos") {
            matchesCard = !c.cobrado && isReadyToCollect(c.fechaCobro);
        } else if (checkFilter === "urgentes") {
            matchesCard = !c.cobrado && isExpiringSoon(c.fechaVencimiento);
        }

        return matchesSearch && matchesCard;
    });

    // Cálculos para las tarjetas
    const countCobrados = cheques.filter(c => c.cobrado).length;
    const countListos = cheques.filter(c => !c.cobrado && isReadyToCollect(c.fechaCobro)).length;
    const countUrgentes = cheques.filter(c => !c.cobrado && isExpiringSoon(c.fechaVencimiento)).length;

    return (
        <div className="cartera-cheques-section">

            {/* Panel de Estadísticas / Filtros */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div
                    className={`stat-card clickable ${checkFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCheckFilter('all')}
                >
                    <div className="stat-icon total"><FiFilter /></div>
                    <div className="stat-info">
                        <h3>{cheques.length}</h3>
                        <p>Total Cheques</p>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${checkFilter === 'cobrados' ? 'active' : ''}`}
                    onClick={() => setCheckFilter('cobrados')}
                >
                    <div className="stat-icon active"><FiCheck /></div>
                    <div className="stat-info">
                        <h3>{countCobrados}</h3>
                        <p>Cobrados</p>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${checkFilter === 'listos' ? 'active' : ''}`}
                    onClick={() => setCheckFilter('listos')}
                >
                    <div className="stat-icon stock" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FiTrendingUp /></div>
                    <div className="stat-info">
                        <h3>{countListos}</h3>
                        <p>Listos p/Cobrar</p>
                    </div>
                </div>
                <div
                    className={`stat-card clickable ${checkFilter === 'urgentes' ? 'active' : ''}`}
                    onClick={() => setCheckFilter('urgentes')}
                >
                    <div className="stat-icon out-of-stock"><FiAlertCircle /></div>
                    <div className="stat-info">
                        <h3>{countUrgentes}</h3>
                        <p>Urgentes (7d)</p>
                    </div>
                </div>
            </div>

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
                                const parts = c.fechaVencimiento?.split('T')[0].split('-');
                                const fVenc = parts ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
                                const vencido = fVenc && fVenc < new Date();
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <span className={`status-badge ${c.cobrado ? 'active' : vencido ? 'inactive' : 'warning'}`}>
                                                {c.cobrado ? 'Cobrado' : vencido ? 'Vencido' : 'En Cartera'}
                                            </span>
                                        </td>
                                        <td>{formatDateLocal(c.fechaVencimiento)}</td>
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
