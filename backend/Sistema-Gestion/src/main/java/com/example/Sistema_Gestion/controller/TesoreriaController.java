package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.service.TesoreriaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tesoreria")
public class TesoreriaController {

    private final TesoreriaService tesoreriaService;

    public TesoreriaController(TesoreriaService tesoreriaService) {
        this.tesoreriaService = tesoreriaService;
    }

    @PostMapping
    public MovimientoTesoreria registrarMovimiento(@RequestBody MovimientoTesoreria movimiento) {
        return tesoreriaService.registrarMovimiento(movimiento);
    }

    @GetMapping
    public List<MovimientoTesoreria> listarTodos() {
        return tesoreriaService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovimientoTesoreria> buscarPorId(@PathVariable Long id) {
        return tesoreriaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovimientoTesoreria> actualizarMovimiento(
            @PathVariable Long id,
            @RequestBody MovimientoTesoreria movimiento) {
        return tesoreriaService.actualizarMovimiento(id, movimiento)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/cobrar")
    public ResponseEntity<MovimientoTesoreria> marcarComoCobrado(@PathVariable Long id) {
        return tesoreriaService.marcarComoCobrado(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}