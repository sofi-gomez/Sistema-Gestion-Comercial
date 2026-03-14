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

    List<Compra> findByProveedorIdOrderByFechaDesc(Long proveedorId);

    List<Compra> findByProveedorIdAndEstadoOrderByFechaDesc(Long proveedorId, String estado);

    /** Total comprado a un proveedor (suma de todos sus remitos de compra) */
    @Query("SELECT COALESCE(SUM(c.total), 0) FROM Compra c WHERE c.proveedor.id = :proveedorId")
    BigDecimal findTotalCompradoPorProveedor(@Param("proveedorId") Long proveedorId);

    List<Compra> findByProveedorIdAndFechaBetweenOrderByFechaAsc(Long proveedorId, LocalDateTime desde,
            LocalDateTime hasta);

    @Query("SELECT COALESCE(SUM(c.total), 0) FROM Compra c WHERE c.proveedor.id = :proveedorId AND c.fecha < :fecha")
    BigDecimal totalCompradoAntesDe(@Param("proveedorId") Long proveedorId, @Param("fecha") LocalDateTime fecha);
}
