import React, { useState } from "react";
import { FiLock, FiUser, FiShield } from "react-icons/fi";
import { apiFetch } from "../utils/api";

export default function ChangeCredentialsModal({ onClose, onSaved }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!currentPassword) {
            setError("La contraseña actual es obligatoria.");
            return;
        }

        if (!newUsername && !newPassword) {
            setError("Debes ingresar un nuevo usuario o una nueva contraseña.");
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setError("Las nuevas contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {
            const res = await apiFetch("/api/auth/update-credentials", {
                method: "POST",
                body: JSON.stringify({
                    currentPassword,
                    newUsername,
                    newPassword
                })
            });

            if (res.ok) {
                alert("Credenciales actualizadas correctamente. Por seguridad, deberás iniciar sesión nuevamente.");
                onSaved();
            } else {
                const data = await res.json();
                setError(data.error || "Ocurrió un error al actualizar las credenciales.");
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card modal-auth" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="title-icon" style={{ padding: "8px", background: "#fef3c7", color: "#d97706" }}>
                            <FiShield />
                        </div>
                        <h2>Cambiar Credenciales</h2>
                    </div>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        {error && (
                            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "0.85rem" }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label"><FiLock /> Contraseña Actual *</label>
                            <input
                                type="password"
                                className="modern-input"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Requerida por seguridad"
                                required
                            />
                        </div>

                        <hr style={{ border: "0", borderTop: "1px solid #e5e7eb", margin: "15px 0" }} />

                        <div className="form-group">
                            <label className="form-label"><FiUser /> Nuevo Usuario (Opcional)</label>
                            <input
                                type="text"
                                className="modern-input"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                placeholder="Dejar en blanco para no cambiar"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label"><FiLock /> Nueva Contraseña (Opcional)</label>
                            <input
                                type="password"
                                className="modern-input"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Dejar en blanco para no cambiar"
                            />
                        </div>

                        {newPassword && (
                            <div className="form-group">
                                <label className="form-label"><FiLock /> Confirmar Nueva Contraseña *</label>
                                <input
                                    type="password"
                                    className="modern-input"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repita su nueva contraseña"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ background: "#d97706" }}>
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
