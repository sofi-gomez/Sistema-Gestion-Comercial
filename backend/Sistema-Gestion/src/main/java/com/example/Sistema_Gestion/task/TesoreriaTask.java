package com.example.Sistema_Gestion.task;

import com.example.Sistema_Gestion.model.MovimientoTesoreria;
import com.example.Sistema_Gestion.repository.MovimientoTesoreriaRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
public class TesoreriaTask {

    private final MovimientoTesoreriaRepository movimientoRepository;

    public TesoreriaTask(MovimientoTesoreriaRepository movimientoRepository) {
        this.movimientoRepository = movimientoRepository;
    }

    /**
     * Se ejecuta todos los días a las 00:01 AM.
     * Busca cheques en cartera cuya fecha de cobro haya llegado y los marca como
     * cobrados.
     */
    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void procesarCobroAutomaticoCheques() {
        LocalDate hoy = LocalDate.now();

        // Buscar movimientos tipo CHEQUE o CHEQUE_ELECTRONICO, no anulados, no cobrados
        // aún,
        // cuya fecha de cobro sea hoy o anterior.
        List<MovimientoTesoreria> chequesParaCobrar = movimientoRepository.findAll().stream()
                .filter(m -> !m.getAnulado() && !m.getCobrado())
                .filter(m -> "CHEQUE".equals(m.getMedioPago()) || "CHEQUE_ELECTRONICO".equals(m.getMedioPago()))
                .filter(m -> m.getFechaCobro() != null && !m.getFechaCobro().isAfter(hoy))
                .toList();

        for (MovimientoTesoreria cheque : chequesParaCobrar) {
            cheque.setCobrado(true);
            movimientoRepository.save(cheque);
        }
    }
}
