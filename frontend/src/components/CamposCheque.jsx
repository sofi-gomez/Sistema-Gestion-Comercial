import React from "react";

/**
 * Componente reutilizable para campos de cheque
 * Se usa tanto en VentaFormModal como en MovimientoFormModal
 */
export default function CamposCheque({
                                         banco,
                                         setBanco,
                                         numeroCheque,
                                         setNumeroCheque,
                                         librador,
                                         setLibrador,
                                         fechaEmision,
                                         setFechaEmision,
                                         fechaCobro,
                                         setFechaCobro,
                                         mostrar
                                     }) {

    if (!mostrar) return null;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
        }}>
            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Banco *</label>
                <input
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    className="modern-input"
                    placeholder="Ej: Banco Galicia"
                    required
                />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Número de Cheque *</label>
                <input
                    value={numeroCheque}
                    onChange={(e) => setNumeroCheque(e.target.value)}
                    className="modern-input"
                    placeholder="Ej: 12345678"
                    required
                />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Librador/Titular *</label>
                <input
                    value={librador}
                    onChange={(e) => setLibrador(e.target.value)}
                    className="modern-input"
                    placeholder="Nombre del titular"
                    required
                />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Fecha de Emisión *</label>
                <input
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="modern-input"
                    required
                />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Fecha de Cobro *</label>
                <input
                    type="date"
                    value={fechaCobro}
                    onChange={(e) => setFechaCobro(e.target.value)}
                    className="modern-input"
                    required
                />
            </div>
        </div>
    );
}