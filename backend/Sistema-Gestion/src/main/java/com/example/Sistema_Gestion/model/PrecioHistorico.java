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

    // Relación ManyToOne con Producto
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "precio", nullable = false)
    private BigDecimal precio; // <- cambiar Double por BigDecimal

    @Column(name = "fuente", length = 150)
    private String fuente;

    // ---------- Constructores ----------
    public PrecioHistorico() {}

    public PrecioHistorico(Producto producto, BigDecimal precio, String fuente) {
        this.producto = producto;
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
