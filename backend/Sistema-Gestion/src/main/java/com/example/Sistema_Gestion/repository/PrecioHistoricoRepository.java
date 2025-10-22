package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.PrecioHistorico;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrecioHistoricoRepository extends JpaRepository<PrecioHistorico, Long> {
    List<PrecioHistorico> findByProductoIdOrderByFechaDesc(Long productoId);
}
