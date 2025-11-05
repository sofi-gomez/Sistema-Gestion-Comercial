package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Venta;
import com.example.Sistema_Gestion.model.VentaItem;
import com.example.Sistema_Gestion.repository.VentaItemRepository;
import com.example.Sistema_Gestion.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final ProductoService productoService;

    public VentaService(VentaRepository ventaRepository,
                        ProductoService productoService) {
        this.ventaRepository = ventaRepository;
        this.productoService = productoService;
    }

    @Transactional
    public Venta registrarVenta(Venta venta) {
        // 1) setear numero interno (autonumeración)
        Long max = ventaRepository.findMaxNumeroInterno();
        Long numero = (max != null && max > 0) ? max + 1 : 1L;
        venta.setNumeroInterno(numero);

        // 2) asociar items a la venta
        if (venta.getItems() != null) {
            for (VentaItem item : venta.getItems()) {
                item.setVenta(venta);
            }
        }

        // 3) guardar la venta (cascade ALL en Venta.items debe persistir los items)
        Venta saved = ventaRepository.save(venta);

        // 4) si querés disminuir stock acá (si tu ProductoService maneja BigDecimal),
        // hacelo después de saved para evitar problemas con ids.
        if (saved.getItems() != null) {
            for (VentaItem it : saved.getItems()) {
                productoService.disminuirStock(it.getProducto().getId(), it.getCantidad().doubleValue());
            }
        }

        return saved;

    }

    public List<Venta> listarTodos() {
        return ventaRepository.findAll();
    }

    public Optional<Venta> buscarPorId(Long id) {
        return ventaRepository.findById(id);
    }
}


