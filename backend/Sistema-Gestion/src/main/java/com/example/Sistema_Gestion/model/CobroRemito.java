package com.example.Sistema_Gestion.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Tabla pivot: un cobro puede pagar múltiples remitos,
 * y un remito puede recibir pagos parciales de múltiples cobros.
 * El campo `importe` indica cuánto de este cobro se aplica a este remito.
 */
@Entity
@Table(name = "cobro_remito")
public class CobroRemito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cobro_id", nullable = false)
    @JsonBackReference("cobro-remitos")
    private Cobro cobro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remito_id", nullable = false)
    private Remito remito;

    /** Importe aplicado de este cobro a este remito */
    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal importe;

    // =================== GETTERS Y SETTERS ===================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cobro getCobro() {
        return cobro;
    }

    public void setCobro(Cobro cobro) {
        this.cobro = cobro;
    }

    public Remito getRemito() {
        return remito;
    }

    public void setRemito(Remito remito) {
        this.remito = remito;
    }

    public BigDecimal getImporte() {
        return importe;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
    }
}
