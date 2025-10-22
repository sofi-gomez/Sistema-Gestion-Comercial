package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.RemitoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RemitoItemRepository extends JpaRepository<RemitoItem, Long> {
    List<RemitoItem> findByRemitoId(Long remitoId);
}

