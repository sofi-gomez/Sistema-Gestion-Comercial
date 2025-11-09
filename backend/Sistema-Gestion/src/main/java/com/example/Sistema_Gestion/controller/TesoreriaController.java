package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.service.TesoreriaService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tesoreria")
public class TesoreriaController {

    private final TesoreriaService tesoreriaService;

    public TesoreriaController(TesoreriaService tesoreriaService) {
        this.tesoreriaService = tesoreriaService;
    }

    @GetMapping
    public List<MovimientoTesoreria> listarTodos() {
        return tesoreriaService.listarTodos();
    }

    @PostMapping
    public MovimientoTesoreria registrarMovimiento(@RequestBody MovimientoTesoreria movimiento) {
        return tesoreriaService.registrarMovimiento(movimiento);
    }

    @GetMapping("/rango")
    public List<MovimientoTesoreria> listarPorRango(@RequestParam String desde,
                                                    @RequestParam String hasta) {
        LocalDateTime desdeDt = LocalDateTime.parse(desde);
        LocalDateTime hastaDt = LocalDateTime.parse(hasta);
        return tesoreriaService.listarPorRango(desdeDt, hastaDt);
    }
}