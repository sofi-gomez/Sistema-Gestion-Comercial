import React, { useState } from "react";
import { FiDollarSign, FiCreditCard, FiActivity } from "react-icons/fi";
import CajaDiariaSection from "../components/CajaDiariaSection";
import CarteraChequesSection from "../components/CarteraChequesSection";
import "../index.css";

export default function TesoreriaPage() {
    const [activeTab, setActiveTab] = useState("caja");

    return (
        <div className="mercaderia-container">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-title">
                        <div className="title-icon"><FiDollarSign /></div>
                        <div>
                            <h1>Gestión de Tesorería</h1>
                            <p>Control de movimientos de caja y cartera de cheques</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs de Navegación Interna */}
            <div className="tabs-container" style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "10px"
            }}>
                <button
                    className={`tab-btn ${activeTab === "caja" ? "active" : ""}`}
                    onClick={() => setActiveTab("caja")}
                >
                    <FiActivity /> Caja Diaria
                </button>
                <button
                    className={`tab-btn ${activeTab === "cheques" ? "active" : ""}`}
                    onClick={() => setActiveTab("cheques")}
                >
                    <FiCreditCard /> Cartera de Cheques
                </button>
            </div>

            <div className="tab-content">
                {activeTab === "caja" && <CajaDiariaSection />}
                {activeTab === "cheques" && <CarteraChequesSection />}
            </div>

            <style>{`
                .tab-btn {
                    padding: 10px 16px;
                    border: none;
                    background: transparent;
                    color: var(--muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .tab-btn:hover { background: var(--bg); color: var(--text); }
                .tab-btn.active { background: #e3f2fd; color: #1976d2; }
            `}</style>
        </div>
    );
}
