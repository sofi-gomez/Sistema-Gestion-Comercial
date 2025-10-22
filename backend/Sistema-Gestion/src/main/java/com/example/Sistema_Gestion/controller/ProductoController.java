package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Producto;
import com.example.Sistema_Gestion.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public List<Producto> listarTodos() {
        return productoService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> buscarPorId(@PathVariable Long id) {
        return productoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Producto crear(@Valid @RequestBody Producto producto) {
        return productoService.guardar(producto);
    }

    @PutMapping("/{id}")
    public Producto actualizar(@PathVariable Long id, @Valid @RequestBody Producto producto) {
        return productoService.actualizar(id, producto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/aumentar-stock")
    public ResponseEntity<Void> aumentarStock(@PathVariable Long id, @RequestParam Double cantidad) {
        productoService.aumentarStock(id, cantidad);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/disminuir-stock")
    public ResponseEntity<Void> disminuirStock(@PathVariable Long id, @RequestParam Double cantidad) {
        productoService.disminuirStock(id, cantidad);
        return ResponseEntity.ok().build();
    }
}

