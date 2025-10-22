package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.VentaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VentaItemRepository extends JpaRepository<VentaItem, Long> {
    List<VentaItem> findByVentaId(Long ventaId);
}
