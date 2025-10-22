package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDateTime;

public interface MovimientoTesoreriaRepository extends JpaRepository<MovimientoTesoreria, Long> {
    List<MovimientoTesoreria> findByFechaBetween(LocalDateTime desde, LocalDateTime hasta);
}
