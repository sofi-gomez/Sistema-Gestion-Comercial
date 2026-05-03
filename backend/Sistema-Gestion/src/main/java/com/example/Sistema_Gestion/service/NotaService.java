package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Cliente;
import com.example.Sistema_Gestion.model.Nota;
import com.example.Sistema_Gestion.repository.ClienteRepository;
import com.example.Sistema_Gestion.repository.NotaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class NotaService {

    private final NotaRepository notaRepository;
    private final ClienteRepository clienteRepository;

    public NotaService(NotaRepository notaRepository, ClienteRepository clienteRepository) {
        this.notaRepository = notaRepository;
        this.clienteRepository = clienteRepository;
    }

    public List<Nota> buscarPorCliente(Long clienteId) {
        return notaRepository.findByClienteId(clienteId);
    }

    public List<Nota> buscarPendientesPorCliente(Long clienteId) {
        return notaRepository.findByClienteIdAndEstado(clienteId, Nota.EstadoNota.PENDIENTE);
    }

    @Transactional
    public Nota crearNota(Long clienteId, Nota.TipoNota tipo, BigDecimal monto, String motivo) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Nota nota = new Nota();
        nota.setCliente(cliente);
        nota.setTipo(tipo);
        nota.setMonto(monto);
        nota.setMotivo(motivo);
        nota.setFecha(LocalDate.now());
        
        // El número puede ser autogenerado o usar el count
        long count = notaRepository.count();
        nota.setNumero(count + 1);

        if (tipo == Nota.TipoNota.CREDITO) {
            nota.setEstado(Nota.EstadoNota.PAGADA); // Las NC se aplican al saldo global, no se "pagan"
        } else {
            nota.setEstado(Nota.EstadoNota.PENDIENTE);
        }

        return notaRepository.save(nota);
    }
    
    @Transactional
    public void actualizarEstadoPostCobro(Nota nota, BigDecimal totalCobrado) {
        if (nota.getTipo() == Nota.TipoNota.DEBITO && totalCobrado.compareTo(nota.getMonto()) >= 0) {
            nota.setEstado(Nota.EstadoNota.PAGADA);
            notaRepository.save(nota);
        }
    }
}
