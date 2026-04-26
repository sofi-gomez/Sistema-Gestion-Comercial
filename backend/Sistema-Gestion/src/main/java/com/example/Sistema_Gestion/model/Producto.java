package com.example.Sistema_Gestion.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "producto")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String sku;

    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "precio_costo", precision = 10, scale = 2)
    private BigDecimal precioCosto;

    @Column(name = "precio_venta", precision = 10, scale = 2)
    private BigDecimal precioVenta;

    @Column(name = "precio_costo_usd", precision = 10, scale = 2)
    private BigDecimal precioCostoUSD;

    @Column(name = "precio_venta_usd", precision = 10, scale = 2)
    private BigDecimal precioVentaUSD;

    // ✅ CAMBIO CRÍTICO: De BigDecimal a Integer
    @Column(nullable = false)
    private Integer stock = 0;

    @Column(name = "unidad_medida")
    private String unidadMedida;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @Column(name = "porcentaje_iva", precision = 10, scale = 2)
    private BigDecimal porcentajeIva = BigDecimal.ZERO;

    @Column(name = "porcentaje_utilidad", precision = 10, scale = 2)
    private BigDecimal porcentajeUtilidad = BigDecimal.ZERO;

    // =================== GETTERS Y SETTERS ===================

    public BigDecimal getPorcentajeIva() {
        return porcentajeIva;
    }

    public void setPorcentajeIva(BigDecimal porcentajeIva) {
        this.porcentajeIva = porcentajeIva;
    }

    public BigDecimal getPorcentajeUtilidad() {
        return porcentajeUtilidad;
    }

    public void setPorcentajeUtilidad(BigDecimal porcentajeUtilidad) {
        this.porcentajeUtilidad = porcentajeUtilidad;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecioCosto() {
        return precioCosto;
    }

    public void setPrecioCosto(BigDecimal precioCosto) {
        this.precioCosto = precioCosto;
    }

    public BigDecimal getPrecioVenta() {
        return precioVenta;
    }

    public void setPrecioVenta(BigDecimal precioVenta) {
        this.precioVenta = precioVenta;
    }

    public BigDecimal getPrecioCostoUSD() {
        return precioCostoUSD;
    }

    public void setPrecioCostoUSD(BigDecimal precioCostoUSD) {
        this.precioCostoUSD = precioCostoUSD;
    }

    public BigDecimal getPrecioVentaUSD() {
        return precioVentaUSD;
    }

    public void setPrecioVentaUSD(BigDecimal precioVentaUSD) {
        this.precioVentaUSD = precioVentaUSD;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(String unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDate getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(LocalDate fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }
}