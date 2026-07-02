package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Configuracion;
import com.example.Sistema_Gestion.service.ConfiguracionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

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

    /**
     * Endpoint usado por VentaRapidaModal para obtener solo la cotización del dólar.
     * Devuelve { "valor": 1350.0 }
     */
    @GetMapping("/cotizacion-dolar")
    public ResponseEntity<Map<String, Object>> getCotizacionDolar() {
        Configuracion conf = configuracionService.getConfiguracion();
        BigDecimal cotizacion = conf.getCotizacionDolar();
        double valor = (cotizacion != null) ? cotizacion.doubleValue() : 0.0;
        return ResponseEntity.ok(Map.of("valor", valor));
    }

    @PutMapping
    public Configuracion update(@RequestBody Configuracion configuracion) {
        log.info("Actualizando configuración del sistema: cotización={}", configuracion.getCotizacionDolar());
        return configuracionService.actualizarConfiguracion(configuracion);
    }
}
