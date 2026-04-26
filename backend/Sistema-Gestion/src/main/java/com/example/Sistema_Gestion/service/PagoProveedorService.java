package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.*;
import com.example.Sistema_Gestion.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio para gestionar pagos realizados A proveedores.
 *
 * Flujo:
 * 1. Se registra un PagoProveedor (con importe y medio de pago)
 * 2. El pago se distribuye entre una o más compras pendientes
 * 3. Se actualiza el estado de cada compra (PENDIENTE / PARCIAL / PAGADA)
 */
@Service
public class PagoProveedorService {

    private final PagoProveedorRepository pagoProveedorRepository;
    private final PagoProveedorCompraRepository pagoProveedorCompraRepository;
    private final CompraRepository compraRepository;
    private final TesoreriaService tesoreriaService;
    private final ProveedorRepository proveedorRepository;
    private final ConfiguracionService configuracionService;

    public PagoProveedorService(PagoProveedorRepository pagoProveedorRepository,
            PagoProveedorCompraRepository pagoProveedorCompraRepository,
            CompraRepository compraRepository,
            TesoreriaService tesoreriaService,
            ProveedorRepository proveedorRepository,
            ConfiguracionService configuracionService) {
        this.pagoProveedorRepository = pagoProveedorRepository;
        this.pagoProveedorCompraRepository = pagoProveedorCompraRepository;
        this.compraRepository = compraRepository;
        this.tesoreriaService = tesoreriaService;
        this.proveedorRepository = proveedorRepository;
        this.configuracionService = configuracionService;
    }

    /**
     * Registra un pago al proveedor, distribuyéndolo entre compras.
     *
     * @param pago              Entidad PagoProveedor (proveedor, fecha, importe,
     *                          medio)
     * @param importesPorCompra Mapa compraId -> importe aplicado a esa compra
     */
    @Transactional
    public PagoProveedor registrarPago(PagoProveedor pago, Map<Long, BigDecimal> importesPorCompra) {

        if (pago.getFecha() == null) {
            pago.setFecha(LocalDate.now());
        }

        // Calcular total del pago como suma de los importes distribuidos (solo si hay
        // distribuciones)
        if (importesPorCompra != null && !importesPorCompra.isEmpty()) {
            BigDecimal totalDistribuido = importesPorCompra.values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            pago.setImporte(totalDistribuido);
        }

        // Capturar nombre antes del save para evitar proxy Hibernate
        String nombreProveedor = "Proveedor";
        if (pago.getProveedor() != null) {
            if (pago.getProveedor().getNombre() != null && !pago.getProveedor().getNombre().isEmpty()) {
                nombreProveedor = pago.getProveedor().getNombre();
            } else if (pago.getProveedor().getId() != null) {
                nombreProveedor = proveedorRepository.findById(pago.getProveedor().getId())
                        .map(Proveedor::getNombre)
                        .orElse("Proveedor");
            }
        }

        // Persistir pago
        PagoProveedor savedPago = pagoProveedorRepository.save(pago);

        // ✅ Crear Movimiento de Tesorería automáticamente
        MovimientoTesoreria mov = new MovimientoTesoreria();
        mov.setTipo("EGRESO");
        mov.setMedioPago(savedPago.getMedio());
        mov.setImporte(savedPago.getImporte());
        if (savedPago.getImporteDolares() != null && savedPago.getImporteDolares().compareTo(BigDecimal.ZERO) > 0) {
            mov.setImporteUSD(savedPago.getImporteDolares());
        }
        mov.setFecha(savedPago.getFecha().atStartOfDay());
        
        // Simplificar descripción: Solo mostrar observaciones manuales
        String desc = (pago.getObservaciones() != null && !pago.getObservaciones().trim().isEmpty()) 
                      ? pago.getObservaciones().trim() 
                      : "Pago a Proveedor";
        mov.setDescripcion(desc);
        
        mov.setReferencia("Pago #" + savedPago.getId());
        mov.setEntidad(nombreProveedor);
        mov.setAnulado(false);
        mov.setCobrado(false); // MovimientoTesoreria.onCreate evaluará y lo pasará a true si corresponde
        
        if (savedPago.getMedio() != null && savedPago.getMedio().contains("CHEQUE")) {
            mov.setBanco(savedPago.getBanco());
            mov.setNumeroCheque(savedPago.getNumeroCheque());
            mov.setLibrador(savedPago.getLibrador());
            mov.setFechaCobro(savedPago.getFechaVenc());
        }
        
        tesoreriaService.registrarMovimiento(mov);

        // Distribuir entre compras
        if (importesPorCompra != null) {
            for (Map.Entry<Long, BigDecimal> entry : importesPorCompra.entrySet()) {
                Long compraId = entry.getKey();
                BigDecimal importe = entry.getValue();

                Compra compra = compraRepository.findById(compraId)
                        .orElseThrow(() -> new RuntimeException("Compra no encontrada: " + compraId));

                // Registrar el importe aplicado a esta compra
                PagoProveedorCompra pc = new PagoProveedorCompra();
                pc.setPagoProveedor(savedPago);
                pc.setCompra(compra);
                pc.setImporte(importe);
                savedPago.getCompras().add(pc);

                // Recalcular deuda de esta compra y actualizar su estado
                BigDecimal totalPagadoAntes = pagoProveedorCompraRepository.totalPagadoPorCompra(compraId);
                BigDecimal totalPagadoAhora = totalPagadoAntes.add(importe);
                actualizarEstadoCompra(compra, totalPagadoAhora);
            }
        }

        return pagoProveedorRepository.save(savedPago);
    }

