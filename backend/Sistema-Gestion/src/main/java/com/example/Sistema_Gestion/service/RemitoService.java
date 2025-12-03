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
import java.math.BigDecimal;
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

    // --- NUEVO MÉTODO PARA ACTUALIZAR ---
    @Transactional
    public Remito actualizarRemito(Remito remito) {
        // Verificar que el remito existe
        Remito remitoExistente = remitoRepository.findById(remito.getId())
                .orElseThrow(() -> new RuntimeException("Remito no encontrado"));

        // Mantener el número original (no cambiar la numeración al actualizar)
        remito.setNumero(remitoExistente.getNumero());

        // Eliminar los items existentes antes de agregar los nuevos
        remitoItemRepository.deleteByRemitoId(remito.getId());

        // Asociar los nuevos items con el remito
        if (remito.getItems() != null) {
            for (RemitoItem item : remito.getItems()) {
                item.setRemito(remito);
                // Asegurar que el ID del item sea null para que se cree como nuevo
                item.setId(null);
            }
        }

        // Actualizar fecha de modificación
        remito.preUpdate();

        // Guardar el remito actualizado
        return remitoRepository.save(remito);
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

    public void generarPdfRemito(Remito remito, OutputStream os, byte[] logoBytes) throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float w = page.getMediaBox().getWidth();
            float h = page.getMediaBox().getHeight();
            float margin = 40;
            float x = margin;
            float y = h - margin;

            // Logo en esquina superior izquierda
            if (logoBytes != null) {
                try {
                    PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, logoBytes, "logo");
                    float logoW = 60;
                    float logoH = 60;
                    cs.drawImage(pdImage, x, y - logoH, logoW, logoH);
                } catch (Exception ex) {
                    // Continuar sin logo
                }
            }

            // Título "REMITO" centrado
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 24);
            cs.newLineAtOffset(w/2 - 40, y - 30);
            cs.showText("REMITO");
            cs.endText();

            // Número de remito
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 14);
            cs.newLineAtOffset(w/2 - 20, y - 55);
            cs.showText("N° " + remito.getNumero());
            cs.endText();

            // Fecha alineada a la derecha
            String fecha = remito.getFecha() != null
                    ? remito.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(w - margin - 80, y - 30);
            cs.showText("Fecha: " + fecha);
            cs.endText();

            // Línea separadora después del header
            y -= 80;
            cs.setLineWidth(1f);
            cs.moveTo(x, y);
            cs.lineTo(w - margin, y);
            cs.stroke();

            // SECCIÓN DATOS DEL CLIENTE - Estilo tabla
            y -= 30;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
            cs.newLineAtOffset(x, y);
            cs.showText("DATOS DEL CLIENTE");
            cs.endText();

            // Información del cliente en formato de tabla limpia
            float infoStartY = y - 25;
            String[][] clienteData = {
                    {"Nombre:", safeString(remito.getClienteNombre())},
                    {"Dirección:", safeString(remito.getClienteDireccion())},
                    {"Código Postal:", safeString(remito.getClienteCodigoPostal())},
                    {"Condición IVA:", safeString(remito.getClienteAclaracion()).isEmpty() ?
                            "Consumidor Final" : formatCondicionIva(remito.getClienteAclaracion())}
            };

            float labelX = x;
            float valueX = x + 100;

            for (String[] data : clienteData) {
                if (!data[1].isEmpty()) {
                    // Label
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
                    cs.newLineAtOffset(labelX, infoStartY);
                    cs.showText(data[0]);
                    cs.endText();

                    // Value
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA, 10);
                    cs.newLineAtOffset(valueX, infoStartY);
                    cs.showText(data[1]);
                    cs.endText();

                    infoStartY -= 18;
                }
            }

            // Línea separadora antes de la tabla de items
            infoStartY -= 15;
            cs.setLineWidth(0.5f);
            cs.moveTo(x, infoStartY);
            cs.lineTo(w - margin, infoStartY);
            cs.stroke();

            // TABLA DE ITEMS - Estilo profesional
            float tableTop = infoStartY - 20;

            // Header de la tabla
            cs.setNonStrokingColor(240/255f, 240/255f, 240/255f);
            cs.addRect(x, tableTop - 25, w - 2 * margin, 25);
            cs.fill();
            cs.setNonStrokingColor(0, 0, 0);

            // Bordes del header
            cs.setLineWidth(0.5f);
            cs.addRect(x, tableTop - 25, w - 2 * margin, 25);
            cs.stroke();

            // Columnas
            float colCantX = x + 10;
            float colDescX = x + 80;

            // Títulos de columnas
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
            cs.newLineAtOffset(colCantX, tableTop - 15);
            cs.showText("CANTIDAD");
            cs.endText();

            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
            cs.newLineAtOffset(colDescX, tableTop - 15);
            cs.showText("DESCRIPCIÓN");
            cs.endText();

            // Filas de items
            float rowY = tableTop - 30;
            if (remito.getItems() != null && !remito.getItems().isEmpty()) {
                for (RemitoItem it : remito.getItems()) {
                    // Fila con borde sutil
                    cs.setLineWidth(0.2f);
                    cs.addRect(x, rowY - 20, w - 2 * margin, 20);
                    cs.stroke();

                    // Cantidad
                    String cantidad = formatCantidad(it.getCantidad());
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA, 10);
                    cs.newLineAtOffset(colCantX, rowY - 15);
                    cs.showText(cantidad);
                    cs.endText();

                    // Descripción
                    String desc = (it.getProducto() != null && it.getProducto().getNombre() != null)
                            ? it.getProducto().getNombre() : safeString(it.getNotas());
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA, 10);
                    cs.newLineAtOffset(colDescX, rowY - 15);
                    cs.showText(desc);
                    cs.endText();

                    rowY -= 22;

                    // Verificar si necesita nueva página
                    if (rowY < 150) {
                        cs.close();
                        page = new PDPage(PDRectangle.A4);
                        doc.addPage(page);
                        cs = new PDPageContentStream(doc, page);
                        rowY = h - margin - 40;
                        x = margin;
                    }
                }
            }

            // SECCIÓN INFERIOR - Diseño limpio
            float bottomY = Math.max(rowY - 30, 180);

            // Observaciones (si existen)
            String observaciones = safeString(remito.getObservaciones());
            if (!observaciones.isEmpty()) {
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
                cs.newLineAtOffset(x, bottomY);
                cs.showText("Observaciones:");
                cs.endText();

                bottomY -= 15;
                String[] obsLines = splitText(observaciones, 80);
                cs.setFont(PDType1Font.HELVETICA, 9);
                for (String line : obsLines) {
                    cs.beginText();
                    cs.newLineAtOffset(x, bottomY);
                    cs.showText("• " + line);
                    cs.endText();
                    bottomY -= 12;
                }
                bottomY -= 10;
            }

            // Línea separadora antes del total
            cs.setLineWidth(0.5f);
            cs.moveTo(x, bottomY);
            cs.lineTo(w - margin, bottomY);
            cs.stroke();

            // Total a pagar - diseño simple
            bottomY -= 25;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(x, bottomY);
            cs.showText("TOTAL A PAGAR: $ ___________________");
            cs.endText();

            // Firma - alineada a la derecha
            bottomY -= 30;
            float firmaX = w - margin - 150;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(firmaX, bottomY);
            cs.showText("Firma:");
            cs.endText();

            // Línea para firma
            cs.setLineWidth(0.8f);
            cs.moveTo(firmaX + 30, bottomY - 2);
            cs.lineTo(firmaX + 150, bottomY - 2);
            cs.stroke();

            // Aclaración final centrada
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 8);
            cs.newLineAtOffset(w/2 - 120, 40);
            cs.showText("PRECIOS EN PESOS ARGENTINOS - DOCUMENTO NO VÁLIDO COMO FACTURA");
            cs.endText();

            cs.close();
            doc.save(os);
        }
    }

    // Método helper para formatear la condición de IVA
    private String formatCondicionIva(String condicionIva) {
        if (condicionIva == null || condicionIva.isEmpty()) {
            return "Consumidor Final";
        }

        switch (condicionIva.toUpperCase()) {
            case "CONSUMIDOR_FINAL":
                return "Consumidor Final";
            case "RESPONSABLE_INSCRIPTO":
                return "Responsable Inscripto";
            case "MONOTRIBUTO":
                return "Monotributista";
            case "EXENTO":
                return "Exento";
            case "NO_RESPONSABLE":
                return "No Responsable";
            default:
                return condicionIva;
        }
    }

    // Método helper para formatear cantidades
    private String formatCantidad(BigDecimal cantidad) {
        if (cantidad == null) return "0";
        if (cantidad.stripTrailingZeros().scale() <= 0) {
            return cantidad.toBigInteger().toString();
        }
        return cantidad.setScale(2, java.math.RoundingMode.HALF_UP).toString();
    }

    // Método helper para dividir texto en líneas
    private String[] splitText(String text, int maxLength) {
        if (text.length() <= maxLength) {
            return new String[]{text};
        }
        java.util.List<String> lines = new java.util.ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + maxLength, text.length());
            if (end < text.length()) {
                int lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace > start) {
                    end = lastSpace;
                }
            }
            lines.add(text.substring(start, end).trim());
            start = end;
        }
        return lines.toArray(new String[0]);
    }

    // Helper para strings seguros
    private String safeString(String s) {
        return s == null ? "" : s;
    }
}