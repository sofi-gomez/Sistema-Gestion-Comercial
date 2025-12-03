package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.service.RemitoService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Paths;

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

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return remitoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Agrega este método POST para crear nuevos remitos
    @PostMapping
    public ResponseEntity<?> crearRemito(@RequestBody Remito remito) {
        try {
            Remito creado = remitoService.generarRemito(remito);
            return ResponseEntity.ok(creado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al crear remito: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarRemito(@PathVariable Long id, @RequestBody Remito remito) {
        // Verificar que el remito existe
        if (!remitoService.buscarPorId(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }

        // Asegurar que el ID del path coincide con el ID del objeto
        remito.setId(id);

        try {
            Remito actualizado = remitoService.actualizarRemito(remito);
            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al actualizar remito: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/pdf")
    public void descargarPdf(@PathVariable Long id, HttpServletResponse response) {
        Remito remito = remitoService.buscarPorId(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=remito_" + remito.getNumero() + ".pdf");
        try {
            // si querés cargar logo de resources
            byte[] logo = null;
            try {
                logo = Files.readAllBytes(Paths.get("src/main/resources/static/logo.png"));
            } catch (Exception ex) { logo = null; }
            remitoService.generarPdfRemito(remito, response.getOutputStream(), logo);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generando PDF", e);
        }
    }
}