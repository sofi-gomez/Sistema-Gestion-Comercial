package com.example.Sistema_Gestion.dto;

import com.example.Sistema_Gestion.model.Cliente;

public class ClienteResumenDTO {
    private Long id;
    private String nombre;
    private String notas;

    public ClienteResumenDTO() {}

    public ClienteResumenDTO(Cliente cliente) {
        if (cliente != null) {
            this.id = cliente.getId();
            this.nombre = cliente.getNombre();
            this.notas = cliente.getNotas();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
}
