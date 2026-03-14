package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.repository.MovimientoTesoreriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TesoreriaService {

    private final MovimientoTesoreriaRepository movimientoRepository;

    public TesoreriaService(MovimientoTesoreriaRepository movimientoRepository) {
        this.movimientoRepository = movimientoRepository;
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
    public Optional<MovimientoTesoreria> marcarComoCobrado(Long id) {
        return movimientoRepository.findById(id).map(movimiento -> {
            movimiento.setCobrado(true);
            return movimientoRepository.save(movimiento);
        });
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

        // Cheques en cartera (no cobrados, no anulados)
        List<MovimientoTesoreria> cheques = todos.stream()
                .filter(m -> m.getAnulado() != null && !m.getAnulado())
                .filter(m -> !m.getCobrado())
                .filter(m -> "CHEQUE".equalsIgnoreCase(m.getMedioPago())
                        || "CHEQUE_ELECTRONICO".equalsIgnoreCase(m.getMedioPago()))
                .toList();

        BigDecimal totalCheques = cheques.stream()
                .map(m -> m.getImporte() != null ? m.getImporte() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Urgentes (Rojo): Vencen en 7 días o menos, o ya vencidos
        List<MovimientoTesoreria> urgentes = cheques.stream()
                .filter(m -> m.getFechaVencimiento() != null && !m.getFechaVencimiento().isAfter(hoy.plusDays(7)))
                .toList();

        // Disponibles (Verde): Fecha de cobro hoy o pasada, pero SIN urgencia roja
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