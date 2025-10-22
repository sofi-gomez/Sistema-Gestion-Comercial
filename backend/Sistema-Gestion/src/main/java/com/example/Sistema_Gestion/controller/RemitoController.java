package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.service.RemitoService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/remitos")
public class RemitoController {

    private final RemitoService remitoService;

    public RemitoController(RemitoService remitoService) {
        this.remitoService = remitoService;
    }

    @PostMapping
    public Remito generarRemito(@RequestBody Remito remito) {
        return remitoService.generarRemito(remito);
    }
}
