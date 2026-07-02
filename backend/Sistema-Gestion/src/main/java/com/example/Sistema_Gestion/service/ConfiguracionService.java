package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Configuracion;
import com.example.Sistema_Gestion.repository.ConfiguracionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Slf4j
public class ConfiguracionService {

    private final ConfiguracionRepository configuracionRepository;
    private final ProductoService productoService;

    public ConfiguracionService(ConfiguracionRepository configuracionRepository, ProductoService productoService) {
        this.configuracionRepository = configuracionRepository;
        this.productoService = productoService;
    }

    public Configuracion getConfiguracion() {
        return configuracionRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::crearConfiguracionDefault);
    }

    @Transactional
    public Configuracion actualizarConfiguracion(Configuracion nueva) {
        Configuracion actual = getConfiguracion();
        actual.setNombreEmpresa(nueva.getNombreEmpresa() != null ? nueva.getNombreEmpresa().trim() : "");

        if (nueva.getCuit() != null) {
            actual.setCuit(nueva.getCuit().replaceAll("[^0-9]", ""));
        } else {
            actual.setCuit("");
        }

        actual.setDireccion(nueva.getDireccion());
        actual.setTelefono(nueva.getTelefono());

        BigDecimal cotizacionAnterior = actual.getCotizacionDolar();
        BigDecimal cotizacionNueva = nueva.getCotizacionDolar();

        log.info("[Config] Cotización anterior={}, nueva={}", cotizacionAnterior, cotizacionNueva);

        actual.setCotizacionDolar(cotizacionNueva);
        actual.setMonedaPrincipal(nueva.getMonedaPrincipal());
        actual.setStockMinimoGlobal(nueva.getStockMinimoGlobal());

        Configuracion guardada = configuracionRepository.save(actual);

        // Usar compareTo con stripTrailingZeros() para evitar falsos negativos de escala en BigDecimal
        boolean cotizacionCambio = cotizacionNueva != null && (
                cotizacionAnterior == null ||
                cotizacionNueva.stripTrailingZeros().compareTo(cotizacionAnterior.stripTrailingZeros()) != 0
        );

        if (cotizacionCambio) {
            log.info("[Config] Cotización cambió de {} a {}. Sincronizando precios en pesos...", cotizacionAnterior, cotizacionNueva);
            productoService.sincronizarPreciosPesosConUSD(cotizacionNueva);
        } else {
            log.info("[Config] Cotización no cambió, no se sincronizan precios.");
        }

        return guardada;
    }

    private Configuracion crearConfiguracionDefault() {
        Configuracion def = new Configuracion();
        def.setNombreEmpresa("Gea Agrícola");
        def.setCuit("20-23291335-6");
        def.setDireccion("B° Terrazas del Valle MY C19 Cordón Del Plata");
        def.setCotizacionDolar(new BigDecimal("1350.00"));
        def.setMonedaPrincipal("ARS");
        def.setStockMinimoGlobal(5);
        return configuracionRepository.save(def);
    }
}
