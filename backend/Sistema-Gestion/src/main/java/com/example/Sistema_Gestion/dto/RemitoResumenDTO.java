package com.example.Sistema_Gestion.dto;

import com.example.Sistema_Gestion.model.Remito;
import java.math.BigDecimal;
import java.time.LocalDate;

public class RemitoResumenDTO {
    private Long id;
    private Long numero;
    private LocalDate fecha;
    private ClienteResumenDTO cliente;
    private String clienteNombre;
    private BigDecimal total;
    private String estado;
    private String observaciones;
    private java.util.List<RemitoItemDTO> items;

    public RemitoResumenDTO() {}

    public RemitoResumenDTO(Remito remito) {
        this.id = remito.getId();
        this.numero = remito.getNumero();
        this.fecha = remito.getFecha();
        this.cliente = new ClienteResumenDTO(remito.getCliente());
        this.clienteNombre = (remito.getCliente() != null) ? remito.getCliente().getNombre() : remito.getClienteNombre();
        this.total = remito.getTotal();
        this.estado = (remito.getEstado() != null) ? remito.getEstado().name() : "PENDIENTE";
        this.observaciones = remito.getObservaciones();
        this.items = (remito.getItems() != null) ? 
            remito.getItems().stream().map(RemitoItemDTO::new).collect(java.util.stream.Collectors.toList()) : 
            new java.util.ArrayList<>();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getNumero() { return numero; }
    public void setNumero(Long numero) { this.numero = numero; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public ClienteResumenDTO getCliente() { return cliente; }
    public void setCliente(ClienteResumenDTO cliente) { this.cliente = cliente; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public java.util.List<RemitoItemDTO> getItems() { return items; }
    public void setItems(java.util.List<RemitoItemDTO> items) { this.items = items; }
}
