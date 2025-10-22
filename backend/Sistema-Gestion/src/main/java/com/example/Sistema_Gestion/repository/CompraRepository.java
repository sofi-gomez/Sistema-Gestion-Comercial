package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Compra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CompraRepository extends JpaRepository<Compra, Long> {
    @Query("SELECT COALESCE(MAX(c.numero), 0) FROM Compra c")
    Long findMaxNumero();
}

