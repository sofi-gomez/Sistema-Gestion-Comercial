package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Nota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface NotaProveedorRepository extends JpaRepository<Nota, Long> {

    @Query("SELECT MAX(n.numero) FROM Nota n")
    Long findMaxNumero();

    List<Nota> findByProveedorIdAndEstadoNotOrderByFechaDescCreatedAtDesc(Long proveedorId, Nota.EstadoNota estado);

    @Query("SELECT COALESCE(SUM(n.monto), 0) FROM Nota n WHERE n.proveedor.id = :id AND n.tipo = 'CREDITO' AND n.estado != 'ANULADA' AND n.moneda = 'ARS'")
    BigDecimal totalCreditosARSPorProveedor(@Param("id") Long proveedorId);

    @Query("SELECT COALESCE(SUM(n.monto), 0) FROM Nota n WHERE n.proveedor.id = :id AND n.tipo = 'CREDITO' AND n.estado != 'ANULADA' AND n.moneda = 'USD'")
    BigDecimal totalCreditosUSDPorProveedor(@Param("id") Long proveedorId);
}
