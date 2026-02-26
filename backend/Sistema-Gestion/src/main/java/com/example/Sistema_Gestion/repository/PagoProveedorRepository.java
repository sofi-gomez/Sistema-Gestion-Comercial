package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.PagoProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PagoProveedorRepository extends JpaRepository<PagoProveedor, Long> {

    List<PagoProveedor> findByProveedorIdOrderByFechaDesc(Long proveedorId);

    /** Total pagado a un proveedor (no anulados) */
    @Query("SELECT COALESCE(SUM(p.importe), 0) FROM PagoProveedor p WHERE p.proveedor.id = :proveedorId AND p.anulado = false")
    BigDecimal totalPagadoPorProveedor(@Param("proveedorId") Long proveedorId);
}
