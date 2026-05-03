package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Cliente;
import com.example.Sistema_Gestion.model.Cobro;
import com.example.Sistema_Gestion.model.CobroMedioPago;
import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.repository.ClienteRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class VentaRapidaService {

    private final RemitoService remitoService;
    private final CobroService cobroService;
    private final ClienteRepository clienteRepository;

    public VentaRapidaService(RemitoService remitoService, CobroService cobroService, ClienteRepository clienteRepository) {
        this.remitoService = remitoService;
        this.cobroService = cobroService;
        this.clienteRepository = clienteRepository;
    }

    @Transactional
    public Remito registrarVentaRapida(Remito remitoRequest, Map<Long, BigDecimal> precios, List<CobroMedioPago> mediosPago, BigDecimal cotizacionDolar) {
        // 1. Resolver Cliente
        Cliente cliente = remitoRequest.getCliente();
        if (cliente == null || cliente.getId() == null) {
            cliente = clienteRepository.findByNombre("CONSUMIDOR FINAL")
                    .orElseGet(() -> {
                        Cliente c = new Cliente();
                        c.setNombre("CONSUMIDOR FINAL");
                        c.setDocumento("00000000");
                        c.setDireccion("-");
                        c.setTelefono("-");
                        return clienteRepository.save(c);
                    });
            remitoRequest.setCliente(cliente);
        }

        // 2. Generar Remito (Esto descuenta stock y lo deja en PENDIENTE)
        Remito remitoCreado = remitoService.generarRemito(remitoRequest);

        // 3. Valorizar Remito (Asigna precios, calcula total y cambia a VALORIZADO)
        Map<Long, BigDecimal> preciosPorItem = new HashMap<>();
        for (com.example.Sistema_Gestion.model.RemitoItem item : remitoCreado.getItems()) {
            if (item.getProducto() != null && precios.containsKey(item.getProducto().getId())) {
                preciosPorItem.put(item.getId(), precios.get(item.getProducto().getId()));
            } else {
                throw new IllegalArgumentException("Falta el precio para el producto: " + 
                    (item.getProducto() != null ? item.getProducto().getNombre() : "ID " + item.getProducto().getId()));
            }
        }
        Remito remitoValorizado = remitoService.valorizar(remitoCreado.getId(), preciosPorItem, cotizacionDolar);

        // 4. Generar Cobro
        Cobro cobro = new Cobro();
        cobro.setCliente(remitoValorizado.getCliente());
        cobro.setFecha(java.time.LocalDate.now());
        cobro.setObservaciones(remitoValorizado.getObservaciones() != null ? "Venta rápida. " + remitoValorizado.getObservaciones() : "Venta rápida.");
        cobro.setTotalCobrado(remitoValorizado.getTotal());

        Map<Long, BigDecimal> importesPorRemito = new HashMap<>();
        importesPorRemito.put(remitoValorizado.getId(), remitoValorizado.getTotal());

        // Para evitar NPE si mediosPago viene null
        if (mediosPago == null || mediosPago.isEmpty()) {
            CobroMedioPago efectivo = new CobroMedioPago();
            efectivo.setMedio("EFECTIVO");
            efectivo.setImporte(remitoValorizado.getTotal());
            mediosPago = List.of(efectivo);
        }

        // Esto registra el cobro, actualiza tesorería, y llama a RemitoService para marcar como COBRADO
        cobroService.registrarCobro(cobro, importesPorRemito, null, mediosPago);

        // 5. Devolver el remito (que ahora debería estar cobrado)
        return remitoService.buscarPorIdConItems(remitoValorizado.getId()).orElse(remitoValorizado);
    }
}
