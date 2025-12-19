package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MovimientoTesoreriaRepository
        extends JpaRepository<MovimientoTesoreria, Long> {

    // Ya existente
    List<MovimientoTesoreria> findByFechaBetween(
            LocalDateTime desde,
            LocalDateTime hasta
    );

    // Ya existente
    List<MovimientoTesoreria> findByMedioPagoAndFechaVencimientoBetween(
            String medioPago,
            LocalDateTime desde,
            LocalDateTime hasta
    );

    // Ya existente
    List<MovimientoTesoreria> findByMedioPagoAndFechaVencimientoBefore(
            String medioPago,
            LocalDateTime fecha
    );

    // NUEVO: buscar movimientos por ID de venta
    List<MovimientoTesoreria> findByVentaId(Long ventaId);
}