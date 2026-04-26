package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.AjusteStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AjusteStockRepository extends JpaRepository<AjusteStock, Long> {
    List<AjusteStock> findByProductoIdOrderByFechaDesc(Long productoId);
}
