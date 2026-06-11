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
    private final ConfiguracionService configuracionService;

    public NotaService(NotaRepository notaRepository, ClienteRepository clienteRepository, ConfiguracionService configuracionService) {
        this.notaRepository = notaRepository;
        this.clienteRepository = clienteRepository;
        this.configuracionService = configuracionService;
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

    public void generarPdfNota(Long notaId, java.io.OutputStream os, byte[] logoBytes) throws Exception {
        Nota nota = notaRepository.findById(notaId)
                .orElseThrow(() -> new RuntimeException("Nota no encontrada: " + notaId));

        try (org.apache.pdfbox.pdmodel.PDDocument doc = new org.apache.pdfbox.pdmodel.PDDocument()) {
            org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage(org.apache.pdfbox.pdmodel.common.PDRectangle.A4);
            doc.addPage(page);
            org.apache.pdfbox.pdmodel.PDPageContentStream cs = new org.apache.pdfbox.pdmodel.PDPageContentStream(doc, page);

            float w = page.getMediaBox().getWidth();
            float h = page.getMediaBox().getHeight();
            float margin = 40f;
            float y = h - margin;

            // ----- LOGO -----
            if (logoBytes != null) {
                try {
                    org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject logo = org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject.createFromByteArray(doc, logoBytes, "logo");
                    cs.drawImage(logo, margin, y - 120, 140, 140);
                } catch (Exception ignored) {}
            }

            // ----- ENCABEZADO -----
            String tipoDocumento = nota.getTipo() == Nota.TipoNota.DEBITO ? "NOTA DE DÉBITO" : "NOTA DE CRÉDITO";
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 22);
            float titleWidth = org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD.getStringWidth(tipoDocumento) / 1000 * 22;
            cs.newLineAtOffset((w - titleWidth) / 2f, y - 28);
            cs.showText(tipoDocumento);
            cs.endText();

            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 13);
            String docNumStr = "N° " + String.format("%05d", nota.getNumero());
            float docNumWidth = org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD.getStringWidth(docNumStr) / 1000 * 13;
            cs.newLineAtOffset((w - docNumWidth) / 2f, y - 50);
            cs.showText(docNumStr);
            cs.endText();

            String fecha = nota.getFecha() != null
                    ? nota.getFecha().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(w - margin - 100, y - 28);
            cs.showText("Fecha: " + fecha);
            cs.endText();

            // Línea separadora
            y -= 150;
            cs.setLineWidth(1f);
            cs.moveTo(margin, y);
            cs.lineTo(w - margin, y);
            cs.stroke();

            // ----- EMPRESA -----
            y -= 22;
            com.example.Sistema_Gestion.model.Configuracion config = configuracionService.getConfiguracion();
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 10);
            cs.newLineAtOffset(margin, y);
            cs.showText(config.getNombreEmpresa() != null ? config.getNombreEmpresa() : "Mi Empresa");
            cs.endText();

            y -= 14;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 8);
            cs.newLineAtOffset(margin, y);
            cs.showText("CUIL: " + (config.getCuit() != null ? config.getCuit() : "—"));
            cs.endText();

            y -= 12;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 8);
            cs.newLineAtOffset(margin, y);
            cs.showText("Dirección: " + (config.getDireccion() != null ? config.getDireccion() : "—"));
            cs.endText();

            // ----- CLIENTE -----
            y -= 25;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, y);
            cs.showText("DATOS DEL CLIENTE");
            cs.endText();

            y -= 18;
            String clienteNombre = nota.getCliente() != null ? nota.getCliente().getNombre() : "—";
            String clienteCuit = (nota.getCliente() != null && nota.getCliente().getDocumento() != null)
                    ? nota.getCliente().getDocumento()
                    : "—";
            
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 10);
            cs.newLineAtOffset(margin, y); cs.showText("Cliente:"); cs.endText();
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(margin + 60, y); cs.showText(safeString(clienteNombre)); cs.endText();
            
            y -= 16;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 10);
            cs.newLineAtOffset(margin, y); cs.showText("CUIT:"); cs.endText();
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(margin + 60, y); cs.showText(safeString(clienteCuit)); cs.endText();

            // Línea separadora
            y -= 18;
            cs.setLineWidth(0.5f);
            cs.moveTo(margin, y);
            cs.lineTo(w - margin, y);
            cs.stroke();

            // ----- DETALLE -----
            y -= 20;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, y);
            cs.showText("DETALLE DE LA NOTA");
            cs.endText();

            y -= 20;
            cs.setNonStrokingColor(new java.awt.Color(230, 230, 230));
            cs.addRect(margin, y - 18, w - 2 * margin, 18);
            cs.fill();
            cs.setNonStrokingColor(java.awt.Color.BLACK);
            cs.setLineWidth(0.4f);
            cs.addRect(margin, y - 18, w - 2 * margin, 18);
            cs.stroke();

            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(margin + 5, y - 13); cs.showText("Motivo"); cs.endText();
            
            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(w - margin - 80, y - 13); cs.showText("Monto"); cs.endText();

            y -= 18;
            cs.setLineWidth(0.2f);
            cs.addRect(margin, y - 16, w - 2 * margin, 16);
            cs.stroke();

            String motivoStr = safeString(nota.getMotivo());
            if (motivoStr.isEmpty()) motivoStr = "Sin motivo especificado";
            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(margin + 5, y - 11); cs.showText(motivoStr); cs.endText();

            String montoStr = "$ " + (nota.getMonto() != null
                    ? nota.getMonto().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString()
                    : "0.00");
            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(w - margin - 78, y - 11); cs.showText(montoStr); cs.endText();

            // Total
            y -= 40;
            cs.setLineWidth(1f);
            cs.moveTo(margin, y);
            cs.lineTo(w - margin, y);
            cs.stroke();
            y -= 18;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
            cs.newLineAtOffset(w - margin - 200, y);
            cs.showText("MONTO TOTAL: " + montoStr);
            cs.endText();

            // Pie
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 7);
            cs.newLineAtOffset(w / 2f - 100, 30);
            cs.showText("DOCUMENTO NO VÁLIDO COMO FACTURA");
            cs.endText();

            cs.close();
            doc.save(os);
        }
    }

    private String safeString(String s) {
        if (s == null) return "";
        return s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ');
    }
}
