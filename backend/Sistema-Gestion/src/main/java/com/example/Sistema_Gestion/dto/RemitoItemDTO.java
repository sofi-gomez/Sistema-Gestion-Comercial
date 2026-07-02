package com.example.Sistema_Gestion.dto;

import com.example.Sistema_Gestion.model.RemitoItem;
import java.math.BigDecimal;

public class RemitoItemDTO {
    private Long id;
    private ProductoResumenDTO producto;
    private java.math.BigDecimal cantidad;
    private BigDecimal precioUnitario;

    public RemitoItemDTO() {}

    public RemitoItemDTO(RemitoItem item) {
        this.id = item.getId();
        this.producto = new ProductoResumenDTO(item.getProducto());
        this.cantidad = item.getCantidad();
        this.precioUnitario = item.getPrecioUnitario();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ProductoResumenDTO getProducto() { return producto; }
    public void setProducto(ProductoResumenDTO producto) { this.producto = producto; }
    public java.math.BigDecimal getCantidad() { return cantidad; }
    public void setCantidad(java.math.BigDecimal cantidad) { this.cantidad = cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
}
