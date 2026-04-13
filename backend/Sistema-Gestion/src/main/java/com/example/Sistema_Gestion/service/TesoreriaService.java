package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.repository.MovimientoTesoreriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
@Service
public class TesoreriaService {

    private final MovimientoTesoreriaRepository movimientoRepository;
    private final CobroService cobroService;
    private final PagoProveedorService pagoProveedorService;

    public TesoreriaService(
            MovimientoTesoreriaRepository movimientoRepository,
            @org.springframework.context.annotation.Lazy CobroService cobroService,
            @org.springframework.context.annotation.Lazy PagoProveedorService pagoProveedorService) {
        this.movimientoRepository = movimientoRepository;
        this.cobroService = cobroService;
        this.pagoProveedorService = pagoProveedorService;
    }

    public MovimientoTesoreria registrarMovimiento(MovimientoTesoreria movimiento) {
        return movimientoRepository.save(movimiento);
    }

    public List<MovimientoTesoreria> listarTodos() {
        return movimientoRepository.findAll();
    }

    public List<MovimientoTesoreria> listarPorRango(LocalDateTime desde, LocalDateTime hasta) {
        return movimientoRepository.findByFechaBetween(desde, hasta);
    }

    public List<MovimientoTesoreria> chequesProximosAVencer(int dias) {
        LocalDateTime ahora = LocalDateTime.now();
        return movimientoRepository
                .findByMedioPagoAndFechaVencimientoBetween(
                        MovimientoTesoreria.MedioPago.CHEQUE.name(),
                        ahora,
                        ahora.plusDays(dias));
    }

    public Optional<MovimientoTesoreria> buscarPorId(Long id) {
        return movimientoRepository.findById(id);
    }

    public List<MovimientoTesoreria> buscarPorReferencia(String referencia) {
        return movimientoRepository.findByReferencia(referencia);
    }

    @Transactional
    public Optional<MovimientoTesoreria> actualizarMovimiento(Long id, MovimientoTesoreria movimientoActualizado) {
        return movimientoRepository.findById(id).map(movimientoExistente -> {
            // Actualizar campos básicos
            movimientoExistente.setTipo(movimientoActualizado.getTipo());
            movimientoExistente.setMedioPago(movimientoActualizado.getMedioPago());
            movimientoExistente.setImporte(movimientoActualizado.getImporte());
            movimientoExistente.setReferencia(movimientoActualizado.getReferencia());
            movimientoExistente.setDescripcion(movimientoActualizado.getDescripcion());
            movimientoExistente.setEntidad(movimientoActualizado.getEntidad());

            // Actualizar datos de cheque si aplica
            movimientoExistente.setBanco(movimientoActualizado.getBanco());
            movimientoExistente.setNumeroCheque(movimientoActualizado.getNumeroCheque());
            movimientoExistente.setLibrador(movimientoActualizado.getLibrador());
            movimientoExistente.setFechaEmision(movimientoActualizado.getFechaEmision());
            movimientoExistente.setFechaCobro(movimientoActualizado.getFechaCobro());
            movimientoExistente.setFechaVencimiento(movimientoActualizado.getFechaVencimiento());

            return movimientoRepository.save(movimientoExistente);
        });
    }

    @Transactional
    public void anularPorReferencia(String referencia) {
        List<MovimientoTesoreria> movs = movimientoRepository.findByReferencia(referencia);
        for (MovimientoTesoreria m : movs) {
            m.setAnulado(true);
            movimientoRepository.save(m);
        }
    }

    @Transactional
    public boolean anularMovimiento(Long id) {
        return movimientoRepository.findById(id).map(m -> {
            if (Boolean.TRUE.equals(m.getAnulado())) {
                return true;
            }

            m.setAnulado(true);
            movimientoRepository.save(m);

            // Sincronizar con el origen (Cobro o Pago) según la referencia
            String ref = m.getReferencia();
            System.out.println("DEBUG: Anulando movimiento " + m.getId() + " con ref: '" + ref + "'");
            
            if (ref != null) {
                if (ref.contains("Cobro #")) {
                    try {
                        String idPart = ref.split("#")[1].trim();
                        Long cobroId = Long.parseLong(idPart);
                        System.out.println("DEBUG: Delegando a CobroService.anularCobro(" + cobroId + ")");
                        cobroService.anularCobro(cobroId);
                    } catch (Exception e) {
                        System.err.println("DEBUG ERROR: Fallo al parsear ID de Cobro en '" + ref + "': " + e.getMessage());
                    }
                } else if (ref.contains("Pago #")) {
                    try {
                        String idPart = ref.split("#")[1].trim();
                        Long pagoId = Long.parseLong(idPart);
                        System.out.println("DEBUG: Delegando a PagoProveedorService.anularPago(" + pagoId + ")");
                        pagoProveedorService.anularPago(pagoId);
                    } catch (Exception e) {
                        System.err.println("DEBUG ERROR: Fallo al parsear ID de Pago en '" + ref + "': " + e.getMessage());
                    }
                }
            }

            return true;
        }).orElse(false);
    }

