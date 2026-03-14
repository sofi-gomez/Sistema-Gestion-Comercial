import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiUser } from "react-icons/fi";
import "../index.css";

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

    // Si ya está logueado, redirigir al inicio automáticamente
    React.useEffect(() => {
        const auth = sessionStorage.getItem("authenticated") === "true";
        const token = sessionStorage.getItem("token");
        if (auth && token) {
            navigate("/");
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(false);

        const API_URL = process.env.REACT_APP_API_URL || "";

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                // Guardamos el token JWT para futuras peticiones
                sessionStorage.setItem("token", data.token);
                sessionStorage.setItem("authenticated", "true");
                sessionStorage.setItem("username", data.username);
                navigate("/");
            } else {
                setError(true);
            }
        } catch (err) {
            console.error("Error de login:", err);
            setError(true);
        }
    };

    return (
        <div className="login-root">
            <div className="login-container">
                <div className="login-brand">
                    <div className="login-logo-container">
                        <img src="/iSOTIPO.png" alt="Isotipo" className="login-logo" />
                    </div>
                    <h1>LEONEL GOMEZ</h1>
                    <p>Agro-Ferretería</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Inicie sesión para continuar</p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Usuario</label>
                        <div className="input-with-icon">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                className="modern-input pl-10"
                                placeholder="Ingrese su usuario"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(false); }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <div className="input-with-icon">
                            <FiLock className="input-icon" />
                            <input
                                type="password"
                                className="modern-input pl-10"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                            />
                        </div>
                    </div>

                    {error && <p className="login-error">Por favor, ingrese sus credenciales.</p>}

                    <button type="submit" className="login-button">
                        Iniciar Sesión
                    </button>
                </form>

                <div className="login-footer">
                    <p>© {new Date().getFullYear()} Leonel Gomez — Agro-Ferretería</p>
                    <p className="footer-tagline">NUESTRAS PLANTAS NUNCA DUERMEN</p>
                </div>
            </div>
        </div>
    );
}
