package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.PagoProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PagoProveedorRepository extends JpaRepository<PagoProveedor, Long> {

    List<PagoProveedor> findByProveedorIdOrderByFechaDesc(Long proveedorId);

    @Query("SELECT COALESCE(SUM(p.importe), 0) FROM PagoProveedor p WHERE p.proveedor.id = :proveedorId AND p.anulado = false AND p.moneda = 'ARS'")
    BigDecimal totalPagadoARSPorProveedor(@Param("proveedorId") Long proveedorId);

    @Query("SELECT COALESCE(SUM(p.importeDolares), 0) FROM PagoProveedor p WHERE p.proveedor.id = :proveedorId AND p.anulado = false AND p.moneda = 'USD'")
    BigDecimal totalPagadoUSDPorProveedor(@Param("proveedorId") Long proveedorId);

    List<PagoProveedor> findByProveedorIdAndFechaBetweenOrderByFechaAsc(Long proveedorId, LocalDate desde,
            LocalDate hasta);

    @Query("SELECT COALESCE(SUM(p.importe), 0) FROM PagoProveedor p WHERE p.proveedor.id = :proveedorId AND p.anulado = false AND p.fecha < :fecha AND p.moneda = 'ARS'")
    BigDecimal totalPagadoARSAntesDe(@Param("proveedorId") Long proveedorId, @Param("fecha") LocalDate fecha);

    @Query("SELECT COALESCE(SUM(p.importeDolares), 0) FROM PagoProveedor p WHERE p.proveedor.id = :proveedorId AND p.anulado = false AND p.fecha < :fecha AND p.moneda = 'USD'")
    BigDecimal totalPagadoUSDAntesDe(@Param("proveedorId") Long proveedorId, @Param("fecha") LocalDate fecha);
}
