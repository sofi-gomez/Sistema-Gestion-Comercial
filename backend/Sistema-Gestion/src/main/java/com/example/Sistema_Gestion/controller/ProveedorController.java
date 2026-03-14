package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Proveedor;
import com.example.Sistema_Gestion.service.ProveedorService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@Slf4j
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping
    public List<Proveedor> listarTodos() {
        return proveedorService.listarTodos();
    }

    @PostMapping
    public Proveedor crear(@Valid @RequestBody Proveedor proveedor) {
        log.info("Creando nuevo proveedor: {}", proveedor.getNombre());
        return proveedorService.guardar(proveedor);
    }

    @PutMapping("/{id}")
    public Proveedor actualizar(@PathVariable("id") Long id, @Valid @RequestBody Proveedor proveedor) {
        log.info("Actualizando proveedor ID: {}", id);
        proveedor.setId(id);
        return proveedorService.guardar(proveedor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        log.info("Eliminando proveedor ID: {}", id);
        proveedorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<?> getDashboardSummary() {
        return ResponseEntity.ok(proveedorService.getDashboardSummary());
    }

    @GetMapping("/{id}/reporte-cuenta-corriente")
    public ResponseEntity<?> getReporteCuentaCorriente(
            @PathVariable("id") Long id,
            @RequestParam("desde") String desdeStr,
            @RequestParam("hasta") String hastaStr,
            @RequestParam(value = "format", defaultValue = "json") String format) {
        try {
            LocalDate desde = LocalDate.parse(desdeStr);
            LocalDate hasta = LocalDate.parse(hastaStr);

            if ("pdf".equalsIgnoreCase(format)) {
                byte[] pdfBytes = generatePdfBytes(id, desde, hasta);
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header("Content-Disposition", "attachment; filename=reporte-cta-cte.pdf")
                        .header("Content-Length", String.valueOf(pdfBytes.length))
                        .body(new org.springframework.core.io.ByteArrayResource(pdfBytes));
            }

            return ResponseEntity.ok(proveedorService.generarReporteCuentaCorriente(id, desde, hasta));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private byte[] generatePdfBytes(Long id, LocalDate desde, LocalDate hasta) throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();

        byte[] logoBytes = null;
        try {
            String logoPath = "C:\\Users\\leone\\OneDrive\\Desktop\\Sistema-Gestion-Comercial\\frontend\\src\\logo.png";
            java.io.File logoFile = new java.io.File(logoPath);
            if (logoFile.exists()) {
                logoBytes = java.nio.file.Files.readAllBytes(logoFile.toPath());
            }
        } catch (Exception e) {
            System.err.println("Error cargando logo para PDF: " + e.getMessage());
        }

        proveedorService.exportarReportePdf(id, desde, hasta, baos, logoBytes);
        return baos.toByteArray();
    }
}
