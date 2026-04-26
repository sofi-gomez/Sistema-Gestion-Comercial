package com.example.Sistema_Gestion.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ajuste_stock")
public class AjusteStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad; // Positivo sume, Negativo reste

    @Column(nullable = false)
    private String motivo;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column
    private String usuario; // Opcional por ahora

    public AjusteStock() {
        this.fecha = LocalDateTime.now();
    }

    public AjusteStock(Producto producto, Integer cantidad, String motivo) {
        this.producto = producto;
        this.cantidad = cantidad;
        this.motivo = motivo;
        this.fecha = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
}
