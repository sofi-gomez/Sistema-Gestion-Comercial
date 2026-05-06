package com.example.Sistema_Gestion.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "movimiento_tesoreria", indexes = {
    @Index(name = "idx_movimiento_referencia", columnList = "referencia"),
    @Index(name = "idx_movimiento_fecha", columnList = "fecha")
})
public class MovimientoTesoreria {

    public enum TipoMovimiento {
        INGRESO, EGRESO
    }

    public enum MedioPago {
        EFECTIVO, TRANSFERENCIA, TARJETA_DEBITO, TARJETA_CREDITO, CHEQUE, CHEQUE_ELECTRONICO, MERCADO_PAGO
    }

    public enum TipoCheque {
        FISICO,
        ELECTRONICO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tipo;

    @Column(name = "medio_pago", nullable = false)
    private String medioPago;

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal importe;

    /** Importe referencial en USD. Solo se popula cuando el egreso es un pago a proveedor en dólares.
     * No afecta la contabilidad en pesos — es solo informativo para identificar la moneda de origen. */
    @Column(name = "importe_usd", precision = 10, scale = 2)
    private BigDecimal importeUSD;

    private String referencia;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "anulado", nullable = false)
    private Boolean anulado = false;

    @Column(name = "cobrado", nullable = false)
    private Boolean cobrado = false;

    @Column(name = "rechazado", nullable = false)
    private Boolean rechazado = false;

    @Column(length = 200)
    private String entidad; // Cliente, Proveedor o Persona externa

    // ================= DATOS DE CHEQUE =================

    @Column(name = "tipo_cheque")
    private String tipoCheque;

    private String banco;

    @Column(name = "numero_cheque")
    private String numeroCheque;

    private String librador;

    @Column(name = "fecha_emision")
    private LocalDate fechaEmision;

    @Column(name = "fecha_cobro")
    private LocalDate fechaCobro;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @PrePersist
    protected void onCreate() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }

        // Automatización de estado 'Cobrado'
        if (this.medioPago != null) {
            // 1. Medios electrónicos o efectivo: Cobro inmediato
            if (isMedioPagoInmediato()) {
                this.cobrado = true;
            }
            // 2. Cheques: Cobro si la fecha de cobro ya llegó o pasó
            else if (isCheque() && fechaCobro != null) {
                if (!fechaCobro.isAfter(LocalDate.now())) {
                    this.cobrado = true;
                }
            }
        }

        calcularVencimientoCheque();
    }

    private boolean isMedioPagoInmediato() {
        return "EFECTIVO".equals(this.medioPago) ||
                "TRANSFERENCIA".equals(this.medioPago) ||
                "TARJETA_DEBITO".equals(this.medioPago) ||
                "TARJETA_CREDITO".equals(this.medioPago) ||
                "MERCADO_PAGO".equals(this.medioPago);
    }

    private boolean isCheque() {
        return "CHEQUE".equals(this.medioPago) || "CHEQUE_ELECTRONICO".equals(this.medioPago);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calcularVencimientoCheque();
    }

    // Métodos helper para trabajar con enums de forma segura
    public TipoMovimiento getTipoEnum() {
        try {
            return TipoMovimiento.valueOf(this.tipo);
        } catch (IllegalArgumentException e) {
            return TipoMovimiento.INGRESO;
        }
    }

    protected void calcularVencimientoCheque() {
        if (getMedioPagoEnum() == MedioPago.CHEQUE && fechaCobro != null && fechaVencimiento == null) {
            fechaVencimiento = fechaCobro.plusDays(30);
        }
    }

    public void setTipoEnum(TipoMovimiento tipo) {
        this.tipo = tipo.name();
    }

    public MedioPago getMedioPagoEnum() {
        try {
            return MedioPago.valueOf(this.medioPago);
        } catch (IllegalArgumentException e) {
            return MedioPago.EFECTIVO;
        }
    }

    public void setMedioPagoEnum(MedioPago medioPago) {
        this.medioPago = medioPago.name();
    }

    public TipoCheque getTipoChequeEnum() {
        try {
            return TipoCheque.valueOf(this.tipoCheque);
        } catch (Exception e) {
            return TipoCheque.FISICO;
        }
    }

    public void setTipoChequeEnum(TipoCheque tipo) {
        this.tipoCheque = tipo.name();
    }

    @Transient
    public boolean isChequeVencido() {
        return getMedioPagoEnum() == MedioPago.CHEQUE
                && fechaVencimiento != null
                && fechaVencimiento.isBefore(LocalDate.now());
    }

    @Transient
    public boolean isChequeProximoAVencer(int dias) {
        return getMedioPagoEnum() == MedioPago.CHEQUE
                && fechaVencimiento != null
                && fechaVencimiento.isAfter(LocalDate.now())
                && fechaVencimiento.isBefore(LocalDate.now().plusDays(dias));
    }

    // ================= GETTERS Y SETTERS =================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getMedioPago() {
        return medioPago;
    }

    public void setMedioPago(String medioPago) {
        this.medioPago = medioPago;
    }

    public BigDecimal getImporte() {
        return importe;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
    }

    public BigDecimal getImporteUSD() {
        return importeUSD;
    }

    public void setImporteUSD(BigDecimal importeUSD) {
        this.importeUSD = importeUSD;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getAnulado() {
        return anulado;
    }

    public void setAnulado(Boolean anulado) {
        this.anulado = anulado;
    }

    public Boolean getCobrado() {
        return cobrado;
    }

    public void setCobrado(Boolean cobrado) {
        this.cobrado = cobrado;
    }

    public Boolean getRechazado() {
        return rechazado;
    }

    public void setRechazado(Boolean rechazado) {
        this.rechazado = rechazado;
    }

    public String getEntidad() {
        return entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    // Getters y Setters de campos de cheque
    public String getTipoCheque() {
        return tipoCheque;
    }

    public void setTipoCheque(String tipoCheque) {
        this.tipoCheque = tipoCheque;
    }

    public String getBanco() {
        return banco;
    }

    public void setBanco(String banco) {
        this.banco = banco;
    }

    public String getNumeroCheque() {
        return numeroCheque;
    }

    public void setNumeroCheque(String numeroCheque) {
        this.numeroCheque = numeroCheque;
    }

    public String getLibrador() {
        return librador;
    }

    public void setLibrador(String librador) {
        this.librador = librador;
    }

    public LocalDate getFechaEmision() {
        return fechaEmision;
    }

    public void setFechaEmision(LocalDate fechaEmision) {
        this.fechaEmision = fechaEmision;
    }

    public LocalDate getFechaCobro() {
        return fechaCobro;
    }

    public void setFechaCobro(LocalDate fechaCobro) {
        this.fechaCobro = fechaCobro;
    }

    public LocalDate getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(LocalDate fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }
}