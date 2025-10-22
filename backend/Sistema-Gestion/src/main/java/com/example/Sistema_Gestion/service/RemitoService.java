package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.model.RemitoItem;
import com.example.Sistema_Gestion.repository.RemitoItemRepository;
import com.example.Sistema_Gestion.repository.RemitoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RemitoService {

    private final RemitoRepository remitoRepository;
    private final RemitoItemRepository remitoItemRepository;

    public RemitoService(RemitoRepository remitoRepository,
                         RemitoItemRepository remitoItemRepository) {
        this.remitoRepository = remitoRepository;
        this.remitoItemRepository = remitoItemRepository;
    }

    @Transactional
    public Remito generarRemito(Remito remito) {
        Long numero = remitoRepository.findMaxNumero() != null ? remitoRepository.findMaxNumero() + 1 : 1L;
        remito.setNumero(numero);

        Remito savedRemito = remitoRepository.save(remito);

        for (RemitoItem item : remito.getItems()) {
            item.setRemito(savedRemito);
            remitoItemRepository.save(item);
        }

        return savedRemito;
    }
}