    @Transactional
    public Optional<MovimientoTesoreria> marcarComoCobrado(Long id) {
        return movimientoRepository.findById(id).map(movimiento -> {
            movimiento.setCobrado(true);
            return movimientoRepository.save(movimiento);
        });
    }

    /**
     * AF-12: Resumen de caja para un día concreto.
     * Retorna ingresos, egresos y saldo del día, desglosados por medio de pago.
     */
    public Map<String, Object> getResumenDia(LocalDate fecha) {
        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.atTime(23, 59, 59);

        List<MovimientoTesoreria> movsDia = movimientoRepository
                .findByFechaBetween(inicio, fin)
                .stream()
                .filter(m -> m.getAnulado() == null || !m.getAnulado())
                .toList();

        BigDecimal ingresos = movsDia.stream()
                .filter(m -> "INGRESO".equalsIgnoreCase(m.getTipo()))
                .map(m -> m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal egresos = movsDia.stream()
                .filter(m -> "EGRESO".equalsIgnoreCase(m.getTipo()))
                .map(m -> m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Detalle por medio de pago
        Map<String, BigDecimal> ingPorMedio = new LinkedHashMap<>();
        Map<String, BigDecimal> egrPorMedio = new LinkedHashMap<>();

        for (MovimientoTesoreria m : movsDia) {
            String medio = m.getMedioPago() != null ? m.getMedioPago() : "OTRO";
            BigDecimal imp = m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO;
            if ("INGRESO".equalsIgnoreCase(m.getTipo())) {
                ingPorMedio.merge(medio, imp, BigDecimal::add);
            } else {
                egrPorMedio.merge(medio, imp, BigDecimal::add);
            }
        }

        // Convertir a lista para el frontend
        List<Map<String, Object>> detalle = new ArrayList<>();
        ingPorMedio.forEach((medio, imp) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("medio", medio);
            row.put("tipo", "INGRESO");
            row.put("importe", imp);
            detalle.add(row);
        });
        egrPorMedio.forEach((medio, imp) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("medio", medio);
            row.put("tipo", "EGRESO");
            row.put("importe", imp);
            detalle.add(row);
        });

        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("fecha", fecha.toString());
        resumen.put("totalIngresos", ingresos);
        resumen.put("totalEgresos", egresos);
        resumen.put("saldoDia", ingresos.subtract(egresos));
        resumen.put("cantidadMovimientos", movsDia.size());
        resumen.put("detallePorMedio", detalle);
        return resumen;
    }

    public Map<String, Object> getResumenCaja() {
        List<MovimientoTesoreria> todos = movimientoRepository.findAll();
        LocalDate hoy = LocalDate.now();

        BigDecimal ingresos = todos.stream()
                .filter(m -> m.getAnulado() != null && !m.getAnulado() && "INGRESO".equalsIgnoreCase(m.getTipo()))
                .map(m -> m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal egresos = todos.stream()
                .filter(m -> m.getAnulado() != null && !m.getAnulado() && "EGRESO".equalsIgnoreCase(m.getTipo()))
                .map(m -> m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<MovimientoTesoreria> cheques = todos.stream()
                .filter(m -> m.getAnulado() != null && !m.getAnulado())
                .filter(m -> !m.getCobrado())
                .filter(m -> "CHEQUE".equalsIgnoreCase(m.getMedioPago())
                        || "CHEQUE_ELECTRONICO".equalsIgnoreCase(m.getMedioPago()))
                .toList();

        BigDecimal totalCheques = cheques.stream()
                .map(m -> m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<MovimientoTesoreria> urgentes = cheques.stream()
                .filter(m -> m.getFechaVencimiento() != null && !m.getFechaVencimiento().isAfter(hoy.plusDays(7)))
                .toList();

        List<MovimientoTesoreria> disponibles = cheques.stream()
                .filter(m -> m.getFechaCobro() != null && !m.getFechaCobro().isAfter(hoy))
                .filter(m -> m.getFechaVencimiento() != null && m.getFechaVencimiento().isAfter(hoy.plusDays(7)))
                .toList();

        BigDecimal urgenteImporte = urgentes.stream()
                .map(m -> m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal disponibleImporte = disponibles.stream()
                .map(m -> m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> resumen = new HashMap<>();
        resumen.put("saldoActual", ingresos.subtract(egresos));
        resumen.put("totalIngresos", ingresos);
        resumen.put("totalEgresos", egresos);
        resumen.put("totalCheques", totalCheques);
        resumen.put("chequesUrgentesCount", urgentes.size());
        resumen.put("chequesUrgentesImporte", urgenteImporte);
        resumen.put("chequesParaCobrarCount", disponibles.size());
        resumen.put("chequesParaCobrarImporte", disponibleImporte);

        return resumen;
    }
}