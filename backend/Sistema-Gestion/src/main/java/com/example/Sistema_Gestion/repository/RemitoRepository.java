package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.model.Remito.EstadoRemito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RemitoRepository extends JpaRepository<Remito, Long> {

    @Query("SELECT COALESCE(MAX(r.numero), 0) FROM Remito r")
    Long findMaxNumero();

    List<Remito> findByEstadoOrderByFechaDesc(EstadoRemito estado);

    List<Remito> findByClienteIdOrderByFechaDesc(Long clienteId);

    List<Remito> findByClienteIdAndEstadoOrderByFechaDesc(Long clienteId, EstadoRemito estado);

    @Query("SELECT COALESCE(SUM(r.total), 0) FROM Remito r WHERE r.cliente.id = :clienteId AND r.estado IN ('VALORIZADO', 'COBRADO')")
    java.math.BigDecimal totalContabilizadoPorCliente(@Param("clienteId") Long clienteId);

    @Query("SELECT COALESCE(SUM(r.total), 0) FROM Remito r WHERE r.cliente.id = :clienteId AND r.estado = 'VALORIZADO'")
    java.math.BigDecimal totalValorizadoPorClientePendiente(@Param("clienteId") Long clienteId);
}
