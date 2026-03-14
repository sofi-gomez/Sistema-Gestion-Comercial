package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.service.TesoreriaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tesoreria")
@Slf4j
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
    public ResponseEntity<MovimientoTesoreria> buscarPorId(@PathVariable("id") Long id) {
        return tesoreriaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovimientoTesoreria> actualizarMovimiento(
            @PathVariable("id") Long id,
            @RequestBody MovimientoTesoreria movimiento) {
        log.info("Actualizando movimiento de tesorería ID: {}", id);
        return tesoreriaService.actualizarMovimiento(id, movimiento)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/cobrar")
    public ResponseEntity<MovimientoTesoreria> marcarComoCobrado(@PathVariable("id") Long id) {
        log.info("Marcando movimiento de tesorería ID: {} como cobrado", id);
        return tesoreriaService.marcarComoCobrado(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/resumen")
    public ResponseEntity<?> obtenerResumen() {
        return ResponseEntity.ok(tesoreriaService.getResumenCaja());
    }
}