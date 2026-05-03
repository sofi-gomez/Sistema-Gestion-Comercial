package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "notas")
public class Nota {

    public enum TipoNota {
        DEBITO,
        CREDITO
    }

    public enum EstadoNota {
        PENDIENTE,
        PAGADA,
        ANULADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long numero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoNota tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "remitos", "cobros"})
    private Cliente cliente;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal monto;

    @Column(length = 255, nullable = false)
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoNota estado;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (fecha == null) fecha = LocalDate.now();
        if (estado == null) estado = EstadoNota.PENDIENTE;
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getNumero() {
        return numero;
    }

    public void setNumero(Long numero) {
        this.numero = numero;
    }

    public TipoNota getTipo() {
        return tipo;
    }

    public void setTipo(TipoNota tipo) {
        this.tipo = tipo;
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

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public EstadoNota getEstado() {
        return estado;
    }

    public void setEstado(EstadoNota estado) {
        this.estado = estado;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
