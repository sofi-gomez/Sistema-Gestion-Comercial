package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Remito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RemitoRepository extends JpaRepository<Remito, Long> {
    @Query("SELECT COALESCE(MAX(r.numero), 0) FROM Remito r")
    Long findMaxNumero();
}
