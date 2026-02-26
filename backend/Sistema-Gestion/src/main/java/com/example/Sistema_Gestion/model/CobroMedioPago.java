package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Describe UN medio de pago dentro de un cobro.
 * Un cobro puede tener varios medios (ej: parte en efectivo + parte en cheque).
 * Los campos de cheque son opcionales (null si el medio es
 * EFECTIVO/TRANSFERENCIA).
 */
@Entity
@Table(name = "cobro_medio_pago")
public class CobroMedioPago {

    public enum Medio {
        EFECTIVO, CHEQUE, TRANSFERENCIA
    }

    public enum TipoCheque {
        FISICO, ELECTRONICO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cobro_id", nullable = false)
    @JsonBackReference("cobro-medios")
    private Cobro cobro;

    @Column(nullable = false, length = 30)
    private String medio; // EFECTIVO, CHEQUE, TRANSFERENCIA

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal importe;

    // ===== Datos del cheque (solo si medio = CHEQUE) =====

    @Column(length = 100)
    private String banco;

    @Column(name = "numero_cheque", length = 50)
    private String numeroCheque;

    @Column(length = 150)
    private String librador;

    @Column(name = "fecha_emision")
    private LocalDate fechaEmision;

    @Column(name = "fecha_cobro")
    private LocalDate fechaCobro;

    @Column(name = "fecha_venc")
    private LocalDate fechaVenc;

    @Column(name = "tipo_cheque", length = 20)
    private String tipoCheque; // FISICO, ELECTRONICO

    // =================== GETTERS Y SETTERS ===================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cobro getCobro() {
        return cobro;
    }

    public void setCobro(Cobro cobro) {
        this.cobro = cobro;
    }

    public String getMedio() {
        return medio;
    }

    public void setMedio(String medio) {
        this.medio = medio;
    }

    public BigDecimal getImporte() {
        return importe;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
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

    public LocalDate getFechaVenc() {
        return fechaVenc;
    }

    public void setFechaVenc(LocalDate fechaVenc) {
        this.fechaVenc = fechaVenc;
    }

    public String getTipoCheque() {
        return tipoCheque;
    }

    public void setTipoCheque(String tipoCheque) {
        this.tipoCheque = tipoCheque;
    }
}
