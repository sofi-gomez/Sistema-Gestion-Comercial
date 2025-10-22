package com.example.Sistema_Gestion.model;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name="remito_item")
public class RemitoItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="remito_id", nullable=false)
    private Remito remito;

    @ManyToOne
    @JoinColumn(name="producto_id", nullable=false)
    private Producto producto;

    @Column(precision=18, scale=4, nullable=false)
    private BigDecimal cantidad;

    private String unidadMedida;
    @Column(columnDefinition="TEXT")
    private String notas;
    // getters/setters


    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Remito getRemito() {
        return remito;
    }

    public void setRemito(Remito remito) {
        this.remito = remito;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(String unidadMedida) {
        this.unidadMedida = unidadMedida;
    }
}
