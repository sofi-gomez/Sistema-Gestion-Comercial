package com.example.Sistema_Gestion.dto;

import com.example.Sistema_Gestion.model.CompraItem;
import java.math.BigDecimal;

public class CompraItemDTO {
    private ProductoResumenDTO producto;
    private Integer cantidad;
    private java.math.BigDecimal precioUnitario;
    private java.math.BigDecimal subtotal;

    public CompraItemDTO() {}

    public CompraItemDTO(CompraItem item) {
        this.producto = new ProductoResumenDTO(item.getProducto());
        this.cantidad = item.getCantidad();
        this.precioUnitario = item.getPrecioUnitario();
        this.subtotal = item.getSubtotal();
    }

    // Getters and Setters
    public ProductoResumenDTO getProducto() { return producto; }
    public void setProducto(ProductoResumenDTO producto) { this.producto = producto; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}
