package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.AjusteStock;
import com.example.Sistema_Gestion.service.AjusteStockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ajustes-stock")
@CrossOrigin(origins = "*")
public class AjusteStockController {

    private final AjusteStockService ajusteStockService;

    public AjusteStockController(AjusteStockService ajusteStockService) {
        this.ajusteStockService = ajusteStockService;
    }

    @PostMapping
    public ResponseEntity<?> crearAjuste(@RequestBody Map<String, Object> payload) {
        try {
            Long productoId = Long.valueOf(payload.get("productoId").toString());
            Integer cantidad = Integer.valueOf(payload.get("cantidad").toString());
            String motivo = payload.get("motivo").toString();

            AjusteStock ajuste = ajusteStockService.ejecutarAjuste(productoId, cantidad, motivo);
            return ResponseEntity.ok(ajuste);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listarAjustes() {
        return ResponseEntity.ok(ajusteStockService.listarAjustes());
    }
}
