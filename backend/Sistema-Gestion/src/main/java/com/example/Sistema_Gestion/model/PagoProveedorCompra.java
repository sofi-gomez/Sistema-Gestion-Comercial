package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Tabla pivot: un pago a proveedor puede distribuirse
 * entre varias compras pendientes, con un importe aplicado a cada una.
 */
@Entity
@Table(name = "pago_proveedor_compra")
public class PagoProveedorCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pago_proveedor_id", nullable = false)
    @JsonBackReference("pago-compras")
    private PagoProveedor pagoProveedor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "compra_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "items", "proveedor", "hibernateLazyInitializer",
            "handler" })
    private Compra compra;

    /** Importe de este pago aplicado a esta compra */
    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal importe;

    // =================== GETTERS Y SETTERS ===================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PagoProveedor getPagoProveedor() {
        return pagoProveedor;
    }

    public void setPagoProveedor(PagoProveedor pagoProveedor) {
        this.pagoProveedor = pagoProveedor;
    }

    public Compra getCompra() {
        return compra;
    }

    public void setCompra(Compra compra) {
        this.compra = compra;
    }

    public BigDecimal getImporte() {
        return importe;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
    }
}
