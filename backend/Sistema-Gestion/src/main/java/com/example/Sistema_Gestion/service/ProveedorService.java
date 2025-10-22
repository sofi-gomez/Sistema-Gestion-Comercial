package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Proveedor;
import com.example.Sistema_Gestion.repository.ProveedorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    public List<Proveedor> listarTodos() {
        return proveedorRepository.findAll();
    }

    public Proveedor guardar(Proveedor proveedor) {
        return proveedorRepository.save(proveedor);
    }

    public Proveedor actualizar(Long id, Proveedor proveedor) {
        Proveedor existente = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        existente.setNombre(proveedor.getNombre());
        existente.setCuit(proveedor.getCuit());
        existente.setDireccion(proveedor.getDireccion());
        existente.setTelefono(proveedor.getTelefono());
        existente.setEmail(proveedor.getEmail());
        existente.setCondicionIva(proveedor.getCondicionIva());
        existente.setNotas(proveedor.getNotas());
        return proveedorRepository.save(existente);
    }

    public void eliminar(Long id) {
        proveedorRepository.deleteById(id);
    }
}
