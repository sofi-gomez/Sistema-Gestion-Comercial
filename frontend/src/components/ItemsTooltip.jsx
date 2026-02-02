import React, { useState } from "react";
import "../index.css";

export default function ItemsTooltip({ items = [] }) {
    const [showTooltip, setShowTooltip] = useState(false);

    if (!items.length) return "Sin items";

    const nombres = items
        .map(it => it.producto?.nombre)
        .filter(Boolean);

    const visibles = nombres.slice(0, 2);
    const restantes = nombres.length - visibles.length;

    return (
        <div
            style={{ position: "relative", display: "inline-block" }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span style={{ cursor: "pointer" }}>
                {visibles.join(", ")}
                {restantes > 0 && (
                    <span style={{ color: "#3b82f6", fontWeight: "500" }}>
                        {" (+"}
                        {restantes}
                        {")"}
                    </span>
                )}
            </span>

            {showTooltip && items.length > 2 && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        marginTop: "8px",
                        backgroundColor: "#1f2937",
                        color: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        zIndex: 1000,
                        minWidth: "200px",
                        maxWidth: "300px",
                        whiteSpace: "normal",
                    }}
                >
                    <div style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "8px", color: "#9ca3af" }}>
                        TODOS LOS ITEMS ({items.length})
                    </div>
                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            style={{
                                fontSize: "0.875rem",
                                padding: "4px 0",
                                borderBottom: idx < items.length - 1 ? "1px solid #374151" : "none",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>{item.producto?.nombre || "Sin nombre"}</span>
                                <span style={{
                                    fontSize: "0.75rem",
                                    color: "#9ca3af",
                                    marginLeft: "8px",
                                    fontWeight: "500"
                                }}>
                                    x{item.cantidad}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}