    /**
     * Actualiza el estado de una compra según cuánto se ha pagado.
     * PENDIENTE → PARCIAL → PAGADA
     */
    private void actualizarEstadoCompra(Compra compra, BigDecimal totalPagado) {
        if (compra.getTotal() == null)
            return;

        int cmp = totalPagado.compareTo(compra.getTotal());
        if (cmp >= 0) {
            compra.setEstado("PAGADA");
        } else if (totalPagado.compareTo(BigDecimal.ZERO) > 0) {
            compra.setEstado("PARCIAL");
        } else {
            compra.setEstado("PENDIENTE");
        }
        compraRepository.save(compra);
    }

    public List<PagoProveedor> listarPorProveedor(Long proveedorId) {
        return pagoProveedorRepository.findByProveedorIdOrderByFechaDesc(proveedorId);
    }

    public Optional<PagoProveedor> buscarPorId(Long id) {
        return pagoProveedorRepository.findById(id);
    }

    public BigDecimal calcularDeudaProveedorARS(Long proveedorId) {
        BigDecimal totalComprado = compraRepository.findTotalCompradoARS(proveedorId);
        BigDecimal totalPagado = pagoProveedorRepository.totalPagadoARSPorProveedor(proveedorId);
        totalComprado = totalComprado != null ? totalComprado : BigDecimal.ZERO;
        totalPagado = totalPagado != null ? totalPagado : BigDecimal.ZERO;
        return totalComprado.subtract(totalPagado);
    }

    public BigDecimal calcularDeudaProveedorUSD(Long proveedorId) {
        BigDecimal totalComprado = compraRepository.findTotalCompradoUSD(proveedorId);
        BigDecimal totalPagado = pagoProveedorRepository.totalPagadoUSDPorProveedor(proveedorId);
        totalComprado = totalComprado != null ? totalComprado : BigDecimal.ZERO;
        totalPagado = totalPagado != null ? totalPagado : BigDecimal.ZERO;
        return totalComprado.subtract(totalPagado);
    }

