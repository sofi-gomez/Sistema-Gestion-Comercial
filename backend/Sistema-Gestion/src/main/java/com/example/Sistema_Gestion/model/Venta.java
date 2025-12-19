package com.example.Sistema_Gestion.model;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
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

    @Column(name = "anulada", nullable = false)
    private Boolean anulada = false;

    @Column(name = "medio_pago")
    private String medioPago;

    @Column(name = "nombre_cliente")
    private String nombreCliente;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // ================= CAMPOS DE CHEQUE (nullable) =================

    @Column(name = "cheque_banco")
    private String chequeBanco;

    @Column(name = "cheque_numero")
    private String chequeNumero;

    @Column(name = "cheque_librador")
    private String chequeLibrador;

    @Column(name = "cheque_fecha_emision")
    private LocalDate chequeFechaEmision;

    @Column(name = "cheque_fecha_cobro")
    private LocalDate chequeFechaCobro;

    @Column(name = "cheque_fecha_vencimiento")
    private LocalDate chequeFechaVencimiento;

    // ================================================================

    @OneToMany(mappedBy="venta", cascade=CascadeType.ALL, orphanRemoval=true)
    @JsonManagedReference
    private List<VentaItem> items;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist(){
        fecha = LocalDateTime.now();
        createdAt = updatedAt = LocalDateTime.now();

        // Calcular fecha de vencimiento del cheque si tiene fecha de cobro
        if (chequeFechaCobro != null && chequeFechaVencimiento == null) {
            chequeFechaVencimiento = chequeFechaCobro.plusDays(30);
        }
    }

    @PreUpdate
    public void preUpdate(){
        updatedAt = LocalDateTime.now();

        // Recalcular vencimiento si cambió la fecha de cobro
        if (chequeFechaCobro != null && chequeFechaVencimiento == null) {
            chequeFechaVencimiento = chequeFechaCobro.plusDays(30);
        }
    }

    // ================= GETTERS Y SETTERS =================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNumeroInterno() { return numeroInterno; }
    public void setNumeroInterno(Long numeroInterno) { this.numeroInterno = numeroInterno; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Boolean getAnulada() { return anulada; }
    public void setAnulada(Boolean anulada) { this.anulada = anulada; }

    public String getMedioPago() { return medioPago; }
    public void setMedioPago(String medioPago) { this.medioPago = medioPago; }

    public String getNombreCliente() { return nombreCliente; }
    public void setNombreCliente(String nombreCliente) { this.nombreCliente = nombreCliente; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    // Getters y Setters de Cheque
    public String getChequeBanco() { return chequeBanco; }
    public void setChequeBanco(String chequeBanco) { this.chequeBanco = chequeBanco; }

    public String getChequeNumero() { return chequeNumero; }
    public void setChequeNumero(String chequeNumero) { this.chequeNumero = chequeNumero; }

    public String getChequeLibrador() { return chequeLibrador; }
    public void setChequeLibrador(String chequeLibrador) { this.chequeLibrador = chequeLibrador; }

    public LocalDate getChequeFechaEmision() { return chequeFechaEmision; }
    public void setChequeFechaEmision(LocalDate chequeFechaEmision) { this.chequeFechaEmision = chequeFechaEmision; }

    public LocalDate getChequeFechaCobro() { return chequeFechaCobro; }
    public void setChequeFechaCobro(LocalDate chequeFechaCobro) { this.chequeFechaCobro = chequeFechaCobro; }

    public LocalDate getChequeFechaVencimiento() { return chequeFechaVencimiento; }
    public void setChequeFechaVencimiento(LocalDate chequeFechaVencimiento) { this.chequeFechaVencimiento = chequeFechaVencimiento; }

    public List<VentaItem> getItems() { return items; }
    public void setItems(List<VentaItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}