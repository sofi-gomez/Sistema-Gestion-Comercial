package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.*;
import com.example.Sistema_Gestion.repository.*;
import com.example.Sistema_Gestion.dto.MovimientoDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio central del flujo de cobros a clientes.
 *
 * Flujo:
 * 1. Cliente llega a pagar → se crea un Cobro
 * 2. El cobro se distribuye entre uno o más remitos (CobroRemito)
 * 3. El cobro puede ser con múltiples medios (CobroMedioPago)
 * 4. Tras cada cobro se recalcula si cada remito quedó cancelado
 */
@Service
public class CobroService {

    private final CobroRepository cobroRepository;
    private final CobroRemitoRepository cobroRemitoRepository;
    private final RemitoRepository remitoRepository;
    private final RemitoService remitoService;
    private final TesoreriaService tesoreriaService;

    public CobroService(CobroRepository cobroRepository,
            CobroRemitoRepository cobroRemitoRepository,
            RemitoRepository remitoRepository,
            RemitoService remitoService,
            TesoreriaService tesoreriaService) {
        this.cobroRepository = cobroRepository;
        this.cobroRemitoRepository = cobroRemitoRepository;
        this.remitoRepository = remitoRepository;
        this.remitoService = remitoService;
        this.tesoreriaService = tesoreriaService;
    }

    /**
     * Registra un cobro completo.
     *
     * @param cobro             Entidad cobro (con cliente + fecha + observaciones)
     * @param importesPorRemito Mapa remitoId -> importe aplicado a ese remito.
     *                          La suma debe coincidir con cobro.totalCobrado.
     * @param mediosPago        Lista de medios de pago a guardar (ya construidos)
     */
    @Transactional
    public Cobro registrarCobro(
            Cobro cobro,
            Map<Long, BigDecimal> importesPorRemito,
            List<CobroMedioPago> mediosPago) {
        // 1. Calcular y validar el total
        BigDecimal sumaImportes = importesPorRemito.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        cobro.setTotalCobrado(sumaImportes);

        if (cobro.getFecha() == null) {
            cobro.setFecha(LocalDate.now());
        }

        // 2. Persistir el cobro principal
        Cobro savedCobro = cobroRepository.save(cobro);

        // 3. Distribuir el cobro entre los remitos indicados
        for (Map.Entry<Long, BigDecimal> entry : importesPorRemito.entrySet()) {
            Long remitoId = entry.getKey();
            BigDecimal importe = entry.getValue();

            Remito remito = remitoRepository.findById(remitoId)
                    .orElseThrow(() -> new RuntimeException("Remito no encontrado: " + remitoId));

            if (remito.getEstado() != Remito.EstadoRemito.VALORIZADO) {
                throw new IllegalStateException(
                        "El remito " + remitoId + " debe estar VALORIZADO para poder cobrarse");
            }

            // Registrar el importe aplicado a este remito
            CobroRemito cobroRemito = new CobroRemito();
            cobroRemito.setCobro(savedCobro);
            cobroRemito.setRemito(remito);
            cobroRemito.setImporte(importe);
            savedCobro.getRemitos().add(cobroRemito);

            // Calcular total cobrado acumulado en este remito
            BigDecimal yaCobradobAntes = cobroRemitoRepository.totalCobradoPorRemito(remitoId);
            BigDecimal totalCobradoAhora = yaCobradobAntes.add(importe);

            // Actualizar estado del remito si quedó saldado
            remitoService.actualizarEstadoPostCobro(remito, totalCobradoAhora);
        }

        // 4. Registrar los medios de pago y movimientos de tesorería
        if (mediosPago != null) {
            for (CobroMedioPago medio : mediosPago) {
                medio.setCobro(savedCobro);
                savedCobro.getMediosPago().add(medio);

                // ✅ Crear Movimiento de Tesorería automáticamente
                MovimientoTesoreria mov = new MovimientoTesoreria();
                mov.setTipo("INGRESO");
                mov.setMedioPago(medio.getMedio()); // El modelo CobroMedioPago usa String para medio
                mov.setImporte(medio.getImporte());
                mov.setFecha(savedCobro.getFecha().atStartOfDay());
                mov.setDescripcion("Cobro de Cliente: " + savedCobro.getCliente().getNombre());
                mov.setReferencia("Cobro #" + savedCobro.getId());

                // Si es cheque, copiar datos
                if ("CHEQUE".equals(medio.getMedio()) || "CHEQUE_ELECTRONICO".equals(medio.getMedio())) {
                    mov.setBanco(medio.getBanco());
                    mov.setNumeroCheque(medio.getNumeroCheque());
                    mov.setLibrador(medio.getLibrador());
                    mov.setFechaEmision(medio.getFechaEmision());
                    mov.setFechaVencimiento(medio.getFechaVenc());
                }

                tesoreriaService.registrarMovimiento(mov);
            }
        }

        return cobroRepository.save(savedCobro);
    }

