package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Cobro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CobroRepository extends JpaRepository<Cobro, Long> {

    List<Cobro> findByClienteIdOrderByFechaDesc(Long clienteId);

    List<Cobro> findByAnulado(Boolean anulado);

    /** Total cobrado a un cliente (suma de todos los cobros no anulados) */
    @Query("SELECT COALESCE(SUM(c.totalCobrado), 0) FROM Cobro c WHERE c.cliente.id = :clienteId AND c.anulado = false")
    java.math.BigDecimal totalCobradoPorCliente(@Param("clienteId") Long clienteId);
}
