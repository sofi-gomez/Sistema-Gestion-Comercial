package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Compra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {

    @Query("SELECT COALESCE(MAX(c.numero), 0) FROM Compra c")
    Long findMaxNumero();

    org.springframework.data.domain.Page<Compra> findByProveedorId(Long proveedorId, org.springframework.data.domain.Pageable pageable);

    List<Compra> findByProveedorIdOrderByFechaDesc(Long proveedorId);

    List<Compra> findByProveedorIdAndEstadoOrderByFechaDesc(Long proveedorId, String estado);

    @Query("SELECT COALESCE(SUM(c.total), 0) FROM Compra c WHERE c.proveedor.id = :proveedorId AND (c.moneda = 'ARS' OR c.moneda IS NULL)")
    BigDecimal findTotalCompradoARS(@Param("proveedorId") Long proveedorId);

    @Query("SELECT COALESCE(SUM(c.totalDolares), 0) FROM Compra c WHERE c.proveedor.id = :proveedorId AND c.moneda = 'USD'")
    BigDecimal findTotalCompradoUSD(@Param("proveedorId") Long proveedorId);

    List<Compra> findByProveedorIdAndFechaBetweenOrderByFechaAsc(Long proveedorId, LocalDateTime desde,
            LocalDateTime hasta);

    @Query("SELECT COALESCE(SUM(c.total), 0) FROM Compra c WHERE c.proveedor.id = :proveedorId AND c.fecha < :fecha AND (c.moneda = 'ARS' OR c.moneda IS NULL)")
    BigDecimal totalCompradoARSAntesDe(@Param("proveedorId") Long proveedorId, @Param("fecha") LocalDateTime fecha);

    @Query("SELECT COALESCE(SUM(c.totalDolares), 0) FROM Compra c WHERE c.proveedor.id = :proveedorId AND c.fecha < :fecha AND c.moneda = 'USD'")
    BigDecimal totalCompradoUSDAntesDe(@Param("proveedorId") Long proveedorId, @Param("fecha") LocalDateTime fecha);
}
