package com.example.Sistema_Gestion.dto;

import com.example.Sistema_Gestion.model.Producto;

public class ProductoResumenDTO {
    private Long id;
    private String nombre;
    private String sku;

    public ProductoResumenDTO() {}

    public ProductoResumenDTO(Producto producto) {
        if (producto != null) {
            this.id = producto.getId();
            this.nombre = producto.getNombre();
            this.sku = producto.getSku();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
}
