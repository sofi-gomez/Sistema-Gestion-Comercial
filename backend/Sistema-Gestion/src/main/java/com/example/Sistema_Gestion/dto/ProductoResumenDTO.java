package com.example.Sistema_Gestion.dto;

import com.example.Sistema_Gestion.model.Producto;
import java.math.BigDecimal;

public class ProductoResumenDTO {
    private Long id;
    private String nombre;
    private String sku;
    private BigDecimal precioVenta;
    private BigDecimal precioVentaUSD;

    public ProductoResumenDTO() {}

    public ProductoResumenDTO(Producto producto) {
        if (producto != null) {
            this.id = producto.getId();
            this.nombre = producto.getNombre();
            this.sku = producto.getSku();
            this.precioVenta = producto.getPrecioVenta();
            this.precioVentaUSD = producto.getPrecioVentaUSD();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public BigDecimal getPrecioVenta() { return precioVenta; }
    public void setPrecioVenta(BigDecimal precioVenta) { this.precioVenta = precioVenta; }
    public BigDecimal getPrecioVentaUSD() { return precioVentaUSD; }
    public void setPrecioVentaUSD(BigDecimal precioVentaUSD) { this.precioVentaUSD = precioVentaUSD; }
}
