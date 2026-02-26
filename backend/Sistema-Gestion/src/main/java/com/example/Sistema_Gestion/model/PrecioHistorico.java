package com.example.Sistema_Gestion.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "precio_historico")
public class PrecioHistorico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    /**
     * Proveedor que vendió el producto a ese precio (nullable = precio de venta)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "precio", nullable = false)
    private BigDecimal precio;

    @Column(name = "fuente", length = 150)
    private String fuente;

    // ---------- Constructores ----------
    public PrecioHistorico() {
    }

    public PrecioHistorico(Producto producto, BigDecimal precio, String fuente) {
        this.producto = producto;
        this.precio = precio;
        this.fuente = fuente;
        this.fecha = LocalDateTime.now();
    }

    public PrecioHistorico(Producto producto, Proveedor proveedor, BigDecimal precio, String fuente) {
        this.producto = producto;
        this.proveedor = proveedor;
        this.precio = precio;
        this.fuente = fuente;
        this.fecha = LocalDateTime.now();
    }

    // ---------- Getters y Setters ----------
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public String getFuente() {
        return fuente;
    }

    public void setFuente(String fuente) {
        this.fuente = fuente;
    }
}
