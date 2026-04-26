package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Configuracion;
import com.example.Sistema_Gestion.repository.ConfiguracionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class ConfiguracionService {

    private final ConfiguracionRepository configuracionRepository;

    public ConfiguracionService(ConfiguracionRepository configuracionRepository) {
        this.configuracionRepository = configuracionRepository;
    }

    public Configuracion getConfiguracion() {
        return configuracionRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::crearConfiguracionDefault);
    }

    @Transactional
    public Configuracion actualizarConfiguracion(Configuracion nueva) {
        Configuracion actual = getConfiguracion();
        actual.setNombreEmpresa(nueva.getNombreEmpresa());
        actual.setCuit(nueva.getCuit());
        actual.setDireccion(nueva.getDireccion());
        actual.setTelefono(nueva.getTelefono());
        actual.setCotizacionDolar(nueva.getCotizacionDolar());
        actual.setMonedaPrincipal(nueva.getMonedaPrincipal());
        actual.setStockMinimoGlobal(nueva.getStockMinimoGlobal());
        return configuracionRepository.save(actual);
    }

    private Configuracion crearConfiguracionDefault() {
        Configuracion def = new Configuracion();
        def.setNombreEmpresa("Leonel Gomez – Agro-Ferretería");
        def.setCuit("20-23291335-6");
        def.setDireccion("B° Terrazas del Valle MY C19 Cordón Del Plata");
        def.setCotizacionDolar(new BigDecimal("1200.00"));
        def.setMonedaPrincipal("ARS");
        def.setStockMinimoGlobal(5);
        return configuracionRepository.save(def);
    }
}
