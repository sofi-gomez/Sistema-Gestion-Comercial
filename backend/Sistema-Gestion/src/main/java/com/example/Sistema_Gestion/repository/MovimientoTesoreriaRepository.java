package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MovimientoTesoreriaRepository
                extends JpaRepository<MovimientoTesoreria, Long> {

        List<MovimientoTesoreria> findByFechaBetween(
                        LocalDateTime desde,
                        LocalDateTime hasta);

        List<MovimientoTesoreria> findByMedioPagoAndFechaVencimientoBetween(
                        String medioPago,
                        LocalDateTime desde,
                        LocalDateTime hasta);

        List<MovimientoTesoreria> findByMedioPagoAndFechaVencimientoBefore(
                        String medioPago,
                        LocalDateTime fecha);

        List<MovimientoTesoreria> findByReferencia(String referencia);
}