package com.example.Sistema_Gestion.model;


import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;


@Entity
@Table(name="remito")
public class Remito {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long numero;

    private LocalDateTime fecha;

    @ManyToOne
    @JoinColumn(name="proveedor_id")
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name="cliente_id")
    private Cliente cliente;

    // en Remito.java (entidad)
    @Column(name="cliente_nombre")
    private String clienteNombre;

    @Column(name="cliente_direccion")
    private String clienteDireccion;

    @Column(name="cliente_codigo_postal")
    private String clienteCodigoPostal;

    @Column(name="cliente_aclaracion")
    private String clienteAclaracion;

    // + getters y setters
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getClienteDireccion() { return clienteDireccion; }
    public void setClienteDireccion(String clienteDireccion) { this.clienteDireccion = clienteDireccion; }

    public String getClienteCodigoPostal() { return clienteCodigoPostal; }
    public void setClienteCodigoPostal(String clienteCodigoPostal) { this.clienteCodigoPostal = clienteCodigoPostal; }

    public String getClienteAclaracion() { return clienteAclaracion; }
    public void setClienteAclaracion(String clienteAclaracion) { this.clienteAclaracion = clienteAclaracion; }


    @Column(columnDefinition="TEXT")
    private String observaciones;

    @OneToMany(mappedBy="remito", cascade=CascadeType.ALL, orphanRemoval=true)
    @JsonManagedReference
    private List<RemitoItem> items;


    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @PrePersist public void prePersist(){ fecha = LocalDateTime.now(); createdAt=updatedAt=LocalDateTime.now();}
    @PreUpdate public void preUpdate(){ updatedAt=LocalDateTime.now();}
    // getters/setters


    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<RemitoItem> getItems() {
        return items;
    }

    public void setItems(List<RemitoItem> items) {
        this.items = items;
    }

    public Long getNumero() {
        return numero;
    }

    public void setNumero(Long numero) {
        this.numero = numero;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void addItem(RemitoItem item) {
        if (items == null) items = new ArrayList<>();
        items.add(item);
        item.setRemito(this);
    }
}
