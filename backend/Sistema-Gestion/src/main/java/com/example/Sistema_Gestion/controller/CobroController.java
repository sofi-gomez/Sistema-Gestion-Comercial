package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Cobro;
import com.example.Sistema_Gestion.model.CobroMedioPago;
import com.example.Sistema_Gestion.service.CobroService;
import com.example.Sistema_Gestion.service.RemitoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cobros")
@Slf4j
public class CobroController {

    private final CobroService cobroService;
    private final RemitoService remitoService;

    public CobroController(CobroService cobroService, RemitoService remitoService) {
        this.cobroService = cobroService;
        this.remitoService = remitoService;
    }

    /**
     * POST /api/cobros
     *
     * Body esperado:
     * {
     * "cobro": { "cliente": {"id": 5}, "observaciones": "..." },
     * "importesPorRemito": { "12": 50000.00, "13": 25000.00 },
     * "mediosPago": [
     * { "medio": "EFECTIVO", "importe": 75000.00 },
     * { "medio": "CHEQUE", "importe": 0, "banco": "Nacion", ... }
     * ]
     * }
     */
    @PostMapping
    public Cobro registrarCobro(@RequestBody RegistrarCobroRequest req) {
        log.info("Registrando nuevo cobro para el cliente: {}", req.getCobro().getCliente().getNombre());
        return cobroService.registrarCobro(
                req.getCobro(),
                req.getImportesPorRemito(),
                req.getMediosPago());
    }

    /** GET /api/cobros/cliente/{clienteId} — historial de cobros del cliente */
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<?> listarPorCliente(@PathVariable("clienteId") Long clienteId) {
        return ResponseEntity.ok(cobroService.listarPorCliente(clienteId));
    }

    /**
     * GET /api/cobros/cliente/{clienteId}/movimientos — historial unificado
     * (Remitos + Cobros)
     */
    @GetMapping("/cliente/{clienteId}/movimientos")
    public ResponseEntity<?> obtenerMovimientos(@PathVariable("clienteId") Long clienteId) {
        return ResponseEntity.ok(cobroService.getMovimientos(clienteId));
    }

    /** GET /api/cobros/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable("id") Long id) {
        return cobroService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/cobros/cliente/{clienteId}/saldo — saldo pendiente del cliente */
    @GetMapping("/cliente/{clienteId}/saldo")
    public ResponseEntity<?> saldoCliente(@PathVariable("clienteId") Long clienteId) {
        BigDecimal saldo = cobroService.calcularSaldoCliente(clienteId);
        return ResponseEntity.ok(Map.of("clienteId", clienteId, "saldo", saldo));
    }

    /** GET /api/remitos/pendientes — remitos VALORIZADOS esperando cobro */
    @GetMapping("/remitos-pendientes")
    public ResponseEntity<?> remitosPendientesDeCobro() {
        return ResponseEntity.ok(
                remitoService.listarPorEstado(com.example.Sistema_Gestion.model.Remito.EstadoRemito.VALORIZADO));
    }

    /** DELETE /api/cobros/{id}/anular */
    @DeleteMapping("/{id}/anular")
    public ResponseEntity<?> anularCobro(@PathVariable("id") Long id) {
        boolean ok = cobroService.anularCobro(id);
        return ok ? ResponseEntity.ok(Map.of("mensaje", "Cobro anulado"))
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<?> getDashboardSummary() {
        return ResponseEntity.ok(cobroService.getDashboardSummary());
    }

    // ---- Inner class para el request body ----

    public static class RegistrarCobroRequest {
        private Cobro cobro;
        private Map<Long, BigDecimal> importesPorRemito;
        private List<CobroMedioPago> mediosPago;

        public Cobro getCobro() {
            return cobro;
        }

        public void setCobro(Cobro cobro) {
            this.cobro = cobro;
        }

        public Map<Long, BigDecimal> getImportesPorRemito() {
            return importesPorRemito;
        }

        public void setImportesPorRemito(Map<Long, BigDecimal> importesPorRemito) {
            this.importesPorRemito = importesPorRemito;
        }

        public List<CobroMedioPago> getMediosPago() {
            return mediosPago;
        }

        public void setMediosPago(List<CobroMedioPago> mediosPago) {
            this.mediosPago = mediosPago;
        }
    }
}
