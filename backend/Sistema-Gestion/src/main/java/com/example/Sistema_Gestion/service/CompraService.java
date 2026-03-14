package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Compra;
import com.example.Sistema_Gestion.model.CompraItem;
import com.example.Sistema_Gestion.model.PagoProveedorCompra;
import com.example.Sistema_Gestion.repository.CompraRepository;
import com.example.Sistema_Gestion.repository.PagoProveedorCompraRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CompraService {

    private final CompraRepository compraRepository;
    private final ProductoService productoService;
    private final PagoProveedorCompraRepository pagoProveedorCompraRepository;

    public CompraService(CompraRepository compraRepository,
            @Lazy ProductoService productoService,
            PagoProveedorCompraRepository pagoProveedorCompraRepository) {
        this.compraRepository = compraRepository;
        this.productoService = productoService;
        this.pagoProveedorCompraRepository = pagoProveedorCompraRepository;
    }

    @Transactional
    public Compra registrarCompra(Compra compra) {
        // Generar número secuencial
        Long numero = compraRepository.findMaxNumero() != null ? compraRepository.findMaxNumero() + 1 : 1L;
        compra.setNumero(numero);

        if (compra.getItems() != null) {
            for (CompraItem item : compra.getItems()) {
                item.setCompra(compra);
            }
        }

        Compra savedCompra = compraRepository.save(compra);

        // Actualizar stock
        if (savedCompra.getItems() != null) {
            for (CompraItem item : savedCompra.getItems()) {
                if (item.getProducto() != null && item.getCantidad() != null) {
                    productoService.aumentarStock(item.getProducto().getId(), item.getCantidad());
                }
            }
        }

        return savedCompra;
    }

    public List<Compra> listarTodas() {
        return compraRepository.findAll();
    }

    public Optional<Compra> buscarPorId(Long id) {
        return compraRepository.findById(id);
    }

    public List<Compra> listarPorProveedor(Long proveedorId) {
        return compraRepository.findByProveedorIdOrderByFechaDesc(proveedorId);
    }

    @Transactional
    public void eliminarCompra(Long id) {
        compraRepository.findById(id).ifPresent(compra -> {
            // Eliminar vínculos con pagos (integridad referencial)
            List<PagoProveedorCompra> vinculaciones = pagoProveedorCompraRepository.findByCompraId(id);
            if (!vinculaciones.isEmpty()) {
                pagoProveedorCompraRepository.deleteAll(vinculaciones);
            }

            // Revertir stock
            if (compra.getItems() != null) {
                for (CompraItem item : compra.getItems()) {
                    if (item.getProducto() != null && item.getCantidad() != null) {
                        productoService.descontarStock(item.getProducto().getId(), item.getCantidad());
                    }
                }
            }
            compraRepository.delete(compra);
        });
    }
}