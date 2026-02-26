package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.PagoProveedorCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PagoProveedorCompraRepository extends JpaRepository<PagoProveedorCompra, Long> {

    List<PagoProveedorCompra> findByCompraId(Long compraId);

    /** Suma de lo pagado sobre una compra específica */
    @Query("SELECT COALESCE(SUM(pc.importe), 0) FROM PagoProveedorCompra pc WHERE pc.compra.id = :compraId AND pc.pagoProveedor.anulado = false")
    BigDecimal totalPagadoPorCompra(@Param("compraId") Long compraId);
}
