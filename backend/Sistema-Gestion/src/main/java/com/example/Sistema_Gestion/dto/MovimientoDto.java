package com.example.Sistema_Gestion.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class MovimientoDto {
    private LocalDate fecha;
    private String tipo; // "DEBE" o "HABER"
    private String origen; // "REMITO", "COBRO", "NOTA"
    private String descripcion;
    private BigDecimal importe;
    private Long idReferencia;

    public MovimientoDto(LocalDate fecha, String tipo, String origen, String descripcion, BigDecimal importe, Long idReferencia) {
        this.fecha = fecha;
        this.tipo = tipo;
        this.origen = origen;
        this.descripcion = descripcion;
        this.importe = importe;
        this.idReferencia = idReferencia;
    }

    // Getters
    public LocalDate getFecha() { return fecha; }
    public String getTipo() { return tipo; }
    public String getOrigen() { return origen; }
    public String getDescripcion() { return descripcion; }
    public BigDecimal getImporte() { return importe; }
    public Long getIdReferencia() { return idReferencia; }
}
