package com.example.Sistema_Gestion.dto;

import com.example.Sistema_Gestion.model.Compra;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CompraResumenDTO {
    private Long id;
    private Long numero;
    private LocalDateTime fecha;
    private ProveedorResumenDTO proveedor;
    private String proveedorNombre;
    private BigDecimal total;
    private BigDecimal subtotal;
    private BigDecimal ivaImporte;
    private BigDecimal porcentajeIva;
    private Boolean incluyeIva;
    private BigDecimal descuentoImporte;
    private String estado;
    private String moneda;
    private String anotaciones;
    private java.util.List<CompraItemDTO> items;

    public CompraResumenDTO() {}

    public CompraResumenDTO(Compra compra) {
        this.id = compra.getId();
        this.numero = compra.getNumero();
        this.fecha = compra.getFecha();
        this.proveedor = new ProveedorResumenDTO(compra.getProveedor());
        this.proveedorNombre = (compra.getProveedor() != null) ? compra.getProveedor().getNombre() : "Desconocido";
        this.total = compra.getTotal();
        this.subtotal = compra.getSubtotal();
        this.ivaImporte = compra.getIvaImporte();
        this.porcentajeIva = compra.getPorcentajeIva();
        this.incluyeIva = compra.getIncluyeIva();
        this.descuentoImporte = compra.getDescuentoImporte();
        this.estado = compra.getEstado();
        this.moneda = compra.getMoneda();
        this.anotaciones = compra.getAnotaciones();
        this.items = (compra.getItems() != null) ? 
            compra.getItems().stream().map(CompraItemDTO::new).collect(java.util.stream.Collectors.toList()) : 
            new java.util.ArrayList<>();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getNumero() { return numero; }
    public void setNumero(Long numero) { this.numero = numero; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public ProveedorResumenDTO getProveedor() { return proveedor; }
    public void setProveedor(ProveedorResumenDTO proveedor) { this.proveedor = proveedor; }
    public String getProveedorNombre() { return proveedorNombre; }
    public void setProveedorNombre(String proveedorNombre) { this.proveedorNombre = proveedorNombre; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getIvaImporte() { return ivaImporte; }
    public void setIvaImporte(BigDecimal ivaImporte) { this.ivaImporte = ivaImporte; }
    public BigDecimal getPorcentajeIva() { return porcentajeIva; }
    public void setPorcentajeIva(BigDecimal porcentajeIva) { this.porcentajeIva = porcentajeIva; }
    public Boolean getIncluyeIva() { return incluyeIva; }
    public void setIncluyeIva(Boolean incluyeIva) { this.incluyeIva = incluyeIva; }
    public BigDecimal getDescuentoImporte() { return descuentoImporte; }
    public void setDescuentoImporte(BigDecimal descuentoImporte) { this.descuentoImporte = descuentoImporte; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }
    public String getAnotaciones() { return anotaciones; }
    public void setAnotaciones(String anotaciones) { this.anotaciones = anotaciones; }
    public java.util.List<CompraItemDTO> getItems() { return items; }
    public void setItems(java.util.List<CompraItemDTO> items) { this.items = items; }
}
