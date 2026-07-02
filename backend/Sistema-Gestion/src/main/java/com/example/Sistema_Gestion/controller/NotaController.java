package com.example.Sistema_Gestion.controller;

import com.example.Sistema_Gestion.model.Nota;
import com.example.Sistema_Gestion.service.NotaService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/notas")
public class NotaController {

    private final NotaService notaService;

    public NotaController(NotaService notaService) {
        this.notaService = notaService;
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Nota> listarPorCliente(@PathVariable Long clienteId) {
        return notaService.buscarPorCliente(clienteId);
    }

    @GetMapping("/cliente/{clienteId}/pendientes")
    public List<Nota> listarPendientesPorCliente(@PathVariable Long clienteId) {
        return notaService.buscarPendientesPorCliente(clienteId);
    }

    @PostMapping("/cliente/{clienteId}")
    public Nota crearNota(@PathVariable Long clienteId, @RequestBody CrearNotaRequest request) {
        return notaService.crearNota(
                clienteId,
                Nota.TipoNota.valueOf(request.getTipo()),
                request.getMonto(),
                request.getMotivo()
        );
    }

    @GetMapping("/{id}/pdf")
    public org.springframework.http.ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        try {
            byte[] logo = null;
            try {
                String logoPath = "C:\\Users\\leone\\OneDrive\\Desktop\\Sistema-Gestion-Comercial\\frontend\\public\\Copia de Copia de Leonel.png";
                java.io.File logoFile = new java.io.File(logoPath);
                if (logoFile.exists()) {
                    logo = java.nio.file.Files.readAllBytes(logoFile.toPath());
                }
            } catch (Exception ignored) {}

            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            notaService.generarPdfNota(id, baos, logo);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "nota-" + id + ".pdf");
            return org.springframework.http.ResponseEntity.ok().headers(headers).body(baos.toByteArray());
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}/anular")
    public org.springframework.http.ResponseEntity<Void> anularNota(@PathVariable Long id) {
        notaService.anularNota(id);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    public static class CrearNotaRequest {
        private String tipo;
        private BigDecimal monto;
        private String motivo;

        public String getTipo() {
            return tipo;
        }

        public void setTipo(String tipo) {
            this.tipo = tipo;
        }

        public BigDecimal getMonto() {
            return monto;
        }

        public void setMonto(BigDecimal monto) {
            this.monto = monto;
        }

        public String getMotivo() {
            return motivo;
        }

        public void setMotivo(String motivo) {
            this.motivo = motivo;
        }
    }
}
