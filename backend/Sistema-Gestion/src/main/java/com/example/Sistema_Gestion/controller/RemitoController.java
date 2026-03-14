package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.service.RemitoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/remitos")
@Slf4j
public class RemitoController {

    private final RemitoService remitoService;

    public RemitoController(RemitoService remitoService) {
        this.remitoService = remitoService;
    }

    @GetMapping
    public List<Remito> listarTodos() {
        return remitoService.listarTodos();
    }

    @GetMapping(params = "estado")
    public List<Remito> listarPorEstado(@RequestParam("estado") String estado) {
        try {
            Remito.EstadoRemito estadoEnum = Remito.EstadoRemito.valueOf(estado.toUpperCase());
            return remitoService.listarPorEstado(estadoEnum);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido: " + estado);
        }
    }

    @PostMapping
    public Remito crearRemito(@RequestBody Remito remito) {
        log.info("Generando nuevo remito para el cliente: {}", remito.getClienteNombre());
        return remitoService.generarRemito(remito);
    }

    @PutMapping("/{id}")
    public Remito actualizarRemito(@PathVariable("id") Long id, @RequestBody Remito remito) {
        log.info("Actualizando remito ID: {}", id);
        remito.setId(id);
        return remitoService.actualizarRemito(remito);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarRemito(@PathVariable("id") Long id) {
        log.info("Eliminando remito ID: {}", id);
        remitoService.eliminarRemito(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable("id") Long id) {
        Remito remito = remitoService.buscarPorIdConItems(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Remito no encontrado"));

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] logo = null;
            try {
                logo = Files.readAllBytes(Paths.get("src/main/resources/static/logo.png"));
            } catch (Exception ex) {
                log.warn("No se pudo cargar el logo para el PDF del remito {}", id);
            }

            remitoService.generarPdfRemito(remito, baos, logo);
            byte[] pdfBytes = baos.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "remito_" + remito.getNumero() + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error al generar PDF para remito ID: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generando PDF");
        }
    }

    @PostMapping("/{id}/valorizar")
    public Remito valorizar(@PathVariable("id") Long id, @RequestBody ValorizarRequest req) {
        log.info("Valorizando remito ID: {}", id);
        return remitoService.valorizar(id, req.getPrecios(), req.getCotizacionDolar());
    }

    @PostMapping("/{id}/cobrar")
    public Remito cobrar(@PathVariable("id") Long id) {
        log.info("Marcando remito ID: {} como cobrado", id);
        return remitoService.marcarComoCobrado(id);
    }

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
