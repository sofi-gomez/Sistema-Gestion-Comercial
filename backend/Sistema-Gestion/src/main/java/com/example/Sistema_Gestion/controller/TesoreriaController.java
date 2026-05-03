package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.service.TesoreriaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;
import java.util.Map;

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

    @PutMapping("/{id}/rechazar")
    public ResponseEntity<MovimientoTesoreria> rechazarCheque(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, BigDecimal> body) {
        log.info("Marcando cheque ID: {} como rechazado", id);
        BigDecimal gastos = (body != null && body.containsKey("gastosBancarios")) ? body.get("gastosBancarios") : BigDecimal.ZERO;
        return tesoreriaService.rechazarCheque(id, gastos)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> anularMovimiento(@PathVariable("id") Long id) {
        log.info("Anulando movimiento de tesorería ID: {}", id);
        if (tesoreriaService.anularMovimiento(id)) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/resumen")
    public ResponseEntity<?> obtenerResumen() {
        return ResponseEntity.ok(tesoreriaService.getResumenCaja());
    }

    /**
     * AF-12: Resumen de caja para un día específico.
     * Uso: GET /api/tesoreria/resumen-dia?fecha=2025-04-06
     * Si no se pasa fecha, devuelve hoy.
     */
    @GetMapping("/resumen-dia")
    public ResponseEntity<?> obtenerResumenDia(
            @RequestParam(value = "fecha", required = false) String fechaStr) {
        LocalDate fecha = (fechaStr != null && !fechaStr.isBlank())
                ? LocalDate.parse(fechaStr)
                : LocalDate.now();
        return ResponseEntity.ok(tesoreriaService.getResumenDia(fecha));
    }

    @GetMapping("/cheques/cliente/{clienteId}")
    public List<MovimientoTesoreria> listarChequesPorCliente(@PathVariable Long clienteId) {
        return tesoreriaService.buscarChequesPorCliente(clienteId);
    }
}