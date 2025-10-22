package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.PrecioHistorico;
import com.example.Sistema_Gestion.model.Producto;
import com.example.Sistema_Gestion.repository.PrecioHistoricoRepository;
import com.example.Sistema_Gestion.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class PrecioHistoricoService {

    private final PrecioHistoricoRepository precioHistoricoRepository;
    private final ProductoRepository productoRepository;

    public PrecioHistoricoService(PrecioHistoricoRepository precioHistoricoRepository,
                                  ProductoRepository productoRepository) {
        this.precioHistoricoRepository = precioHistoricoRepository;
        this.productoRepository = productoRepository;
    }

    public void registrarCambio(Long productoId, BigDecimal nuevoPrecio, String fuente) {
        // 1️⃣ Buscar el producto por ID
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // 2️⃣ Crear el registro de precio histórico
        PrecioHistorico ph = new PrecioHistorico();
        ph.setProducto(producto);          // asignamos el objeto Producto
        ph.setPrecio(nuevoPrecio);         // BigDecimal
        ph.setFuente(fuente);
        ph.setFecha(LocalDateTime.now());

        // 3️⃣ Guardar en la base de datos
        precioHistoricoRepository.save(ph);
    }
}
