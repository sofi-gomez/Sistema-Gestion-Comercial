package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Venta;
import com.example.Sistema_Gestion.model.VentaItem;
import com.example.Sistema_Gestion.repository.VentaItemRepository;
import com.example.Sistema_Gestion.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final VentaItemRepository ventaItemRepository;
    private final ProductoService productoService;

    public VentaService(VentaRepository ventaRepository,
                        VentaItemRepository ventaItemRepository,
                        ProductoService productoService) {
        this.ventaRepository = ventaRepository;
        this.ventaItemRepository = ventaItemRepository;
        this.productoService = productoService;
    }

    @Transactional
    public Venta registrarVenta(Venta venta) {
        Long numero = ventaRepository.findMaxNumeroInterno() != null ? ventaRepository.findMaxNumeroInterno() + 1 : 1L;
        venta.setNumeroInterno(numero);

        Venta savedVenta = ventaRepository.save(venta);

        for (VentaItem item : venta.getItems()) {
            item.setVenta(savedVenta);
            productoService.disminuirStock(item.getProducto().getId(), item.getCantidad().doubleValue());
            ventaItemRepository.save(item);
        }

        return savedVenta;
    }
}

