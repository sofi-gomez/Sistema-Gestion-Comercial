package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Compra;
import com.example.Sistema_Gestion.service.CompraService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compras")
@Slf4j
public class CompraController {

    private final CompraService compraService;

    public CompraController(CompraService compraService) {
        this.compraService = compraService;
    }

    @PostMapping
    public Compra crear(@RequestBody Compra compra) {
        if (compra.getProveedor() != null) {
            log.info("Registrando nueva compra del proveedor: {}", compra.getProveedor().getNombre());
        }
        return compraService.registrarCompra(compra);
    }

    @PutMapping("/{id}")
    public Compra actualizar(@PathVariable("id") Long id, @RequestBody Compra compra) {
        log.info("Actualizando compra ID: {}", id);
        return compraService.actualizarCompra(id, compra);
    }

    @GetMapping("/proveedor/{proveedorId}")
    public java.util.List<Compra> listarPorProveedor(@PathVariable("proveedorId") Long proveedorId) {
        log.info("Listando compras del proveedor ID: {}", proveedorId);
        return compraService.listarPorProveedor(proveedorId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        log.info("Eliminando compra ID: {}", id);
        compraService.eliminarCompra(id);
        return ResponseEntity.noContent().build();
    }
}
