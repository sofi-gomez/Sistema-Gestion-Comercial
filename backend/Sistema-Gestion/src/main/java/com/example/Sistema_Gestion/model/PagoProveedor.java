package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Representa un pago realizado A un proveedor.
 * Un pago puede cubrir una o varias compras (ver PagoProveedorCompra).
 * Soporta cheques de terceros como medio de pago.
 */
@Entity
@Table(name = "pago_proveedor")
public class PagoProveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "proveedor_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Proveedor proveedor;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal importe;

    /**
     * Medio de pago: EFECTIVO, CHEQUE, TRANSFERENCIA, CUENTA_CORRIENTE
     */
    @Column(nullable = false, length = 30)
    private String medio;

    // ===== Datos del cheque de tercero (si aplica) =====

    @Column(length = 100)
    private String banco;

    @Column(name = "numero_cheque", length = 50)
    private String numeroCheque;

    @Column(length = 150)
    private String librador;

    @Column(name = "fecha_venc")
    private LocalDate fechaVenc;

    // ===================================================

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(nullable = false)
    private Boolean anulado = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Compras que cubre este pago */
    @OneToMany(mappedBy = "pagoProveedor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("pago-compras")
    private List<PagoProveedorCompra> compras = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (fecha == null)
            fecha = LocalDate.now();
        createdAt = LocalDateTime.now();
    }

    // =================== GETTERS Y SETTERS ===================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getImporte() {
        return importe;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
    }

    public String getMedio() {
        return medio;
    }

    public void setMedio(String medio) {
        this.medio = medio;
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

    public LocalDate getFechaVenc() {
        return fechaVenc;
    }

    public void setFechaVenc(LocalDate fechaVenc) {
        this.fechaVenc = fechaVenc;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Boolean getAnulado() {
        return anulado;
    }

    public void setAnulado(Boolean anulado) {
        this.anulado = anulado;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<PagoProveedorCompra> getCompras() {
        return compras;
    }

    public void setCompras(List<PagoProveedorCompra> compras) {
        this.compras = compras;
    }
}
