package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.CobroNota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface CobroNotaRepository extends JpaRepository<CobroNota, Long> {
    
    @Query("SELECT COALESCE(SUM(cn.importe), 0) FROM CobroNota cn WHERE cn.nota.id = :notaId AND cn.cobro.anulado = false")
    BigDecimal totalCobradoPorNota(@Param("notaId") Long notaId);
}
