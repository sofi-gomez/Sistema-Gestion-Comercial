package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Compra;
import com.example.Sistema_Gestion.model.CompraItem;
import com.example.Sistema_Gestion.repository.CompraItemRepository;
import com.example.Sistema_Gestion.repository.CompraRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompraService {

    private final CompraRepository compraRepository;
    private final CompraItemRepository compraItemRepository;
    private final ProductoService productoService;

    public CompraService(CompraRepository compraRepository,
                         CompraItemRepository compraItemRepository,
                         ProductoService productoService) {
        this.compraRepository = compraRepository;
        this.compraItemRepository = compraItemRepository;
        this.productoService = productoService;
    }

    @Transactional
    public Compra registrarCompra(Compra compra) {
        // Generar número secuencial
        Long numero = compraRepository.findMaxNumero() != null ? compraRepository.findMaxNumero() + 1 : 1L;
        compra.setNumero(numero);

        Compra savedCompra = compraRepository.save(compra);

        for (CompraItem item : compra.getItems()) {
            item.setCompra(savedCompra);
            productoService.aumentarStock(item.getProducto().getId(), item.getCantidad().doubleValue());
            compraItemRepository.save(item);
        }

        return savedCompra;
    }
}

