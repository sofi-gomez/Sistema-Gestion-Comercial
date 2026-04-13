package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "compra")

public class Compra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long numero;

    private LocalDateTime fecha;

    @ManyToOne
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @Column(precision = 14, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal ivaImporte = BigDecimal.ZERO;

    @Column(precision = 6, scale = 2)
    private BigDecimal porcentajeIva = BigDecimal.ZERO;

    private Boolean incluyeIva = false;

    private String descuentoTipo = "PORCENTAJE"; // "PORCENTAJE" o "MONTO"

    @Column(precision = 14, scale = 2)
    private BigDecimal descuentoValor = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal descuentoImporte = BigDecimal.ZERO;

    @Column(length = 3)
    private String moneda = "ARS"; // "ARS" o "USD"

    @Column(precision = 14, scale = 4)
    private BigDecimal tipoCambio = BigDecimal.ONE;

    @Column(precision = 14, scale = 2)
    private BigDecimal totalDolares = BigDecimal.ZERO;

    private String estado;
    @Column(columnDefinition = "TEXT")
    private String anotaciones;

    @OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<CompraItem> items;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getAnotaciones() {
        return anotaciones;
    }

    public void setAnotaciones(String anotaciones) {
        this.anotaciones = anotaciones;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<CompraItem> getItems() {
        return items;
    }

    public void setItems(List<CompraItem> items) {
        this.items = items;
    }

    public Long getNumero() {
        return numero;
    }

    public void setNumero(Long numero) {
        this.numero = numero;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getIvaImporte() {
        return ivaImporte;
    }

    public void setIvaImporte(BigDecimal ivaImporte) {
        this.ivaImporte = ivaImporte;
    }

    public BigDecimal getPorcentajeIva() {
        return porcentajeIva;
    }

    public void setPorcentajeIva(BigDecimal porcentajeIva) {
        this.porcentajeIva = porcentajeIva;
    }

    public Boolean getIncluyeIva() {
        return incluyeIva;
    }

    public void setIncluyeIva(Boolean incluyeIva) {
        this.incluyeIva = incluyeIva;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getDescuentoTipo() {
        return descuentoTipo;
    }

    public void setDescuentoTipo(String descuentoTipo) {
        this.descuentoTipo = descuentoTipo;
    }

    public BigDecimal getDescuentoValor() {
        return descuentoValor;
    }

    public void setDescuentoValor(BigDecimal descuentoValor) {
        this.descuentoValor = descuentoValor;
    }

    public BigDecimal getDescuentoImporte() {
        return descuentoImporte;
    }

    public void setDescuentoImporte(BigDecimal descuentoImporte) {
        this.descuentoImporte = descuentoImporte;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public BigDecimal getTipoCambio() {
        return tipoCambio;
    }

    public void setTipoCambio(BigDecimal tipoCambio) {
        this.tipoCambio = tipoCambio;
    }

    public BigDecimal getTotalDolares() {
        return totalDolares;
    }

    public void setTotalDolares(BigDecimal totalDolares) {
        this.totalDolares = totalDolares;
    }
}