    public List<Cobro> listarPorCliente(Long clienteId) {
        return cobroRepository.findByClienteIdOrderByFechaDesc(clienteId);
    }

    /**
     * Obtiene una lista unificada de movimientos (Remitos valorizados y Cobros)
     * ordenados por fecha.
     */
    public List<MovimientoDto> getMovimientos(Long clienteId) {
        List<MovimientoDto> movimientos = new ArrayList<>();

        // 1. Agregar Remitos valorizados (Debe)
        List<Remito> remitos = remitoRepository.findByClienteIdAndEstadoOrderByFechaDesc(clienteId,
                Remito.EstadoRemito.VALORIZADO);
        remitos.addAll(remitoRepository.findByClienteIdAndEstadoOrderByFechaDesc(clienteId,
                Remito.EstadoRemito.COBRADO));

        for (Remito r : remitos) {
            movimientos.add(new MovimientoDto(
                    r.getFecha(),
                    "DEBE",
                    "Remito #" + r.getNumero(),
                    r.getTotal(),
                    r.getId()));
        }

        // 2. Agregar Cobros (Haber)
        List<Cobro> cobros = cobroRepository.findByClienteIdOrderByFechaDesc(clienteId);
        for (Cobro c : cobros) {
            if (!c.getAnulado()) {
                movimientos.add(new MovimientoDto(
                        c.getFecha(),
                        "HABER",
                        c.getObservaciones() != null ? c.getObservaciones() : "Cobro recibido",
                        c.getTotalCobrado(),
                        c.getId()));
            }
        }

        // 3. Ordenar por fecha descending (más reciente primero)
        return movimientos.stream()
                .sorted(Comparator.comparing(MovimientoDto::getFecha).reversed())
                .collect(Collectors.toList());
    }

    public Optional<Cobro> buscarPorId(Long id) {
        return cobroRepository.findById(id);
    }

    /**
     * Devuelve el saldo pendiente de un cliente:
     * total de remitos (VALORIZADO o COBRADO) - total cobrado efectivamente.
     */
    public BigDecimal calcularSaldoCliente(Long clienteId) {
        BigDecimal deudaTotal = remitoRepository.totalContabilizadoPorCliente(clienteId);
        BigDecimal totalCobrado = cobroRepository.totalCobradoPorCliente(clienteId);
        return deudaTotal.subtract(totalCobrado);
    }

    @Transactional
    public boolean anularCobro(Long id) {
        return cobroRepository.findById(id).map(cobro -> {
            cobro.setAnulado(true);
            cobroRepository.save(cobro);
            // Al anular un cobro, los remitos que estaban COBRADO pueden necesitar
            // volver a VALORIZADO — se delega esa responsabilidad a un proceso manual
            // para no generar efectos en cascada inesperados
            return true;
        }).orElse(false);
    }
}
