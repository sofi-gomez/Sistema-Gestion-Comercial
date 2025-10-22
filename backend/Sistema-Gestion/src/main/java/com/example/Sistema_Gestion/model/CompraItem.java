package com.example.Sistema_Gestion.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name="compra_item")
public class CompraItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="compra_id", nullable=false)
    private Compra compra;

    @ManyToOne
    @JoinColumn(name="producto_id", nullable=false)
    private Producto producto;

    @Column(precision=18, scale=4, nullable=false)
    private BigDecimal cantidad;

    @Column(precision=14, scale=2, nullable=false)
    private BigDecimal precioUnitario;

    @Column(precision=14, scale=2, nullable=false)
    private BigDecimal subtotal;

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public Compra getCompra() {
        return compra;
    }

    public void setCompra(Compra compra) {
        this.compra = compra;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
