package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Compra;
import com.example.Sistema_Gestion.service.CompraService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    private final CompraService compraService;

    public CompraController(CompraService compraService) {
        this.compraService = compraService;
    }

    @PostMapping
    public Compra registrarCompra(@RequestBody Compra compra) {
        return compraService.registrarCompra(compra);
    }
}
