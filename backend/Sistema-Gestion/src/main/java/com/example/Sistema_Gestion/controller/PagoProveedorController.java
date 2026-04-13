package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.PagoProveedor;
import com.example.Sistema_Gestion.service.PagoProveedorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.io.ByteArrayOutputStream;
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
        BigDecimal deudaARS = pagoProveedorService.calcularDeudaProveedorARS(proveedorId);
        BigDecimal deudaUSD = pagoProveedorService.calcularDeudaProveedorUSD(proveedorId);
        return ResponseEntity.ok(Map.of("proveedorId", proveedorId, "deudaARS", deudaARS, "deudaUSD", deudaUSD, "deuda", deudaARS)); // Retenemos "deuda" para compatibilidad temporal si es necesario
    }

    /** PUT /api/pagos-proveedor/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarPago(@PathVariable("id") Long id, @RequestBody PagoProveedor pago) {
        log.info("Actualizando pago ID: {}", id);
        return ResponseEntity.ok(pagoProveedorService.actualizarPago(id, pago));
    }

    /** DELETE /api/pagos-proveedor/{id}/anular */
    @DeleteMapping("/{id}/anular")
    public ResponseEntity<?> anularPago(@PathVariable("id") Long id) {
        boolean ok = pagoProveedorService.anularPago(id);
        return ok ? ResponseEntity.ok(Map.of("mensaje", "Pago anulado"))
                : ResponseEntity.notFound().build();
    }

    /** GET /api/pagos-proveedor/{id}/orden-pago/pdf */
    @GetMapping("/{id}/orden-pago/pdf")
    public ResponseEntity<byte[]> descargarOrdenPago(@PathVariable("id") Long id) {
        try {
            byte[] logo = null;
            try {
                logo = getClass().getResourceAsStream("/static/iSOTIPO.png").readAllBytes();
            } catch (Exception ignored) {}
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            pagoProveedorService.generarPdfOrdenPago(id, baos, logo);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "orden_pago_" + id + ".pdf");
            return new ResponseEntity<>(baos.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error generando orden de pago PDF para pago {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generando PDF");
        }
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
