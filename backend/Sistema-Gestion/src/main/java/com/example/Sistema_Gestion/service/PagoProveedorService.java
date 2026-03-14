package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.*;
import com.example.Sistema_Gestion.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio para gestionar pagos realizados A proveedores.
 *
 * Flujo:
 * 1. Se registra un PagoProveedor (con importe y medio de pago)
 * 2. El pago se distribuye entre una o más compras pendientes
 * 3. Se actualiza el estado de cada compra (PENDIENTE / PARCIAL / PAGADA)
 */
@Service
public class PagoProveedorService {

    private final PagoProveedorRepository pagoProveedorRepository;
    private final PagoProveedorCompraRepository pagoProveedorCompraRepository;
    private final CompraRepository compraRepository;
    private final TesoreriaService tesoreriaService;
    private final ProveedorRepository proveedorRepository;

    public PagoProveedorService(PagoProveedorRepository pagoProveedorRepository,
            PagoProveedorCompraRepository pagoProveedorCompraRepository,
            CompraRepository compraRepository,
            TesoreriaService tesoreriaService,
            ProveedorRepository proveedorRepository) {
        this.pagoProveedorRepository = pagoProveedorRepository;
        this.pagoProveedorCompraRepository = pagoProveedorCompraRepository;
        this.compraRepository = compraRepository;
        this.tesoreriaService = tesoreriaService;
        this.proveedorRepository = proveedorRepository;
    }

    /**
     * Registra un pago al proveedor, distribuyéndolo entre compras.
     *
     * @param pago              Entidad PagoProveedor (proveedor, fecha, importe,
     *                          medio)
     * @param importesPorCompra Mapa compraId -> importe aplicado a esa compra
     */
    @Transactional
    public PagoProveedor registrarPago(PagoProveedor pago, Map<Long, BigDecimal> importesPorCompra) {

        if (pago.getFecha() == null) {
            pago.setFecha(LocalDate.now());
        }

        // Calcular total del pago como suma de los importes distribuidos (solo si hay
        // distribuciones)
        if (importesPorCompra != null && !importesPorCompra.isEmpty()) {
            BigDecimal totalDistribuido = importesPorCompra.values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            pago.setImporte(totalDistribuido);
        }

        // Capturar nombre antes del save para evitar proxy Hibernate
        String nombreProveedor = "Proveedor";
        if (pago.getProveedor() != null) {
            if (pago.getProveedor().getNombre() != null && !pago.getProveedor().getNombre().isEmpty()) {
                nombreProveedor = pago.getProveedor().getNombre();
            } else if (pago.getProveedor().getId() != null) {
                nombreProveedor = proveedorRepository.findById(pago.getProveedor().getId())
                        .map(Proveedor::getNombre)
                        .orElse("Proveedor");
            }
        }

        // Persistir pago
        PagoProveedor savedPago = pagoProveedorRepository.save(pago);

        // ✅ Crear Movimiento de Tesorería automáticamente
        MovimientoTesoreria mov = new MovimientoTesoreria();
        mov.setTipo("EGRESO");
        mov.setMedioPago(savedPago.getMedio());
        mov.setImporte(savedPago.getImporte());
        mov.setFecha(savedPago.getFecha().atStartOfDay());
        mov.setDescripcion("Pago a Proveedor: " + nombreProveedor);
        mov.setReferencia("Pago #" + savedPago.getId());
        mov.setEntidad(nombreProveedor);
        tesoreriaService.registrarMovimiento(mov);

        // Distribuir entre compras
        if (importesPorCompra != null) {
            for (Map.Entry<Long, BigDecimal> entry : importesPorCompra.entrySet()) {
                Long compraId = entry.getKey();
                BigDecimal importe = entry.getValue();

                Compra compra = compraRepository.findById(compraId)
                        .orElseThrow(() -> new RuntimeException("Compra no encontrada: " + compraId));

                // Registrar el importe aplicado a esta compra
                PagoProveedorCompra pc = new PagoProveedorCompra();
                pc.setPagoProveedor(savedPago);
                pc.setCompra(compra);
                pc.setImporte(importe);
                savedPago.getCompras().add(pc);

                // Recalcular deuda de esta compra y actualizar su estado
                BigDecimal totalPagadoAntes = pagoProveedorCompraRepository.totalPagadoPorCompra(compraId);
                BigDecimal totalPagadoAhora = totalPagadoAntes.add(importe);
                actualizarEstadoCompra(compra, totalPagadoAhora);
            }
        }

        return pagoProveedorRepository.save(savedPago);
    }

    /**
     * Actualiza el estado de una compra según cuánto se ha pagado.
     * PENDIENTE → PARCIAL → PAGADA
     */
    private void actualizarEstadoCompra(Compra compra, BigDecimal totalPagado) {
        if (compra.getTotal() == null)
            return;

        int cmp = totalPagado.compareTo(compra.getTotal());
        if (cmp >= 0) {
            compra.setEstado("PAGADA");
        } else if (totalPagado.compareTo(BigDecimal.ZERO) > 0) {
            compra.setEstado("PARCIAL");
        } else {
            compra.setEstado("PENDIENTE");
        }
        compraRepository.save(compra);
    }

    public List<PagoProveedor> listarPorProveedor(Long proveedorId) {
        return pagoProveedorRepository.findByProveedorIdOrderByFechaDesc(proveedorId);
    }

    public Optional<PagoProveedor> buscarPorId(Long id) {
        return pagoProveedorRepository.findById(id);
    }

    /**
     * Calcula la deuda actual de un proveedor:
     * total de compras - total pagado.
     */
    public BigDecimal calcularDeudaProveedor(Long proveedorId) {
        BigDecimal totalComprado = compraRepository.findTotalCompradoPorProveedor(proveedorId);
        BigDecimal totalPagado = pagoProveedorRepository.totalPagadoPorProveedor(proveedorId);
        totalComprado = totalComprado != null ? totalComprado : BigDecimal.ZERO;
        totalPagado = totalPagado != null ? totalPagado : BigDecimal.ZERO;
        return totalComprado.subtract(totalPagado);
    }

    @Transactional
    public boolean anularPago(Long id) {
        return pagoProveedorRepository.findById(id).map(pago -> {
            pago.setAnulado(true);
            pagoProveedorRepository.save(pago);
            // Anular movimiento correlativo en Tesorería
            tesoreriaService.anularPorReferencia("Pago #" + pago.getId());
            return true;
        }).orElse(false);
    }
}
