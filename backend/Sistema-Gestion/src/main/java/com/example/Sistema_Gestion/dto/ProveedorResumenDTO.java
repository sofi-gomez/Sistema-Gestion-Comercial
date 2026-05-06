package com.example.Sistema_Gestion.dto;

import com.example.Sistema_Gestion.model.Proveedor;

public class ProveedorResumenDTO {
    private Long id;
    private String nombre;

    public ProveedorResumenDTO() {}

    public ProveedorResumenDTO(Proveedor proveedor) {
        if (proveedor != null) {
            this.id = proveedor.getId();
            this.nombre = proveedor.getNombre();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
}
