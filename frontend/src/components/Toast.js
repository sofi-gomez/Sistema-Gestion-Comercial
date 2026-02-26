import React, { useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";
import "../index.css";

export default function Toast({ message, type = "success", title, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        switch (type) {
            case "success": return <FiCheckCircle color="#16a34a" />;
            case "error": return <FiXCircle color="#dc2626" />;
            case "info": return <FiInfo color="#2563eb" />;
            default: return <FiCheckCircle color="#16a34a" />;
        }
    };

    return (
        <div className={`toast ${type}`}>
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-content">
                {title && <h4>{title}</h4>}
                <p>{message}</p>
            </div>
            <button
                onClick={onClose}
                style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: "4px"
                }}
            >
                <FiX />
            </button>
        </div>
    );
}
