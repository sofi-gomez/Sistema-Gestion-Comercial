package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Venta;
import com.example.Sistema_Gestion.model.VentaItem;
import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
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

        // 5) REGISTRAR MOVIMIENTO AUTOMÁTICO EN TESORERÍA CON DATOS DE CHEQUE
        String medioPago = venta.getMedioPago() != null ? venta.getMedioPago() : "EFECTIVO";
        registrarMovimientoTesoreria(saved, medioPago);

        return saved;
    }

    private void registrarMovimientoTesoreria(Venta venta, String medioPagoVenta) {
        MovimientoTesoreria movimiento = new MovimientoTesoreria();

        // Configurar tipo de movimiento
        movimiento.setTipoEnum(MovimientoTesoreria.TipoMovimiento.INGRESO);

        // Configurar medio de pago
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
        movimiento.setVentaId(venta.getId()); // Guardar referencia a la venta

        // ✅ TRANSFERIR DATOS DE CHEQUE SI APLICA
        if (medioPagoVenta.contains("CHEQUE") && venta.getChequeBanco() != null) {
            // Usar los getters de Venta (con prefijo "cheque")
            // y los setters de MovimientoTesoreria (sin prefijo "cheque")
            movimiento.setBanco(venta.getChequeBanco());
            movimiento.setNumeroCheque(venta.getChequeNumero());
            movimiento.setLibrador(venta.getChequeLibrador());
            movimiento.setFechaEmision(venta.getChequeFechaEmision());
            movimiento.setFechaCobro(venta.getChequeFechaCobro());
            movimiento.setFechaVencimiento(venta.getChequeFechaVencimiento());

            // Setear tipo de cheque basado en el medio de pago
            if (medioPagoVenta.equals("CHEQUE_ELECTRONICO")) {
                movimiento.setTipoChequeEnum(MovimientoTesoreria.TipoCheque.ELECTRONICO);
            } else {
                movimiento.setTipoChequeEnum(MovimientoTesoreria.TipoCheque.FISICO);
            }
        }

        tesoreriaService.registrarMovimiento(movimiento);
    }

    public List<Venta> listarTodos() {
        return ventaRepository.findAll();
    }

    public Optional<Venta> buscarPorId(Long id) {
        return ventaRepository.findById(id);
    }

    @Transactional
    public Optional<Venta> actualizarVenta(Long id, Venta ventaActualizada) {
        return ventaRepository.findById(id).map(ventaExistente -> {
            // Actualizar campos básicos
            ventaExistente.setNombreCliente(ventaActualizada.getNombreCliente());
            ventaExistente.setDescripcion(ventaActualizada.getDescripcion());
            ventaExistente.setMedioPago(ventaActualizada.getMedioPago());
            ventaExistente.setEstado(ventaActualizada.getEstado());
            ventaExistente.setTotal(ventaActualizada.getTotal());

            // Actualizar datos del cheque si aplica
            ventaExistente.setChequeBanco(ventaActualizada.getChequeBanco());
            ventaExistente.setChequeNumero(ventaActualizada.getChequeNumero());
            ventaExistente.setChequeLibrador(ventaActualizada.getChequeLibrador());
            ventaExistente.setChequeFechaEmision(ventaActualizada.getChequeFechaEmision());
            ventaExistente.setChequeFechaCobro(ventaActualizada.getChequeFechaCobro());
            ventaExistente.setChequeFechaVencimiento(ventaActualizada.getChequeFechaVencimiento());

            // Actualizar items (eliminar los viejos y agregar los nuevos)
            ventaExistente.getItems().clear();
            if (ventaActualizada.getItems() != null) {
                for (VentaItem item : ventaActualizada.getItems()) {
                    item.setVenta(ventaExistente);
                    ventaExistente.getItems().add(item);
                }
            }

            Venta ventaGuardada = ventaRepository.save(ventaExistente);

            // ✅ ACTUALIZAR MOVIMIENTO DE TESORERÍA ASOCIADO
            actualizarMovimientoTesoreria(ventaGuardada);

            return ventaGuardada;
        });
    }

    private void actualizarMovimientoTesoreria(Venta venta) {
        // Buscar el movimiento asociado a esta venta
        List<MovimientoTesoreria> movimientos = tesoreriaService.buscarPorVentaId(venta.getId());

        if (!movimientos.isEmpty()) {
            MovimientoTesoreria movimiento = movimientos.get(0);

            // Actualizar datos básicos del movimiento
            movimiento.setImporte(venta.getTotal());
            movimiento.setReferencia("Venta #" + venta.getNumeroInterno());

            // Actualizar medio de pago
            String medioPago = venta.getMedioPago() != null ? venta.getMedioPago() : "EFECTIVO";
            try {
                MovimientoTesoreria.MedioPago medioPagoEnum = MovimientoTesoreria.MedioPago.valueOf(medioPago);
                movimiento.setMedioPagoEnum(medioPagoEnum);
            } catch (IllegalArgumentException e) {
                movimiento.setMedioPagoEnum(MovimientoTesoreria.MedioPago.EFECTIVO);
            }

            // Actualizar datos del cheque si aplica
            if (medioPago.contains("CHEQUE") && venta.getChequeBanco() != null) {
                movimiento.setBanco(venta.getChequeBanco());
                movimiento.setNumeroCheque(venta.getChequeNumero());
                movimiento.setLibrador(venta.getChequeLibrador());
                movimiento.setFechaEmision(venta.getChequeFechaEmision());
                movimiento.setFechaCobro(venta.getChequeFechaCobro());
                movimiento.setFechaVencimiento(venta.getChequeFechaVencimiento());

                // Setear tipo de cheque basado en el medio de pago
                if (medioPago.equals("CHEQUE_ELECTRONICO")) {
                    movimiento.setTipoChequeEnum(MovimientoTesoreria.TipoCheque.ELECTRONICO);
                } else {
                    movimiento.setTipoChequeEnum(MovimientoTesoreria.TipoCheque.FISICO);
                }
            } else {
                // Si ya no es cheque, limpiar los datos del cheque
                movimiento.setBanco(null);
                movimiento.setNumeroCheque(null);
                movimiento.setLibrador(null);
                movimiento.setFechaEmision(null);
                movimiento.setFechaCobro(null);
                movimiento.setFechaVencimiento(null);
                movimiento.setTipoCheque(null);
            }

            tesoreriaService.registrarMovimiento(movimiento);
        }
    }

    @Transactional
    public boolean eliminarVenta(Long id) {
        if (ventaRepository.existsById(id)) {
            ventaRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean anularVenta(Long id) {
        return ventaRepository.findById(id).map(venta -> {
            // Marcar la venta como anulada
            venta.setAnulada(true);
            venta.setEstado("ANULADA");
            ventaRepository.save(venta);

            // Anular también el movimiento de tesorería asociado
            tesoreriaService.anularMovimientoPorVentaId(id);

            return true;
        }).orElse(false);
    }
}