package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    // añadí consultas custom si las necesitas, por ejemplo findByNombreContaining(...)
}
