package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Configuracion;
import com.example.Sistema_Gestion.service.ConfiguracionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/configuracion")
@Slf4j
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;

    public ConfiguracionController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @GetMapping
    public Configuracion getConfig() {
        return configuracionService.getConfiguracion();
    }

    @PutMapping
    public Configuracion update(@RequestBody Configuracion configuracion) {
        log.info("Actualizando configuración del sistema");
        return configuracionService.actualizarConfiguracion(configuracion);
    }
}
