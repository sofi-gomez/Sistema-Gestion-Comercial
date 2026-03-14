package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Compra;
import com.example.Sistema_Gestion.model.CompraItem;
import com.example.Sistema_Gestion.model.PagoProveedor;
import com.example.Sistema_Gestion.model.Proveedor;
import com.example.Sistema_Gestion.repository.ProveedorRepository;
import com.example.Sistema_Gestion.repository.CompraRepository;
import com.example.Sistema_Gestion.repository.PagoProveedorRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Stream;

import java.util.List;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final CompraRepository compraRepository;
    private final PagoProveedorRepository pagoProveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository,
            CompraRepository compraRepository,
            PagoProveedorRepository pagoProveedorRepository) {
        this.proveedorRepository = proveedorRepository;
        this.compraRepository = compraRepository;
        this.pagoProveedorRepository = pagoProveedorRepository;
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

    public Map<String, Object> getDashboardSummary() {
        List<Proveedor> todos = proveedorRepository.findAll();

        BigDecimal deudaTotal = todos.stream()
                .map(p -> compraRepository.findTotalCompradoPorProveedor(p.getId()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new HashMap<>();
        summary.put("cuentasPorPagar", deudaTotal);
        summary.put("totalProveedores", todos.size());

        return summary;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Map<String, Object> generarReporteCuentaCorriente(Long proveedorId, LocalDate desde, LocalDate hasta) {
        Proveedor prov = proveedorRepository.findById(proveedorId).orElseThrow();
        LocalDateTime desdeDT = desde.atStartOfDay();
        LocalDateTime hastaDT = hasta.atTime(LocalTime.MAX);

        // 1. Saldo Inicial
        BigDecimal comprasPre = compraRepository.totalCompradoAntesDe(proveedorId, desdeDT);
        BigDecimal pagosPre = pagoProveedorRepository.totalPagadoAntesDe(proveedorId, desde);
        BigDecimal saldoInicial = comprasPre.subtract(pagosPre);

        // 2. Movimientos del periodo
        List<Compra> compras = compraRepository.findByProveedorIdAndFechaBetweenOrderByFechaAsc(proveedorId, desdeDT,
                hastaDT);
        List<PagoProveedor> pagos = pagoProveedorRepository.findByProveedorIdAndFechaBetweenOrderByFechaAsc(proveedorId,
                desde, hasta).stream().filter(p -> !p.getAnulado()).toList();

        BigDecimal currentSaldo = saldoInicial;
        List<Map<String, Object>> movs = new ArrayList<>();

        // Unificar y ordenar por fecha para calcular saldo acumulado
        List<Object> unificado = Stream.concat(compras.stream(), pagos.stream())
                .sorted((o1, o2) -> {
                    LocalDateTime f1 = (o1 instanceof Compra) ? ((Compra) o1).getFecha()
                            : ((PagoProveedor) o1).getFecha().atStartOfDay();
                    LocalDateTime f2 = (o2 instanceof Compra) ? ((Compra) o2).getFecha()
                            : ((PagoProveedor) o2).getFecha().atStartOfDay();
                    return f1.compareTo(f2);
                }).toList();

        BigDecimal totalCompras = BigDecimal.ZERO;
        BigDecimal totalPagos = BigDecimal.ZERO;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        for (Object item : unificado) {
            if (item instanceof Compra c) {
                String remitoProv = (c.getAnotaciones() != null && !c.getAnotaciones().isEmpty()) ? c.getAnotaciones()
                        : "RM-" + c.getNumero();

                // 1. Fila de Encabezado de la Compra/Remito
                Map<String, Object> header = new HashMap<>();
                header.put("fecha", c.getFecha().format(dtf));
                header.put("tipo", "COMPRA");
                header.put("numeroDocumento", remitoProv);
                header.put("descripcion", "REMITO N° " + remitoProv);
                header.put("isHeader", true);
                header.put("idOriginal", c.getId());
                header.put("tipoOriginal", "COMPRA");
                header.put("debe", BigDecimal.ZERO);
                header.put("haber", BigDecimal.ZERO);
                header.put("saldo", currentSaldo);
                movs.add(header);

                if (c.getItems() != null && !c.getItems().isEmpty()) {
                    for (CompraItem it : c.getItems()) {
                        Map<String, Object> m = new HashMap<>();
                        m.put("fecha", ""); // No repetimos para ítems
                        m.put("tipo", "ITEM");
                        m.put("numeroDocumento", "");
                        m.put("descripcion", it.getProducto().getNombre());
                        m.put("cantidad", it.getCantidad());
                        m.put("precioUnitario", it.getPrecioUnitario());
                        m.put("debe", it.getSubtotal());
                        m.put("haber", BigDecimal.ZERO);
                        m.put("isHeader", false);

                        currentSaldo = currentSaldo.add(it.getSubtotal());
                        totalCompras = totalCompras.add(it.getSubtotal());
                        m.put("saldo", currentSaldo);
                        movs.add(m);
                    }
                } else {
                    Map<String, Object> m = new HashMap<>();
                    m.put("fecha", "");
                    m.put("tipo", "ITEM");
                    m.put("numeroDocumento", "");
                    m.put("descripcion", "Compra de mercadería");
                    m.put("debe", c.getTotal());
                    m.put("haber", BigDecimal.ZERO);
                    m.put("isHeader", false);

                    currentSaldo = currentSaldo.add(c.getTotal());
                    totalCompras = totalCompras.add(c.getTotal());
                    m.put("saldo", currentSaldo);
                    movs.add(m);
                }
            } else {
                PagoProveedor p = (PagoProveedor) item;
                Map<String, Object> m = new HashMap<>();
                m.put("fecha", p.getFecha().format(dtf));
                m.put("tipo", "PAGO");
                m.put("numeroDocumento", "PAGO-" + p.getId());
                m.put("descripcion", "COMPROBANTE DE PAGO N° " + p.getId()
                        + (p.getObservaciones() != null ? " (" + p.getObservaciones() + ")" : ""));
                m.put("debe", BigDecimal.ZERO);
                m.put("haber", p.getImporte());
                m.put("isHeader", true); // Pagos como nivel principal
                m.put("idOriginal", p.getId());
                m.put("tipoOriginal", "PAGO");

                m.put("medio", p.getMedio());
                m.put("banco", p.getBanco());
                m.put("numeroCheque", p.getNumeroCheque());
                m.put("fechaVenc", p.getFechaVenc() != null ? p.getFechaVenc().format(dtf) : null);

                currentSaldo = currentSaldo.subtract(p.getImporte());
                totalPagos = totalPagos.add(p.getImporte());
                m.put("saldo", currentSaldo);
                movs.add(m);
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("proveedor", Map.of("id", prov.getId(), "nombre", prov.getNombre(), "cuit",
                prov.getCuit() != null ? prov.getCuit() : ""));
        res.put("periodo", Map.of("desde", desde.toString(), "hasta", hasta.toString()));
        res.put("saldoInicial", saldoInicial);
        res.put("movimientos", movs);
        res.put("totalCompras", totalCompras);
        res.put("totalPagos", totalPagos);
        res.put("saldoFinal", currentSaldo);

        return res;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public void exportarReportePdf(Long proveedorId, LocalDate desde, LocalDate hasta, OutputStream os,
            byte[] logoBytes) throws Exception {
        Map<String, Object> data = generarReporteCuentaCorriente(proveedorId, desde, hasta);
        Map<String, String> prov = (Map<String, String>) data.get("proveedor");
        List<Map<String, Object>> movimientos = (List<Map<String, Object>>) data.get("movimientos");

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);

            float w = page.getMediaBox().getWidth();
            float h = page.getMediaBox().getHeight();
            float margin = 40;
            float y = h - margin;

            // --- ENCABEZADO PREMIUM ---
            // 1. Logo (Esquina superior izquierda)
            if (logoBytes != null) {
                try {
                    PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, logoBytes, "logo");
                    cs.drawImage(pdImage, margin, y - 45, 45, 45);
                } catch (Exception e) {
                }
            }

            // 2. Título (Centrado)
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 16);
            String title = "ESTADO DE CUENTA CORRIENTE";
            float titleWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(title) / 1000 * 16;
            cs.newLineAtOffset((w - titleWidth) / 2, y - 25);
            cs.showText(title);
            cs.endText();

            // 3. Período (Esquina superior derecha)
            DateTimeFormatter headerDtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String periodoText = desde.format(headerDtf) + " - " + hasta.format(headerDtf);
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 9);
            float pWidth = PDType1Font.HELVETICA.getStringWidth(periodoText) / 1000 * 9;
            cs.newLineAtOffset(w - margin - pWidth, y - 10);
            cs.showText(periodoText);
            cs.endText();

            y -= 75;

            // --- BLOQUE DE PROVEEDOR ---
            cs.setNonStrokingColor(new java.awt.Color(245, 245, 245));
            cs.addRect(margin, y - 55, 310, 60);
            cs.fill();
            cs.setNonStrokingColor(java.awt.Color.BLACK);

            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
            cs.newLineAtOffset(margin + 10, y - 15);
            cs.showText("PROVEEDOR: " + prov.get("nombre"));
            cs.newLineAtOffset(0, -15);
            cs.setFont(PDType1Font.HELVETICA, 10);
            cs.showText("CUIT: " + prov.get("cuit"));
            cs.endText();

            y -= 85;
            // --- TABLA DE MOVIMIENTOS ---
            // Header de Tabla (Gris medio)
            cs.setNonStrokingColor(new java.awt.Color(108, 117, 125)); // Medium gray
            cs.addRect(margin, y - 20, w - 2 * margin, 20);
            cs.fill();
            cs.setNonStrokingColor(java.awt.Color.WHITE);

            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 8);
            cs.newLineAtOffset(margin + 5, y - 13);
            cs.showText("Fecha / Detalle del Documento");
            cs.newLineAtOffset(255, 0);
            cs.showText("Cant.");
            cs.newLineAtOffset(50, 0);
            cs.showText("Debe");
            cs.newLineAtOffset(60, 0);
            cs.showText("Haber");
            cs.newLineAtOffset(60, 0);
            cs.showText("Saldo");
            cs.endText();

            y -= 20;
            cs.setFont(PDType1Font.HELVETICA, 8);
            for (int i = 0; i < movimientos.size(); i++) {
                Map<String, Object> m = movimientos.get(i);

                if (y < 100) { // Aumentado el margen de seguridad para evitar cortes feos
                    cs.close();
                    page = new PDPage(PDRectangle.A4);
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    y = h - margin;

                    // Repetir header en nueva página con el color suave
                    cs.setNonStrokingColor(new java.awt.Color(108, 117, 125));
                    cs.addRect(margin, y - 20, w - 2 * margin, 20);
                    cs.fill();
                    cs.setNonStrokingColor(java.awt.Color.WHITE);
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA_BOLD, 8);
                    cs.newLineAtOffset(margin + 5, y - 13);
                    cs.showText("Fecha / Detalle del Documento");
                    cs.newLineAtOffset(255, 0);
                    cs.showText("Cant.");
                    cs.newLineAtOffset(50, 0);
                    cs.showText("Debe");
                    cs.newLineAtOffset(60, 0);
                    cs.showText("Haber");
                    cs.newLineAtOffset(60, 0);
                    cs.showText("Saldo");
                    cs.endText();
                    y -= 25; // Un poco más de espacio tras el header repetido
                }

                boolean isHeader = (boolean) m.getOrDefault("isHeader", false);

                // Espacio extra antes de un nuevo bloque de remito para evitar solapamientos y
                // mejorar legibilidad
                if (isHeader && i > 0) {
                    y -= 10;
                }

                if (isHeader) {
                    // Header de Bloque (Remito o Pago)
                    cs.setNonStrokingColor(new java.awt.Color(248, 249, 250));
                    cs.addRect(margin, y - 20, w - 2 * margin, 20);
                    cs.fill();
                    cs.setNonStrokingColor(java.awt.Color.BLACK);

                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA_BOLD, 8);
                    cs.newLineAtOffset(margin + 5, y - 13);

                    String headerDesc = m.get("fecha") + "  -  " + m.get("descripcion");
                    if ("PAGO".equals(m.get("tipo")) && m.get("medio") != null) {
                        String medioStr = ((String) m.get("medio")).replace("_", " ");
                        headerDesc += " [" + medioStr + "]";
                    }
                    cs.showText(headerDesc);

                    if ("PAGO".equals(m.get("tipo"))) {
                        cs.newLineAtOffset(365, 0);
                        cs.showText(String.format("%.2f", ((BigDecimal) m.get("haber")).doubleValue()));
                        cs.newLineAtOffset(60, 0);
                        cs.showText(String.format("%.2f", ((BigDecimal) m.get("saldo")).doubleValue()));
                    } else if ("COMPRA".equals(m.get("tipo"))) {
                        cs.newLineAtOffset(425, 0);
                        cs.showText(String.format("%.2f", ((BigDecimal) m.get("saldo")).doubleValue()));
                    }
                    cs.endText();

                    if ("PAGO".equals(m.get("tipo")) && m.get("medio") != null) {
                        String medio = (String) m.get("medio");
                        if (medio.contains("CHEQUE")) {
                            y -= 12;
                            cs.beginText();
                            cs.setFont(PDType1Font.HELVETICA_OBLIQUE, 7);
                            cs.newLineAtOffset(margin + 20, y - 10);
                            cs.setNonStrokingColor(new java.awt.Color(100, 100, 100)); // Gris oscurecido para subtitulo
                            String chequeDetails = "Detalles de Cheque:";
                            if (m.get("banco") != null)
                                chequeDetails += "  Banco: " + m.get("banco");
                            if (m.get("numeroCheque") != null)
                                chequeDetails += "  Nº: " + m.get("numeroCheque");
                            if (m.get("fechaVenc") != null)
                                chequeDetails += "  Vence: " + m.get("fechaVenc");
                            cs.showText(chequeDetails);
                            cs.endText();
                            cs.setNonStrokingColor(java.awt.Color.BLACK); // Reseteamos color negro normal
                        }
                    }
                } else {
                    cs.setNonStrokingColor(java.awt.Color.BLACK);
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA, 8);
                    cs.newLineAtOffset(margin + 20, y - 13); // Identación visual limpia
                    cs.showText(truncate((String) m.get("descripcion"), 55));

                    cs.newLineAtOffset(240, 0);
                    cs.showText(m.get("cantidad") != null ? m.get("cantidad").toString() : "-");

                    cs.newLineAtOffset(50, 0);
                    cs.showText(String.format("%.2f", ((BigDecimal) m.get("debe")).doubleValue()));

                    cs.newLineAtOffset(120, 0);
                    cs.showText(String.format("%.2f", ((BigDecimal) m.get("saldo")).doubleValue()));
                    cs.endText();
                }

                y -= 20;
                cs.setLineWidth(0.2f);
                cs.setStrokingColor(new java.awt.Color(230, 230, 230));
                cs.moveTo(margin, y);
                cs.lineTo(w - margin, y);
                cs.stroke();
            }

            // --- CUADRO DE TOTALES FINALES ---
            y -= 40;
            if (y < 120) {
                cs.close();
                page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                cs = new PDPageContentStream(doc, page);
                y = h - margin;
            }

            float boxWidth = 230;
            float boxHeight = 75;
            float boxX = w - margin - boxWidth;

            cs.setNonStrokingColor(new java.awt.Color(252, 252, 252));
            cs.addRect(boxX, y - boxHeight, boxWidth, boxHeight);
            cs.fill();
            cs.setStrokingColor(java.awt.Color.BLACK);
            cs.setLineWidth(1f);
            cs.addRect(boxX, y - boxHeight, boxWidth, boxHeight);
            cs.stroke();

            cs.setNonStrokingColor(java.awt.Color.BLACK);
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(boxX + 10, y - 20);
            cs.showText("Total de Compras (+):");
            cs.newLineAtOffset(140, 0);
            cs.showText("$ " + String.format("%.2f", ((BigDecimal) data.get("totalCompras")).doubleValue()));

            cs.newLineAtOffset(-140, -15);
            cs.showText("Total de Pagos (-):");
            cs.newLineAtOffset(140, 0);
            cs.showText("$ " + String.format("%.2f", ((BigDecimal) data.get("totalPagos")).doubleValue()));

            cs.newLineAtOffset(-140, -20);
            cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
            cs.showText("SALDO FINAL:");
            cs.newLineAtOffset(125, 0);
            cs.showText(" $ " + String.format("%.2f", ((BigDecimal) data.get("saldoFinal")).doubleValue()));
            cs.endText();

            cs.close();
            doc.save(os);
        }
    }

    private String truncate(String text, int len) {
        if (text == null)
            return "";
        if (text.length() <= len)
            return text;
        return text.substring(0, len - 3) + "...";
    }
}