    @Transactional
    public boolean anularPago(Long id) {
        return pagoProveedorRepository.findById(id).map(pago -> {
            if (Boolean.TRUE.equals(pago.getAnulado())) {
                return true; // Ya estaba anulado
            }
            
            pago.setAnulado(true);
            pagoProveedorRepository.save(pago);

            // Revertir estados de las compras asociadas
            for (PagoProveedorCompra pc : pago.getCompras()) {
                Compra compra = pc.getCompra();
                // Al anular un pago, la compra debe volver a reflejar su deuda real.
                // Recalculamos el total pagado SIN el pago que estamos anulando ahora.
                BigDecimal totalPagado = pagoProveedorCompraRepository.totalPagadoPorCompra(compra.getId());
                // El query totalPagadoPorCompra asumo que filtra por anulado=false, 
                // por lo que al haber guardado el pago como anulado arriba, ya debería dar el valor correcto.
                actualizarEstadoCompra(compra, totalPagado);
            }

            // Anular movimiento correlativo en Tesorería si no fue desde allí que se inició
            tesoreriaService.anularPorReferencia("Pago #" + pago.getId());
            
            return true;
        }).orElse(false);
    }

    @Transactional
    public PagoProveedor actualizarPago(Long id, PagoProveedor pagoActualizado) {
        return pagoProveedorRepository.findById(id).map(original -> {
            // Actualizar campos permitidos (No actualizamos el importe para no romper CtaCte de facturas)
            original.setFecha(pagoActualizado.getFecha());
            original.setMedio(pagoActualizado.getMedio());
            original.setMonedaPago(pagoActualizado.getMonedaPago());
            original.setObservaciones(pagoActualizado.getObservaciones());
            original.setBanco(pagoActualizado.getBanco());
            original.setNumeroCheque(pagoActualizado.getNumeroCheque());
            original.setLibrador(pagoActualizado.getLibrador());
            original.setFechaVenc(pagoActualizado.getFechaVenc());
            
            PagoProveedor saved = pagoProveedorRepository.save(original);
            
            // Sincronizar Tesorería
            String ref = "Pago #" + saved.getId();
            List<MovimientoTesoreria> movs = tesoreriaService.buscarPorReferencia(ref);
            if (!movs.isEmpty()) {
                MovimientoTesoreria m = movs.get(0);
                m.setFecha(saved.getFecha().atStartOfDay());
                m.setMedioPago(saved.getMedio());
                
                // Simplificar descripción en actualización también
                String des = (saved.getObservaciones() != null && !saved.getObservaciones().trim().isEmpty())
                             ? saved.getObservaciones().trim()
                             : "Pago a Proveedor";
                m.setDescripcion(des);
                
                if (saved.getMedio().contains("CHEQUE")) {
                    m.setBanco(saved.getBanco());
                    m.setNumeroCheque(saved.getNumeroCheque());
                    m.setLibrador(saved.getLibrador());
                    m.setFechaCobro(saved.getFechaVenc());
                }
                tesoreriaService.registrarMovimiento(m);
            }
            
            return saved;
        }).orElseThrow(() -> new RuntimeException("Pago no encontrado: " + id));
    }

    // =================== PDF: ORDEN DE PAGO ===================

    public void generarPdfOrdenPago(Long pagoId, java.io.OutputStream os, byte[] logoBytes) throws Exception {
        PagoProveedor pago = pagoProveedorRepository.findById(pagoId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado: " + pagoId));

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
                    org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject logo =
                            org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject.createFromByteArray(doc, logoBytes, "logo");
                    cs.drawImage(logo, margin, y - 60, 60, 60);
                } catch (Exception ignored) {}
            }

