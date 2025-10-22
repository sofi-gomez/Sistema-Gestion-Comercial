package com.example.Sistema_Gestion.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name="compra")

public class Compra {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private Long numero;

    private LocalDateTime fecha;

    @ManyToOne
    @JoinColumn(name="proveedor_id", nullable=false)
    private Proveedor proveedor;

    @Column(precision=14,scale=2)
    private BigDecimal total = BigDecimal.ZERO;

    private String estado;
    @Column(columnDefinition="TEXT")
    private String anotaciones;

    @OneToMany(mappedBy="compra", cascade=CascadeType.ALL, orphanRemoval=true)
    private List<CompraItem> items;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @PrePersist public void prePersist(){ fecha = LocalDateTime.now(); createdAt=updatedAt=LocalDateTime.now();}
    @PreUpdate public void preUpdate(){ updatedAt=LocalDateTime.now();}

    public String getAnotaciones() {
        return anotaciones;
    }

    public void setAnotaciones(String anotaciones) {
        this.anotaciones = anotaciones;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
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

    public List<CompraItem> getItems() {
        return items;
    }

    public void setItems(List<CompraItem> items) {
        this.items = items;
    }

    public Long getNumero() {
        return numero;
    }

    public void setNumero(Long numero) {
        this.numero = numero;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
