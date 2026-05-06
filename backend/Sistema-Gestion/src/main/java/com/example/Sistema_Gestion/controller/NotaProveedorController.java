package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Nota;
import com.example.Sistema_Gestion.service.ProveedorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notas-proveedor")
public class NotaProveedorController {

    private final ProveedorService proveedorService;

    public NotaProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @PostMapping
    public ResponseEntity<Nota> crearNota(@RequestParam("proveedorId") Long proveedorId, @RequestBody Nota nota) {
        Nota creada = proveedorService.crearNotaProveedor(proveedorId, nota);
        return ResponseEntity.ok(creada);
    }

    @GetMapping("/proveedor/{id}")
    public ResponseEntity<List<Nota>> listarPorProveedor(@PathVariable("id") Long id) {
        return ResponseEntity.ok(proveedorService.listarNotasPorProveedor(id));
    }

    @DeleteMapping("/{id}/anular")
    public ResponseEntity<Void> anularNota(@PathVariable("id") Long id) {
        proveedorService.anularNotaProveedor(id);
        return ResponseEntity.noContent().build();
    }
}
