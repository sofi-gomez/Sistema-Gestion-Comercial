package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.RemitoItem;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RemitoItemRepository extends JpaRepository<RemitoItem, Long> {
    List<RemitoItem> findByRemitoId(Long remitoId);

    // Agrega este método
    @Modifying
    @Transactional
    @Query("DELETE FROM RemitoItem ri WHERE ri.remito.id = :remitoId")
    void deleteByRemitoId(Long remitoId);
}

