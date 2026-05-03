package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.CobroMedioPago;
import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.service.VentaRapidaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ventas/rapida")
@Slf4j
public class VentaRapidaController {

    private final VentaRapidaService ventaRapidaService;

    public VentaRapidaController(VentaRapidaService ventaRapidaService) {
        this.ventaRapidaService = ventaRapidaService;
    }

    @PostMapping
    public Remito registrarVentaRapida(@RequestBody VentaRapidaRequest req) {
        log.info("Registrando venta rápida");
        return ventaRapidaService.registrarVentaRapida(
                req.getRemito(),
                req.getPrecios(),
                req.getMediosPago(),
                req.getCotizacionDolar()
        );
    }

    public static class VentaRapidaRequest {
        private Remito remito;
        private Map<Long, BigDecimal> precios;
        private List<CobroMedioPago> mediosPago;
        private BigDecimal cotizacionDolar;

        public Remito getRemito() {
            return remito;
        }

        public void setRemito(Remito remito) {
            this.remito = remito;
        }

        public Map<Long, BigDecimal> getPrecios() {
            return precios;
        }

        public void setPrecios(Map<Long, BigDecimal> precios) {
            this.precios = precios;
        }

        public List<CobroMedioPago> getMediosPago() {
            return mediosPago;
        }

        public void setMediosPago(List<CobroMedioPago> mediosPago) {
            this.mediosPago = mediosPago;
        }

        public BigDecimal getCotizacionDolar() {
            return cotizacionDolar;
        }

        public void setCotizacionDolar(BigDecimal cotizacionDolar) {
            this.cotizacionDolar = cotizacionDolar;
        }
    }
}
