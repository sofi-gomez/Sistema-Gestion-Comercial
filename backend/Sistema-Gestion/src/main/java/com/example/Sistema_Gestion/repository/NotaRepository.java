package com.example.Sistema_Gestion.repository;

import com.example.Sistema_Gestion.model.Nota;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotaRepository extends JpaRepository<Nota, Long> {
    List<Nota> findByClienteId(Long clienteId);
    List<Nota> findByClienteIdAndEstado(Long clienteId, Nota.EstadoNota estado);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(n.monto), 0) FROM Nota n WHERE n.cliente.id = :clienteId AND n.tipo = 'DEBITO'")
    java.math.BigDecimal totalDebitoPorCliente(@org.springframework.data.repository.query.Param("clienteId") Long clienteId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(n.monto), 0) FROM Nota n WHERE n.cliente.id = :clienteId AND n.tipo = 'CREDITO'")
    java.math.BigDecimal totalCreditoPorCliente(@org.springframework.data.repository.query.Param("clienteId") Long clienteId);
}
