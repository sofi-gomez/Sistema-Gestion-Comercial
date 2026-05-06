package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Compra;
import com.example.Sistema_Gestion.model.CompraItem;
import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.model.PagoProveedorCompra;
import com.example.Sistema_Gestion.repository.CompraRepository;
import com.example.Sistema_Gestion.repository.MovimientoTesoreriaRepository;
import com.example.Sistema_Gestion.repository.PagoProveedorCompraRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class CompraService {

    private final CompraRepository compraRepository;
    private final ProductoService productoService;
    private final PagoProveedorCompraRepository pagoProveedorCompraRepository;
    private final MovimientoTesoreriaRepository movimientoTesoreriaRepository;

    public CompraService(CompraRepository compraRepository,
            @Lazy ProductoService productoService,
            PagoProveedorCompraRepository pagoProveedorCompraRepository,
            MovimientoTesoreriaRepository movimientoTesoreriaRepository) {
        this.compraRepository = compraRepository;
        this.productoService = productoService;
        this.pagoProveedorCompraRepository = pagoProveedorCompraRepository;
        this.movimientoTesoreriaRepository = movimientoTesoreriaRepository;
    }

    @Transactional
    public Compra registrarCompra(Compra compra) {
        // Generar número secuencial
        Long numero = compraRepository.findMaxNumero() != null ? compraRepository.findMaxNumero() + 1 : 1L;
        compra.setNumero(numero);

        // Estado inicial
        boolean sinPrecios = compra.getTotal() == null || compra.getTotal().compareTo(BigDecimal.ZERO) == 0;
        compra.setEstado(sinPrecios ? "PENDIENTE" : "CONFIRMADA");

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

        // NOTA: Se removió la automatización de registrar en Tesorería aquí.
        // Ahora una compra CONFIRMADA solo aumenta el stock y la cuenta corriente.

        return savedCompra;
    }

    @Transactional
    public Compra actualizarCompra(Long id, Compra compraActualizada) {
        return compraRepository.findById(id).map(compraExistente -> {
            // Revertir stock viejo (usamos forzar para permitir negativos técnicos en reversión)
            if (compraExistente.getItems() != null) {
                for (CompraItem item : compraExistente.getItems()) {
                    productoService.forzarDescontarStock(item.getProducto().getId(), item.getCantidad());
                }
            }

            // Actualizar campos
            compraExistente.setFecha(compraActualizada.getFecha());
            compraExistente.setProveedor(compraActualizada.getProveedor());
            compraExistente.setAnotaciones(compraActualizada.getAnotaciones());
            
            compraExistente.setSubtotal(compraActualizada.getSubtotal());
            compraExistente.setIvaImporte(compraActualizada.getIvaImporte());
            compraExistente.setPorcentajeIva(compraActualizada.getPorcentajeIva());
            compraExistente.setIncluyeIva(compraActualizada.getIncluyeIva());
            
            compraExistente.setDescuentoTipo(compraActualizada.getDescuentoTipo());
            compraExistente.setDescuentoValor(compraActualizada.getDescuentoValor());
            compraExistente.setDescuentoImporte(compraActualizada.getDescuentoImporte());
            
            compraExistente.setTotal(compraActualizada.getTotal());
            compraExistente.setMoneda(compraActualizada.getMoneda());
            compraExistente.setTipoCambio(compraActualizada.getTipoCambio());
            compraExistente.setTotalDolares(compraActualizada.getTotalDolares());
            compraExistente.setEstado(compraActualizada.getEstado());

            // Limpiar y agregar nuevos items
            compraExistente.getItems().clear();
            if (compraActualizada.getItems() != null) {
                for (CompraItem nuevoItem : compraActualizada.getItems()) {
                    nuevoItem.setCompra(compraExistente);
                    compraExistente.getItems().add(nuevoItem);
                }
            }

            Compra saved = compraRepository.save(compraExistente);

            // Aplicar stock nuevo
            for (CompraItem item : saved.getItems()) {
                productoService.aumentarStock(item.getProducto().getId(), item.getCantidad());
            }

            // NOTA: Se removió la automatización de registrar/actualizar en Tesorería aquí.

            return saved;
        }).orElseThrow(() -> new RuntimeException("Compra no encontrada"));
    }

    // Método registrarEgresoTesoreria removido.

    public List<Compra> listarTodas() {
        return compraRepository.findAll();
    }

    public Optional<Compra> buscarPorId(Long id) {
        return compraRepository.findById(id);
    }

    public List<Compra> listarPorProveedor(Long proveedorId) {
        return compraRepository.findByProveedorIdOrderByFechaDesc(proveedorId);
    }

    public org.springframework.data.domain.Page<Compra> listarPorProveedorPaginado(Long proveedorId, org.springframework.data.domain.Pageable pageable) {
        return compraRepository.findByProveedorId(proveedorId, pageable);
    }

    @Transactional
    public void eliminarCompra(Long id) {
        compraRepository.findById(id).ifPresent(compra -> {
            // Eliminar vínculos con pagos
            List<PagoProveedorCompra> vinculaciones = pagoProveedorCompraRepository.findByCompraId(id);
            if (!vinculaciones.isEmpty()) {
                pagoProveedorCompraRepository.deleteAll(vinculaciones);
            }

            // Anular tesorería
            String ref = "COMPRA-" + id;
            List<MovimientoTesoreria> movs = movimientoTesoreriaRepository.findByReferencia(ref);
            for (MovimientoTesoreria m : movs) {
                m.setAnulado(true);
                movimientoTesoreriaRepository.save(m);
            }

            // Revertir stock (usamos forzar para permitir negativos técnicos en anulación de compra)
            if (compra.getItems() != null) {
                for (CompraItem item : compra.getItems()) {
                    if (item.getProducto() != null && item.getCantidad() != null) {
                        productoService.forzarDescontarStock(item.getProducto().getId(), item.getCantidad());
                    }
                }
            }
            compraRepository.delete(compra);
        });
    }
}