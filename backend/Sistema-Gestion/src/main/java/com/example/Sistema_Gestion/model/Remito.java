package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "remito", indexes = {
    @Index(name = "idx_remito_fecha", columnList = "fecha")
})
public class Remito {

    // Estado del ciclo de vida del remito
    public enum EstadoRemito {
        PENDIENTE, // Mercadería entregada, sin precio
        VALORIZADO, // Precio asignado, pendiente de cobro
        COBRADO // Cobrado completamente
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long numero;

    private LocalDate fecha;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    // Campos para cliente manual
    @Column(name = "cliente_nombre")
    private String clienteNombre;

    @Column(name = "cliente_direccion")
    private String clienteDireccion;

    @Column(name = "cliente_codigo_postal")
    private String clienteCodigoPostal;

    @Column(name = "cliente_aclaracion")
    private String clienteAclaracion;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    // ===== CAMPOS DE ESTADO Y VALORIZACIÓN =====

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoRemito estado = EstadoRemito.PENDIENTE;

    /** Total calculado al valorizar (suma de subtotales de los ítems) */
    @Column(name = "total", precision = 14, scale = 2)
    private BigDecimal total;

    /** Cotización del dólar usada al momento de valorizar */
    @Column(name = "cotizacion_dolar", precision = 10, scale = 4)
    private BigDecimal cotizacionDolar;

    /** Fecha y hora en que se realizó la valorización */
    @Column(name = "fecha_valorizacion")
    private LocalDateTime fechaValorizacion;

    // ===================================================

    @OneToMany(mappedBy = "remito", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<RemitoItem> items = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (fecha == null) {
            fecha = LocalDate.now();
        }
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // =================== GETTERS Y SETTERS ===================

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

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public EstadoRemito getEstado() {
        return estado;
    }

    public void setEstado(EstadoRemito estado) {
        this.estado = estado;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getCotizacionDolar() {
        return cotizacionDolar;
    }

    public void setCotizacionDolar(BigDecimal cotizacionDolar) {
        this.cotizacionDolar = cotizacionDolar;
    }

    public LocalDateTime getFechaValorizacion() {
        return fechaValorizacion;
    }

    public void setFechaValorizacion(LocalDateTime fechaValorizacion) {
        this.fechaValorizacion = fechaValorizacion;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public String getClienteDireccion() {
        return clienteDireccion;
    }

    public void setClienteDireccion(String clienteDireccion) {
        this.clienteDireccion = clienteDireccion;
    }

    public String getClienteCodigoPostal() {
        return clienteCodigoPostal;
    }

    public void setClienteCodigoPostal(String clienteCodigoPostal) {
        this.clienteCodigoPostal = clienteCodigoPostal;
    }

    public String getClienteAclaracion() {
        return clienteAclaracion;
    }

    public void setClienteAclaracion(String clienteAclaracion) {
        this.clienteAclaracion = clienteAclaracion;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<RemitoItem> getItems() {
        return items;
    }

    public void setItems(List<RemitoItem> items) {
        this.items = items;
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

    public void addItem(RemitoItem item) {
        if (items == null)
            items = new ArrayList<>();
        items.add(item);
        item.setRemito(this);
    }
}