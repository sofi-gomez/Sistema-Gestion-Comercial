package com.example.Sistema_Gestion.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_tesoreria")
public class MovimientoTesoreria {

    public enum TipoMovimiento {
        INGRESO, EGRESO
    }

    public enum MedioPago {
        EFECTIVO, TRANSFERENCIA, TARJETA_DEBITO, TARJETA_CREDITO, CHEQUE, MERCADO_PAGO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Si el tipo es ENUM en la BD pero VARCHAR en el código, usa String temporalmente
    @Column(nullable = false)
    private String tipo;

    @Column(name = "medio_pago", nullable = false)
    private String medioPago;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal importe;

    private String referencia;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    private LocalDateTime fecha;

    // Usar los nombres exactos que existen en la BD
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Métodos helper para trabajar con enums de forma segura
    public TipoMovimiento getTipoEnum() {
        try {
            return TipoMovimiento.valueOf(this.tipo);
        } catch (IllegalArgumentException e) {
            return TipoMovimiento.INGRESO; // Valor por defecto
        }
    }

    public void setTipoEnum(TipoMovimiento tipo) {
        this.tipo = tipo.name();
    }

    public MedioPago getMedioPagoEnum() {
        try {
            return MedioPago.valueOf(this.medioPago);
        } catch (IllegalArgumentException e) {
            return MedioPago.EFECTIVO; // Valor por defecto
        }
    }

    public void setMedioPagoEnum(MedioPago medioPago) {
        this.medioPago = medioPago.name();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getMedioPago() { return medioPago; }
    public void setMedioPago(String medioPago) { this.medioPago = medioPago; }

    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}