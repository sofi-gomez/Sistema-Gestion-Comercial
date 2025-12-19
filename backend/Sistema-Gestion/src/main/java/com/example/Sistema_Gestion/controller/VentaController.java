package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Venta;
import com.example.Sistema_Gestion.service.VentaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @PostMapping
    public Venta registrarVenta(@RequestBody Venta venta) {
        return ventaService.registrarVenta(venta);
    }

    @GetMapping
    public List<Venta> listarTodos() {
        return ventaService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Venta> buscarPorId(@PathVariable Long id) {
        return ventaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Venta> actualizarVenta(@PathVariable Long id, @RequestBody Venta venta) {
        return ventaService.actualizarVenta(id, venta)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarVenta(@PathVariable Long id) {
        boolean eliminada = ventaService.eliminarVenta(id);
        if (eliminada) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/anular")
    public ResponseEntity<Void> anularVenta(@PathVariable Long id) {
        boolean anulada = ventaService.anularVenta(id);
        if (anulada) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}