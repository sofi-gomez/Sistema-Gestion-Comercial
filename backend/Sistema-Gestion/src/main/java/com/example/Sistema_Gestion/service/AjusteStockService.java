package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.AjusteStock;
import com.example.Sistema_Gestion.model.Producto;
import com.example.Sistema_Gestion.repository.AjusteStockRepository;
import com.example.Sistema_Gestion.repository.ProductoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AjusteStockService {

    private final AjusteStockRepository ajusteStockRepository;
    private final ProductoRepository productoRepository;

    public AjusteStockService(AjusteStockRepository ajusteStockRepository, ProductoRepository productoRepository) {
        this.ajusteStockRepository = ajusteStockRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional
    public AjusteStock ejecutarAjuste(Long productoId, Integer cantidad, String motivo) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + productoId));

        // Actualizar stock del producto
        producto.setStock(producto.getStock() + cantidad);
        productoRepository.save(producto);

        // Crear y guardar el registro de ajuste
        AjusteStock ajuste = new AjusteStock(producto, cantidad, motivo);
        return ajusteStockRepository.save(ajuste);
    }

    public List<AjusteStock> listarAjustes() {
        return ajusteStockRepository.findAll(Sort.by(Sort.Direction.DESC, "fecha"));
    }
}
