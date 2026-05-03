package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByNombre(String nombre);
    Optional<Cliente> findByDocumento(String documento);
}

