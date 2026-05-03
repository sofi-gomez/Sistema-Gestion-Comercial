package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Cliente;
import com.example.Sistema_Gestion.repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    public Cliente guardar(Cliente cliente) {
        // Limpieza de datos
        if (cliente.getNombre() != null) cliente.setNombre(cliente.getNombre().trim());
        if (cliente.getDocumento() != null) {
            // Limpiar CUIT/DNI: solo números
            String limpio = cliente.getDocumento().replaceAll("[^0-9]", "");
            cliente.setDocumento(limpio);
        }

        // Verificación de duplicados
        if (cliente.getDocumento() != null && !cliente.getDocumento().isEmpty()) {
            clienteRepository.findByDocumento(cliente.getDocumento()).ifPresent(c -> {
                throw new RuntimeException("El documento/CUIT '" + cliente.getDocumento() + "' ya existe para el cliente: " + c.getNombre());
            });
        }

        return clienteRepository.save(cliente);
    }

    public Cliente actualizar(Long id, Cliente cliente) {
        Cliente existente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        String nuevoDoc = cliente.getDocumento() != null ? cliente.getDocumento().replaceAll("[^0-9]", "") : "";
        
        // Verificación de duplicado si el documento cambió
        if (!nuevoDoc.isEmpty()) {
            clienteRepository.findByDocumento(nuevoDoc).ifPresent(c -> {
                if (!c.getId().equals(id)) {
                    throw new RuntimeException("No se puede actualizar: El documento '" + nuevoDoc + "' ya pertenece a otro cliente (" + c.getNombre() + ")");
                }
            });
        }

        existente.setNombre(cliente.getNombre() != null ? cliente.getNombre().trim() : "");
        existente.setDocumento(nuevoDoc);
        existente.setTelefono(cliente.getTelefono());
        existente.setEmail(cliente.getEmail());
        existente.setDireccion(cliente.getDireccion());
        existente.setNotas(cliente.getNotas());

        return clienteRepository.save(existente);
    }

    public void eliminar(Long id) {
        clienteRepository.deleteById(id);
    }
}