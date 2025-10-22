package com.example.Sistema_Gestion.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name="venta")
public class Venta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private Long numeroInterno;

    private LocalDateTime fecha;

    @ManyToOne
    @JoinColumn(name="cliente_id")
    private Cliente cliente;

    @Column(precision=14,scale=2)
    private BigDecimal total = BigDecimal.ZERO;

    private String estado;

    @OneToMany(mappedBy="venta", cascade=CascadeType.ALL, orphanRemoval=true)
    private List<VentaItem> items;

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

    public List<VentaItem> getItems() {
        return items;
    }

    public void setItems(List<VentaItem> items) {
        this.items = items;
    }

    public Long getNumeroInterno() {
        return numeroInterno;
    }

    public void setNumeroInterno(Long numeroInterno) {
        this.numeroInterno = numeroInterno;
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
