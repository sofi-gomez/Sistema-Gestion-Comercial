package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Cliente;
import com.example.Sistema_Gestion.repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Cliente guardar(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public Cliente actualizar(Long id, Cliente cliente) {
        Cliente existente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        existente.setNombre(cliente.getNombre());
        existente.setDocumento(cliente.getDocumento());
        existente.setTelefono(cliente.getTelefono());
        existente.setEmail(cliente.getEmail());
        existente.setNotas(cliente.getNotas());
        return clienteRepository.save(existente);
    }

    public void eliminar(Long id) {
        clienteRepository.deleteById(id);
    }
}

