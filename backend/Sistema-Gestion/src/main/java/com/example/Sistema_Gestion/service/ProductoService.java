package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Producto;
import com.example.Sistema_Gestion.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> buscarPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto guardar(Producto producto) {
        return productoRepository.save(producto);
    }

    public void eliminar(Long id) {
        productoRepository.deleteById(id);
    }

    @Transactional
    public boolean descontarStock(Long productoId, Integer cantidad) {
        return productoRepository.findById(productoId).map(producto -> {
            Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;

            if (stockActual >= cantidad) {
                producto.setStock(stockActual - cantidad);
                productoRepository.save(producto);
                return true;
            }
            return false;
        }).orElse(false);
    }

    @Transactional
    public void aumentarStock(Long productoId, Integer cantidad) {
        productoRepository.findById(productoId).ifPresent(producto -> {
            Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
            producto.setStock(stockActual + cantidad);
            productoRepository.save(producto);
        });
    }

    public boolean tieneStockSuficiente(Long productoId, Integer cantidadRequerida) {
        return productoRepository.findById(productoId)
                .map(producto -> {
                    Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
                    return stockActual >= cantidadRequerida;
                })
                .orElse(false);
    }
}