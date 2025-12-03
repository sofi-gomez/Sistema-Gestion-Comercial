package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="remito")
public class Remito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long numero;

    private LocalDateTime fecha;

    // Campos para cliente manual
    @Column(name="cliente_nombre")
    private String clienteNombre;

    @Column(name="cliente_direccion")
    private String clienteDireccion;

    @Column(name="cliente_codigo_postal")
    private String clienteCodigoPostal;

    @Column(name="cliente_aclaracion")
    private String clienteAclaracion;

    @Column(columnDefinition="TEXT")
    private String observaciones;

    @OneToMany(mappedBy="remito", cascade=CascadeType.ALL, orphanRemoval=true)
    @JsonManagedReference
    private List<RemitoItem> items = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist(){
        fecha = LocalDateTime.now();
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate(){
        updatedAt = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNumero() { return numero; }
    public void setNumero(Long numero) { this.numero = numero; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getClienteDireccion() { return clienteDireccion; }
    public void setClienteDireccion(String clienteDireccion) { this.clienteDireccion = clienteDireccion; }

    public String getClienteCodigoPostal() { return clienteCodigoPostal; }
    public void setClienteCodigoPostal(String clienteCodigoPostal) { this.clienteCodigoPostal = clienteCodigoPostal; }

    public String getClienteAclaracion() { return clienteAclaracion; }
    public void setClienteAclaracion(String clienteAclaracion) { this.clienteAclaracion = clienteAclaracion; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public List<RemitoItem> getItems() { return items; }
    public void setItems(List<RemitoItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public void addItem(RemitoItem item) {
        if (items == null) items = new ArrayList<>();
        items.add(item);
        item.setRemito(this);
    }
}