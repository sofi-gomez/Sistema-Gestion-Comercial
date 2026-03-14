package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.PagoProveedor;
import com.example.Sistema_Gestion.service.PagoProveedorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos-proveedor")
@Slf4j
public class PagoProveedorController {

    private final PagoProveedorService pagoProveedorService;

    public PagoProveedorController(PagoProveedorService pagoProveedorService) {
        this.pagoProveedorService = pagoProveedorService;
    }

    /**
     * POST /api/pagos-proveedor
     *
     * Body:
     * {
     * "pago": { "proveedor": {"id": 1}, "medio": "EFECTIVO", "observaciones": "..."
     * },
     * "importesPorCompra": { "3": 40000.00, "4": 60000.00 }
     * }
     */
    @PostMapping
    public PagoProveedor registrarPago(@RequestBody RegistrarPagoRequest req) {
        log.info("Registrando nuevo pago para el proveedor: {}",
                req.getPago().getProveedor() != null ? req.getPago().getProveedor().getNombre() : "N/A");
        return pagoProveedorService.registrarPago(
                req.getPago(),
                req.getImportesPorCompra());
    }

    /** GET /api/pagos-proveedor/proveedor/{proveedorId} */
    @GetMapping("/proveedor/{proveedorId}")
    public ResponseEntity<?> listarPorProveedor(@PathVariable("proveedorId") Long proveedorId) {
        return ResponseEntity.ok(pagoProveedorService.listarPorProveedor(proveedorId));
    }

    /** GET /api/pagos-proveedor/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable("id") Long id) {
        return pagoProveedorService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/pagos-proveedor/proveedor/{proveedorId}/deuda */
    @GetMapping("/proveedor/{proveedorId}/deuda")
    public ResponseEntity<?> deudaProveedor(@PathVariable("proveedorId") Long proveedorId) {
        BigDecimal deuda = pagoProveedorService.calcularDeudaProveedor(proveedorId);
        return ResponseEntity.ok(Map.of("proveedorId", proveedorId, "deuda", deuda));
    }

    /** DELETE /api/pagos-proveedor/{id}/anular */
    @DeleteMapping("/{id}/anular")
    public ResponseEntity<?> anularPago(@PathVariable("id") Long id) {
        boolean ok = pagoProveedorService.anularPago(id);
        return ok ? ResponseEntity.ok(Map.of("mensaje", "Pago anulado"))
                : ResponseEntity.notFound().build();
    }

    // ---- Inner DTO ----
    public static class RegistrarPagoRequest {
        private PagoProveedor pago;
        private Map<Long, BigDecimal> importesPorCompra;

        public PagoProveedor getPago() {
            return pago;
        }

        public void setPago(PagoProveedor pago) {
            this.pago = pago;
        }

        public Map<Long, BigDecimal> getImportesPorCompra() {
            return importesPorCompra;
        }

        public void setImportesPorCompra(Map<Long, BigDecimal> importesPorCompra) {
            this.importesPorCompra = importesPorCompra;
        }
    }
}
