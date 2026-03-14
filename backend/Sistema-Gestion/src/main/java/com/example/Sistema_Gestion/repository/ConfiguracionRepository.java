package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Configuracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracionRepository extends JpaRepository<Configuracion, Long> {
    Optional<Configuracion> findFirstByOrderByIdAsc();
}
