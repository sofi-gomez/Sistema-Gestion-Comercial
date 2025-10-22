package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.CompraItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CompraItemRepository extends JpaRepository<CompraItem, Long> {
    List<CompraItem> findByCompraId(Long compraId);
}

