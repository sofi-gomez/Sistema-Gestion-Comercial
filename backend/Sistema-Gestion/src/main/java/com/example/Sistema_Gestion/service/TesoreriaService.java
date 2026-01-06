package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.repository.MovimientoTesoreriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
                        ahora.plusDays(dias)
                );
    }

    @Transactional
    public void anularMovimientoPorVentaId(Long ventaId) {
        List<MovimientoTesoreria> movimientos = movimientoRepository.findByVentaId(ventaId);
        for (MovimientoTesoreria mov : movimientos) {
            mov.setAnulado(true);
            movimientoRepository.save(mov);
        }
    }

    public List<MovimientoTesoreria> buscarPorVentaId(Long ventaId) {
        return movimientoRepository.findByVentaId(ventaId);
    }
}