package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.service.RemitoService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
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

    @PostMapping
    public ResponseEntity<?> generarRemito(@RequestBody Remito remito) {
        Remito creado = remitoService.generarRemito(remito);
        return ResponseEntity.ok(creado);
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
