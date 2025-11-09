package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Venta;
import com.example.Sistema_Gestion.model.VentaItem;
import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final ProductoService productoService;
    private final TesoreriaService tesoreriaService;

    public VentaService(VentaRepository ventaRepository,
                        ProductoService productoService,
                        TesoreriaService tesoreriaService) {
        this.ventaRepository = ventaRepository;
        this.productoService = productoService;
        this.tesoreriaService = tesoreriaService;
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

        // 4) disminuir stock
        if (saved.getItems() != null) {
            for (VentaItem it : saved.getItems()) {
                productoService.disminuirStock(it.getProducto().getId(), it.getCantidad().doubleValue());
            }
        }

        // 5) REGISTRAR MOVIMIENTO AUTOMÁTICO EN TESORERÍA
        String medioPago = venta.getMedioPago() != null ? venta.getMedioPago() : "EFECTIVO";
        registrarMovimientoTesoreria(saved, medioPago);

        return saved;
    }

    private void registrarMovimientoTesoreria(Venta venta, String medioPagoVenta) {
        MovimientoTesoreria movimiento = new MovimientoTesoreria();

        // Usar los métodos helper para los enums
        movimiento.setTipoEnum(MovimientoTesoreria.TipoMovimiento.INGRESO);

        // Convertir string a enum usando el método helper
        try {
            MovimientoTesoreria.MedioPago medioPagoEnum = MovimientoTesoreria.MedioPago.valueOf(medioPagoVenta);
            movimiento.setMedioPagoEnum(medioPagoEnum);
        } catch (IllegalArgumentException e) {
            movimiento.setMedioPagoEnum(MovimientoTesoreria.MedioPago.EFECTIVO);
        }

        movimiento.setImporte(venta.getTotal());
        movimiento.setReferencia("Venta #" + venta.getNumeroInterno());
        movimiento.setDescripcion("Ingreso por venta de productos");
        movimiento.setFecha(LocalDateTime.now());

        tesoreriaService.registrarMovimiento(movimiento);
    }

    public List<Venta> listarTodos() {
        return ventaRepository.findAll();
    }

    public Optional<Venta> buscarPorId(Long id) {
        return ventaRepository.findById(id);
    }
}