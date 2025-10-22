package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Venta;
import com.example.Sistema_Gestion.service.VentaService;
import org.springframework.web.bind.annotation.*;

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
}
