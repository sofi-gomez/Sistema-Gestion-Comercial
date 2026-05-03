package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Representa un cobro realizado a un cliente.
 * Un cobro puede cubrir uno o más remitos (ver CobroRemito)
 * y puede pagarse con múltiples medios (ver CobroMedioPago).
 */
@Entity
@Table(name = "cobro")
public class Cobro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private LocalDate fecha;

    /** Suma total cobrada en este acto de cobro */
    @Column(name = "total_cobrado", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalCobrado;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(nullable = false)
    private Boolean anulado = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Remitos que cubre este cobro (con el importe aplicado a cada uno) */
    @OneToMany(mappedBy = "cobro", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("cobro-remitos")
    private List<CobroRemito> remitos = new ArrayList<>();

    /** Medios de pago usados en este cobro (puede ser mixto) */
    @OneToMany(mappedBy = "cobro", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("cobro-medios")
    private List<CobroMedioPago> mediosPago = new ArrayList<>();

    @OneToMany(mappedBy = "cobro", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("cobro-notas")
    private List<CobroNota> notas = new ArrayList<>();

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

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getTotalCobrado() {
        return totalCobrado;
    }

    public void setTotalCobrado(BigDecimal totalCobrado) {
        this.totalCobrado = totalCobrado;
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

    public List<CobroRemito> getRemitos() {
        return remitos;
    }

    public void setRemitos(List<CobroRemito> remitos) {
        this.remitos = remitos;
    }

    public List<CobroMedioPago> getMediosPago() {
        return mediosPago;
    }

    public void setMediosPago(List<CobroMedioPago> mediosPago) {
        this.mediosPago = mediosPago;
    }

    public List<CobroNota> getNotas() {
        return notas;
    }

    public void setNotas(List<CobroNota> notas) {
        this.notas = notas;
    }
}
