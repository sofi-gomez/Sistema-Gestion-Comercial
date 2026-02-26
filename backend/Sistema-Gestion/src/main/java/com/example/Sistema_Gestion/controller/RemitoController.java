package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.service.RemitoService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/remitos")
public class RemitoController {

    private final RemitoService remitoService;

    public RemitoController(RemitoService remitoService) {
        this.remitoService = remitoService;
    }

    @GetMapping
    public ResponseEntity<?> listarTodos() {
        return ResponseEntity.ok(remitoService.listarTodos());
    }

    /** GET /api/remitos?estado=PENDIENTE — filtrar por estado */
    @GetMapping(params = "estado")
    public ResponseEntity<?> listarPorEstado(@RequestParam("estado") String estado) {
        try {
            Remito.EstadoRemito estadoEnum = Remito.EstadoRemito.valueOf(estado.toUpperCase());
            return ResponseEntity.ok(remitoService.listarPorEstado(estadoEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado inválido: " + estado));
        }
    }

    /** GET /api/remitos/cliente/{clienteId} — remitos de un cliente */
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<?> listarPorCliente(@PathVariable("clienteId") Long clienteId) {
        return ResponseEntity.ok(remitoService.listarPorCliente(clienteId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable("id") Long id) {
        return remitoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crearRemito(@RequestBody Remito remito) {
        try {
            Remito creado = remitoService.generarRemito(remito);
            return ResponseEntity.ok(creado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al crear remito: " + e.getMessage()));
        }
    }

    /**
     * POST /api/remitos/{id}/valorizar
     *
     * Body:
     * {
     * "cotizacionDolar": 1050.00,
     * "precios": {
     * "itemId": precioUnitario,
     * "42": 7500.00,
     * "43": 12000.00
     * }
     * }
     */
    @PostMapping("/{id}/valorizar")
    public ResponseEntity<?> valorizar(@PathVariable("id") Long id, @RequestBody ValorizarRequest req) {
        try {
            Remito valorizado = remitoService.valorizar(id, req.getPrecios(), req.getCotizacionDolar());
            return ResponseEntity.ok(valorizado);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al valorizar: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/cobrar")
    public ResponseEntity<?> cobrar(@PathVariable("id") Long id) {
        try {
            Remito cobrado = remitoService.marcarComoCobrado(id);
            return ResponseEntity.ok(cobrado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al registrar cobro: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarRemito(@PathVariable("id") Long id, @RequestBody Remito remito) {
        if (!remitoService.buscarPorId(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        remito.setId(id);
        try {
            Remito actualizado = remitoService.actualizarRemito(remito);
            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al actualizar remito: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarRemito(@PathVariable("id") Long id) {
        try {
            remitoService.eliminarRemito(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al eliminar remito: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/pdf")
    public void descargarPdf(@PathVariable("id") Long id, HttpServletResponse response) {
        Remito remito = remitoService.buscarPorId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=remito_" + remito.getNumero() + ".pdf");
        try {
            byte[] logo = null;
            try {
                logo = Files.readAllBytes(Paths.get("src/main/resources/static/logo.png"));
            } catch (Exception ex) {
                logo = null;
            }
            remitoService.generarPdfRemito(remito, response.getOutputStream(), logo);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generando PDF", e);
        }
    }

    // ---- Inner DTO ----
    public static class ValorizarRequest {
        private BigDecimal cotizacionDolar;
        private Map<Long, BigDecimal> precios;

        public BigDecimal getCotizacionDolar() {
            return cotizacionDolar;
        }

        public void setCotizacionDolar(BigDecimal cotizacionDolar) {
            this.cotizacionDolar = cotizacionDolar;
        }

        public Map<Long, BigDecimal> getPrecios() {
            return precios;
        }

        public void setPrecios(Map<Long, BigDecimal> precios) {
            this.precios = precios;
        }
    }
}
