package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.model.RemitoItem;
import com.example.Sistema_Gestion.repository.RemitoItemRepository;
import com.example.Sistema_Gestion.repository.RemitoRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class RemitoService {

    private final RemitoRepository remitoRepository;
    private final RemitoItemRepository remitoItemRepository;

    public RemitoService(RemitoRepository remitoRepository,
                         RemitoItemRepository remitoItemRepository) {
        this.remitoRepository = remitoRepository;
        this.remitoItemRepository = remitoItemRepository;
    }

    // --- Métodos que el controlador espera ----------------
    public List<Remito> listarTodos() {
        return remitoRepository.findAll();
    }

    public Optional<Remito> buscarPorId(Long id) {
        return remitoRepository.findById(id);
    }

    @Transactional
    public Remito generarRemito(Remito remito) {
        // numeración automática (similar a lo que hiciste para ventas)
        Long max = remitoRepository.findMaxNumero();
        Long numero = (max != null && max > 0) ? max + 1 : 1L;
        remito.setNumero(numero);

        // asociar items -> importante para que remito_id no quede null al persistir
        if (remito.getItems() != null) {
            for (RemitoItem item : remito.getItems()) {
                item.setRemito(remito);
            }
        }

        // persistir (cascade ALL en Remito.items debe salvar los items)
        Remito saved = remitoRepository.save(remito);
        return saved;
    }
    // -------------------------------------------------------

    // Tu método para generar PDF (no lo toqué, sólo lo dejé público)
    public void generarPdfRemito(Remito remito, OutputStream os, byte[] logoBytes) throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);

            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float w = page.getMediaBox().getWidth();
            float h = page.getMediaBox().getHeight();
            float margin = 40;
            float x = margin;
            float y = h - margin;

            // Logo
            if (logoBytes != null) {
                try {
                    PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, logoBytes, "logo");
                    float logoW = 80;
                    float logoH = 80;
                    cs.drawImage(pdImage, x, y - logoH, logoW, logoH);
                } catch (Exception ex) { }
            }

            // Título REMITO y aclaración
            float rightStart = w - margin;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 26);
            cs.newLineAtOffset(rightStart - 220, y - 10);
            cs.showText("REMITO");
            cs.endText();

            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_OBLIQUE, 10);
            cs.newLineAtOffset(rightStart - 220, y - 40);
            cs.showText("Documento no válido como factura");
            cs.endText();

            // Fecha
            String fecha = remito.getFecha() != null
                    ? remito.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(rightStart - 220, y - 70);
            cs.showText("Fecha: " + fecha);
            cs.endText();

            // Datos cliente
            float clienteY = y - 120;
            cs.setLineWidth(0.8f);
            cs.moveTo(margin, clienteY + 18);
            cs.lineTo(w - margin, clienteY + 18);
            cs.stroke();

            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 14);
            cs.newLineAtOffset(margin, clienteY);
            cs.showText("Datos del cliente:");
            cs.endText();

            // nombre / direccion / cp / aclaracion — leemos los campos que agregaste en Remito
            float textY = clienteY - 18;
            String clienteNombre = safeString(remito.getClienteNombre() != null ? remito.getClienteNombre() :
                    (remito.getCliente() != null ? remito.getCliente().getNombre() : ""));
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 11);
            cs.newLineAtOffset(margin, textY);
            cs.showText(clienteNombre);
            cs.endText();

            textY -= 14;
            String direccion = safeString(remito.getClienteDireccion());
            cs.beginText();
            cs.newLineAtOffset(margin, textY);
            cs.showText(direccion);
            cs.endText();

            textY -= 14;
            String cp = safeString(remito.getClienteCodigoPostal());
            cs.beginText();
            cs.newLineAtOffset(margin, textY);
            cs.showText(cp);
            cs.endText();

            textY -= 14;
            String aclar = safeString(remito.getClienteAclaracion());
            if (aclar.isBlank()) aclar = "Consumidor final";
            cs.beginText();
            cs.newLineAtOffset(margin, textY);
            cs.showText(aclar);
            cs.endText();

            // separador
            float tableTop = textY - 28;
            cs.setLineWidth(1f);
            cs.moveTo(margin, tableTop);
            cs.lineTo(w - margin, tableTop);
            cs.stroke();

            // headers tabla CANT / DESCRIPCIÓN (estilo simple)
            float tableY = tableTop - 20;
            float colCantW = 60;
            float colDescW = w - margin*2 - colCantW;

            cs.addRect(margin, tableY + 6, w - margin * 2, 22);
            cs.setNonStrokingColor(220/255f,220/255f,220/255f);
            cs.fill();
            cs.setNonStrokingColor(0,0,0);

            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin + 6, tableY + 12);
            cs.showText("CANT.");
            cs.endText();

            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin + colCantW + 10, tableY + 12);
            cs.showText("DESCRIPCION");
            cs.endText();

            // filas items
            float rowY = tableY - 10;
            cs.setFont(PDType1Font.HELVETICA, 11);
            if (remito.getItems() != null) {
                for (RemitoItem it : remito.getItems()) {
                    if (rowY < 100) {
                        cs.close();
                        page = new PDPage(PDRectangle.LETTER);
                        doc.addPage(page);
                        cs = new PDPageContentStream(doc, page);
                        rowY = page.getMediaBox().getHeight() - margin - 40;
                    }

                    cs.beginText();
                    cs.newLineAtOffset(margin + 6, rowY);
                    String cant = it.getCantidad() != null ? it.getCantidad().toString() : "0";
                    cs.showText(cant);
                    cs.endText();

                    String desc = (it.getProducto() != null && it.getProducto().getNombre() != null)
                            ? it.getProducto().getNombre() : safeString(it.getNotas());
                    if (desc.length() > 90) desc = desc.substring(0, 87) + "...";
                    cs.beginText();
                    cs.newLineAtOffset(margin + colCantW + 6, rowY);
                    cs.showText(desc);
                    cs.endText();

                    rowY -= 18;
                }
            }

            // Observaciones
            float obsY = rowY - 20;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, obsY);
            cs.showText("Observaciones:");
            cs.endText();

            obsY -= 14;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(margin, obsY);
            String obs = safeString(remito.getObservaciones());
            if (obs.length() > 400) obs = obs.substring(0, 397) + "...";
            cs.showText(obs);
            cs.endText();

            // aclaración final
            obsY -= 18;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(margin, obsY);
            cs.showText("PRECIOS EN PESOS SIN IVA");
            cs.endText();

            cs.close();
            doc.save(os);
        }
    }

    // helpers
    private String safeString(String s) {
        return s == null ? "" : s;
    }
}
