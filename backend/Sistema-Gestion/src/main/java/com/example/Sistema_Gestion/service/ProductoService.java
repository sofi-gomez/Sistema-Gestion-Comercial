package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Producto;
import com.example.Sistema_Gestion.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public Optional<Producto> buscarPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto guardar(Producto producto) {
        return productoRepository.save(producto);
    }

    public Producto actualizar(Long id, Producto producto) {
        Producto existente = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        existente.setNombre(producto.getNombre());
        existente.setSku(producto.getSku());
        existente.setDescripcion(producto.getDescripcion());
        existente.setPrecioCosto(producto.getPrecioCosto());
        existente.setPrecioVenta(producto.getPrecioVenta());
        existente.setStock(producto.getStock());
        existente.setUnidadMedida(producto.getUnidadMedida());
        existente.setActivo(producto.getActivo());
        existente.setFechaVencimiento(producto.getFechaVencimiento());
        return productoRepository.save(existente);
    }

    public void aumentarStock(Long productoId, Double cantidad) {
        Producto p = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        p.setStock(p.getStock().add(BigDecimal.valueOf(cantidad)));
        productoRepository.save(p);
    }

    public void disminuirStock(Long productoId, Double cantidad) {
        Producto p = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        if (p.getStock().compareTo(BigDecimal.valueOf(cantidad)) < 0) {
            throw new RuntimeException("Stock insuficiente para el producto: " + p.getNombre());
        }
        p.setStock(p.getStock().subtract(BigDecimal.valueOf(cantidad)));

        productoRepository.save(p);
    }

    public void eliminar(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Verificar si el producto tiene movimientos
        if (tieneMovimientos(id)) {
            // Eliminación lógica
            producto.setEliminado(true);
            producto.setActivo(false);
            productoRepository.save(producto);
        } else {
            // Eliminación física solo si no tiene movimientos
            productoRepository.deleteById(id);
        }
    }

    private boolean tieneMovimientos(Long productoId) {
        // Implementa esta lógica según tus relaciones
        // Por ejemplo, verificar si hay ventas, remitos, etc. con este producto
        return false; // Cambiar por la lógica real
    }

    // Modifica el método listarTodos para excluir eliminados
    public List<Producto> listarTodos() {
        return productoRepository.findByEliminadoFalse();
    }
}