            // ----- ENCABEZADO -----
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 22);
            cs.newLineAtOffset(w / 2f - 65, y - 28);
            cs.showText("ORDEN DE PAGO");
            cs.endText();

            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 13);
            cs.newLineAtOffset(w / 2f - 30, y - 50);
            cs.showText("OP-" + String.format("%05d", pago.getId()));
            cs.endText();

            String fecha = pago.getFecha() != null
                    ? pago.getFecha().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(w - margin - 100, y - 28);
            cs.showText("Fecha: " + fecha);
            cs.endText();

            // Línea separadora
            y -= 75;
            cs.setLineWidth(1f);
            cs.moveTo(margin, y); cs.lineTo(w - margin, y); cs.stroke();

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

            // ----- PROVEEDOR -----
            y -= 25;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, y);
            cs.showText("DATOS DEL PROVEEDOR");
            cs.endText();

            y -= 18;
            String provNombre = pago.getProveedor() != null ? pago.getProveedor().getNombre() : "—";
            String provCuit = (pago.getProveedor() != null && pago.getProveedor().getCuit() != null)
                    ? pago.getProveedor().getCuit() : "—";
            drawLabelValueOP(cs, margin, y, "Proveedor:", provNombre);
            y -= 16;
            drawLabelValueOP(cs, margin, y, "CUIT:", provCuit);

            // Línea separadora
            y -= 18;
            cs.setLineWidth(0.5f);
            cs.moveTo(margin, y); cs.lineTo(w - margin, y); cs.stroke();

            // ----- DETALLE DEL PAGO -----
            y -= 20;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, y);
            cs.showText("DETALLE DEL PAGO");
            cs.endText();

            // Cabecera tabla
            y -= 20;
            cs.setNonStrokingColor(new java.awt.Color(230, 230, 230));
            cs.addRect(margin, y - 18, w - 2 * margin, 18); cs.fill();
            cs.setNonStrokingColor(java.awt.Color.BLACK);
            cs.setLineWidth(0.4f);
            cs.addRect(margin, y - 18, w - 2 * margin, 18); cs.stroke();

            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(margin + 5, y - 13); cs.showText("Concepto"); cs.endText();
            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(w - margin - 80, y - 13); cs.showText("Importe"); cs.endText();

            y -= 18;
            // Fila: Medio de pago
            String medioLabel = pago.getMedio() != null ? pago.getMedio().replace("_", " ") : "EFECTIVO";
            String monedaPago = pago.getMonedaPago() != null ? pago.getMonedaPago() : "ARS";
            cs.setLineWidth(0.2f);
            cs.addRect(margin, y - 16, w - 2 * margin, 16); cs.stroke();
            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(margin + 5, y - 11); cs.showText("Medio: " + medioLabel + " (" + monedaPago + ")"); cs.endText();

            // Importe primario según moneda de pago
            String importePrimario;
            if ("USD".equals(monedaPago) && pago.getImporteDolares() != null) {
                importePrimario = "U$D " + pago.getImporteDolares().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
            } else {
                importePrimario = "$ " + (pago.getImporte() != null
                        ? pago.getImporte().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "0.00");
            }
            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(w - margin - 78, y - 11); cs.showText(importePrimario); cs.endText();
            y -= 18;

            // Tipo de cambio si aplica
            boolean isBimonetary = "USD".equals(monedaPago) || "USD".equals(pago.getMoneda());
            if (isBimonetary && pago.getTipoCambio() != null) {
                cs.setLineWidth(0.2f);
                cs.addRect(margin, y - 14, w - 2 * margin, 14); cs.stroke();
                cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 8);
                cs.newLineAtOffset(margin + 5, y - 10);
                String tcLine = "Tipo de Cambio: $ " + pago.getTipoCambio().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString()
                        + "    |  Equiv. ARS: $ " + (pago.getImporte() != null
                                ? pago.getImporte().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "—");
                cs.showText(tcLine); cs.endText();
                y -= 16;
            }

            // Datos del cheque si aplica
            if (pago.getMedio() != null && pago.getMedio().contains("CHEQUE") && pago.getBanco() != null) {
                cs.setLineWidth(0.2f);
                cs.addRect(margin, y - 14, w - 2 * margin, 14); cs.stroke();
                cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 8);
                cs.newLineAtOffset(margin + 5, y - 10);
                String chequeDetail = "Cheque: Banco " + safeOP(pago.getBanco())
                        + " | N°: " + safeOP(pago.getNumeroCheque())
                        + " | Librador: " + safeOP(pago.getLibrador())
                        + " | Vto: " + (pago.getFechaVenc() != null
                                ? pago.getFechaVenc().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yy")) : "—");
                cs.showText(chequeDetail); cs.endText();
                y -= 16;
            }

            // Total
            y -= 8;
            cs.setLineWidth(1f);
            cs.moveTo(margin, y); cs.lineTo(w - margin, y); cs.stroke();
            y -= 18;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
            cs.newLineAtOffset(w - margin - 200, y);
            cs.showText("TOTAL PAGADO: " + importePrimario);
            cs.endText();

            // Línea separadora
            y -= 18;
            cs.setLineWidth(0.5f);
            cs.moveTo(margin, y); cs.lineTo(w - margin, y); cs.stroke();

            // ----- IMPUTACIÓN A COMPRAS -----
            y -= 20;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, y);
            cs.showText("APLICADO A / CANCELACIÓN DE COMPRAS");
            cs.endText();

            y -= 18;
            if (pago.getCompras() != null && !pago.getCompras().isEmpty()) {
                for (PagoProveedorCompra pc : pago.getCompras()) {
                    if (pc.getCompra() == null) continue;
                    cs.setLineWidth(0.2f);
                    cs.addRect(margin, y - 14, w - 2 * margin, 14); cs.stroke();
                    cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
                    cs.newLineAtOffset(margin + 5, y - 10);
                    cs.showText("Compra N° " + pc.getCompra().getNumero()); cs.endText();
                    String montoImput = "$ " + (pc.getImporte() != null
                            ? pc.getImporte().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "—");
                    cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
                    cs.newLineAtOffset(w - margin - 78, y - 10); cs.showText(montoImput); cs.endText();
                    y -= 16;
                }
            } else {
                cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
                cs.newLineAtOffset(margin + 5, y - 10);
                cs.showText("Pago a cuenta sin imputación específica"); cs.endText();
                y -= 16;
            }

            // Observaciones
            if (pago.getObservaciones() != null && !pago.getObservaciones().isBlank()) {
                y -= 10;
                cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
                cs.newLineAtOffset(margin, y); cs.showText("Observaciones: "); cs.endText();
                y -= 13;
                cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
                cs.newLineAtOffset(margin + 5, y);
                cs.showText(safeOP(pago.getObservaciones())); cs.endText();
                y -= 16;
            }

            // ----- FIRMA -----
            y -= 20;
            cs.setLineWidth(0.8f);
            cs.moveTo(margin + 20, y - 2); cs.lineTo(margin + 170, y - 2); cs.stroke();
            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(margin + 45, y - 14); cs.showText("Firma del proveedor"); cs.endText();

            cs.moveTo(w - margin - 150, y - 2); cs.lineTo(w - margin - 10, y - 2); cs.stroke();
            cs.beginText(); cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(w - margin - 120, y - 14); cs.showText("Firma / Sello empresa"); cs.endText();

            // Pie
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 7);
            cs.newLineAtOffset(w / 2f - 100, 30);
            cs.showText("DOCUMENTO NO VÁLIDO COMO FACTURA – Leonel Gomez Agro-Ferretería");
            cs.endText();

            cs.close();
            doc.save(os);
        }
    }

    private void drawLabelValueOP(org.apache.pdfbox.pdmodel.PDPageContentStream cs, float x, float y,
            String label, String value) throws Exception {
        cs.beginText();
        cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 10);
        cs.newLineAtOffset(x, y); cs.showText(label); cs.endText();
        cs.beginText();
        cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
        cs.newLineAtOffset(x + 70, y); cs.showText(safeOP(value)); cs.endText();
    }

    private String safeOP(String s) {
        if (s == null) return "";
        return s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ');
    }
}

