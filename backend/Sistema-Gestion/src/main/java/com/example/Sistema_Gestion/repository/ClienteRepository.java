package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

    public interface ClienteRepository extends JpaRepository<Cliente, Long> {
        // ejemplo: Optional<Cliente> findByDocumento(String documento);
    }

