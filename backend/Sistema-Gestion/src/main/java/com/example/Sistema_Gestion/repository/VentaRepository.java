package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    @Query("SELECT COALESCE(MAX(v.numeroInterno), 0) FROM Venta v")
    Long findMaxNumeroInterno();
}

