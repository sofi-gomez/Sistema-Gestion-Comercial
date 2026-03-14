import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiHome, FiUser } from 'react-icons/fi';
import ChangeCredentialsModal from './ChangeCredentialsModal';


const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showCredsModal, setShowCredsModal] = useState(false);
    const isHome = location.pathname === "/";

    const handleLogout = () => {
        // Limpiamos todo el almacenamiento para asegurar un cierre total
        sessionStorage.clear();
        navigate("/login");
    };

    return (
        <div className="app-layout">
            <header className="home-header">
                <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <div className="logo-container">
                        <img src="/iSOTIPO.png" alt="Isotipo" className="brand-logo" />
                    </div>
                    <div className="brand-text">
                        <h1>LEONEL GOMEZ</h1>
                        <p className="subtitle">Agro-Ferretería</p>
                    </div>
                </div>

                <div className="header-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button className="back-btn-header-modern" onClick={() => setShowCredsModal(true)} title="Cambiar usuario o contraseña">
                        <FiUser /> <span className="hide-on-mobile">Cuenta</span>
                    </button>
                    {!isHome && (
                        <button className="back-btn-header-modern" onClick={() => navigate("/")}>
                            <FiHome /> <span>Inicio</span>
                        </button>
                    )}
                    <button className="logout-button-modern" onClick={handleLogout}>
                        <FiLogOut />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </header>
            <main className="layout-content">
                {children}
            </main>

            {showCredsModal && (
                <ChangeCredentialsModal
                    onClose={() => setShowCredsModal(false)}
                    onSaved={() => {
                        setShowCredsModal(false);
                        handleLogout(); // Force logout so they login with new creds
                    }}
                />
            )}

            <style>{`
                .back-btn-header-modern {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(4px);
                }

                .back-btn-header-modern:hover {
                    background: rgba(255, 255, 255, 0.25);
                    border-color: rgba(255, 255, 255, 0.4);
                    transform: translateY(-1px);
                }

                .logout-button-modern {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(4px);
                }

                .logout-button-modern:hover {
                    background: rgba(255, 252, 252, 0.2);
                    border-color: rgba(255, 255, 255, 0.4);
                    transform: translateY(-1px);
                }
                
                .back-btn-header-modern svg, .logout-button-modern svg {
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
};

export default Layout;
