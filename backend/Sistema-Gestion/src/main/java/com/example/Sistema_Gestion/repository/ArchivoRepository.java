package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Archivo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArchivoRepository extends JpaRepository<Archivo, Long> {
    List<Archivo> findByEntidadAndEntidadId(String entidad, Long entidadId);
}
