package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.CobroRemito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CobroRemitoRepository extends JpaRepository<CobroRemito, Long> {

    List<CobroRemito> findByRemitoId(Long remitoId);

    List<CobroRemito> findByCobroId(Long cobroId);

    /** Suma de lo ya cobrado sobre un remito específico */
    @Query("SELECT COALESCE(SUM(cr.importe), 0) FROM CobroRemito cr WHERE cr.remito.id = :remitoId AND cr.cobro.anulado = false")
    BigDecimal totalCobradoPorRemito(@Param("remitoId") Long remitoId);
}
