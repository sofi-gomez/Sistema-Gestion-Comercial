package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Producto;
import com.example.Sistema_Gestion.service.ProductoService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@Slf4j
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
    public ResponseEntity<Producto> buscarPorId(@PathVariable("id") Long id) {
        return productoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Producto crear(@RequestBody Producto producto) {
        log.info("Creando nuevo producto: {}", producto.getNombre());
        return productoService.guardar(producto);
    }

    @PutMapping("/{id}")
    public Producto actualizar(@PathVariable("id") Long id, @RequestBody Producto producto) {
        log.info("Actualizando producto ID: {}", id);
        producto.setId(id);
        return productoService.guardar(producto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        log.info("Eliminando producto ID: {}", id);
        productoService.eliminar(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/aumentar-stock")
    public ResponseEntity<Void> aumentarStock(@PathVariable("id") Long id, @RequestParam("cantidad") Integer cantidad) {
        log.info("Aumentando stock del producto ID: {} en {}", id, cantidad);
        productoService.aumentarStock(id, cantidad);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/descontar-stock")
    public ResponseEntity<Void> descontarStock(@PathVariable("id") Long id,
            @RequestParam("cantidad") Integer cantidad) {
        boolean exito = productoService.descontarStock(id, cantidad);
        if (exito) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<?> getDashboardSummary() {
        return ResponseEntity.ok(productoService.getDashboardSummary());
    }

    @PostMapping("/actualizar-precios")
    public ResponseEntity<Void> actualizarPrecios(@RequestParam("porcentaje") Double porcentaje,
            @RequestParam("tipo") String tipo) {
        productoService.actualizarPreciosMasivo(porcentaje, tipo);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/exportar-excel")
    public ResponseEntity<Resource> exportarExcel() throws IOException {
        byte[] data = productoService.exportarExcel();
        ByteArrayResource resource = new ByteArrayResource(data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=productos.xlsx")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(data.length)
                .body(resource);
    }

    @PostMapping("/importar-excel")
    public ResponseEntity<Void> importarExcel(@RequestParam("file") MultipartFile file) throws IOException {
        productoService.importarExcel(file.getInputStream());
        return ResponseEntity.ok().build();
    }
}