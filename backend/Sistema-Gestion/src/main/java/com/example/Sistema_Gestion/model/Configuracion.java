package com.example.Sistema_Gestion.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "configuracion")
public class Configuracion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombreEmpresa;
    private String cuit;
    private String direccion;
    private String telefono;

    @Column(precision = 19, scale = 4)
    private BigDecimal cotizacionDolar;

    private String monedaPrincipal; // "ARS" o "USD"

    // Configuración de alertas
    private Integer stockMinimoGlobal = 5;

    @Column(precision = 10, scale = 2)
    private BigDecimal porcentajeIvaDefault = new BigDecimal("21.00");

    // Metadata
    private String version = "1.0.0";

    // Getters and Setters
    public BigDecimal getPorcentajeIvaDefault() {
        return porcentajeIvaDefault;
    }

    public void setPorcentajeIvaDefault(BigDecimal porcentajeIvaDefault) {
        this.porcentajeIvaDefault = porcentajeIvaDefault;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombreEmpresa() {
        return nombreEmpresa;
    }

    public void setNombreEmpresa(String nombreEmpresa) {
        this.nombreEmpresa = nombreEmpresa;
    }

    public String getCuit() {
        return cuit;
    }

    public void setCuit(String cuit) {
        this.cuit = cuit;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public BigDecimal getCotizacionDolar() {
        return cotizacionDolar;
    }

    public void setCotizacionDolar(BigDecimal cotizacionDolar) {
        this.cotizacionDolar = cotizacionDolar;
    }

    public String getMonedaPrincipal() {
        return monedaPrincipal;
    }

    public void setMonedaPrincipal(String monedaPrincipal) {
        this.monedaPrincipal = monedaPrincipal;
    }

    public Integer getStockMinimoGlobal() {
        return stockMinimoGlobal;
    }

    public void setStockMinimoGlobal(Integer stockMinimoGlobal) {
        this.stockMinimoGlobal = stockMinimoGlobal;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }
}
