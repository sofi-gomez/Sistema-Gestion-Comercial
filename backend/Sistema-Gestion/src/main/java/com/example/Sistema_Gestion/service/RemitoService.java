package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Remito;
import com.example.Sistema_Gestion.model.RemitoItem;
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
import java.util.Map;
import java.util.Optional;

import com.example.Sistema_Gestion.model.Configuracion;

@Service
public class RemitoService {

    private final RemitoRepository remitoRepository;
    private final ProductoService productoService;
    private final ConfiguracionService configuracionService;

    public RemitoService(RemitoRepository remitoRepository,
            ProductoService productoService,
            ConfiguracionService configuracionService) {
        this.remitoRepository = remitoRepository;
        this.productoService = productoService;
        this.configuracionService = configuracionService;
    }

    public List<Remito> listarTodos() {
        return remitoRepository.findAll();
    }

    public List<Remito> listarPorEstado(Remito.EstadoRemito estado) {
        return remitoRepository.findByEstadoOrderByFechaDesc(estado);
    }

    public List<Remito> listarPorCliente(Long clienteId) {
        return remitoRepository.findByClienteIdOrderByFechaDesc(clienteId);
    }

    public Optional<Remito> buscarPorId(Long id) {
        return remitoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Remito> buscarPorIdConItems(Long id) {
        Optional<Remito> opt = remitoRepository.findById(id);
        opt.ifPresent(r -> {
            r.getItems().size(); // Inicializa la lista lazy
            for (RemitoItem item : r.getItems()) {
                if (item.getProducto() != null) {
                    item.getProducto().getNombre(); // Forzar carga del producto LAZY
                }
            }
        });
        return opt;
    }

    /**
     * Crea un remito PENDIENTE y descuenta el stock inmediatamente.
     * REGLA: el stock se descuenta al entregar la mercadería, no al cobrar.
     */
    @Transactional
    public Remito generarRemito(Remito remito) {
        Long max = remitoRepository.findMaxNumero();
        remito.setNumero((max != null && max > 0) ? max + 1 : 1L);
        remito.setEstado(Remito.EstadoRemito.PENDIENTE);

        if (remito.getItems() != null) {
            for (RemitoItem item : remito.getItems()) {
                item.setRemito(remito);
            }
        }

        Remito saved = remitoRepository.save(remito);

        // Gestión de stock al momento de crear el remito
        if (saved.getItems() != null) {
            for (RemitoItem item : saved.getItems()) {
                // VALIDACIÓN DE CANTIDAD > 0
                if (item.getCantidad() == null || item.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("La cantidad del producto '" + 
                        (item.getProducto() != null ? item.getProducto().getNombre() : "desconocido") + 
                        "' debe ser mayor a 0.");
                }

                if (item.getProducto() != null) {
                    boolean ok = productoService.descontarStock(
                            item.getProducto().getId(),
                            item.getCantidad().intValue());
                    if (!ok) {
                        throw new IllegalStateException(
                            "Stock insuficiente para el producto: '" +
                            item.getProducto().getNombre() + "'. " +
                            "Revisá el stock disponible antes de registrar el remito.");
                    }
                }
            }
        }
        return saved;
    }

    /**
     * Valoriza un remito: asigna precio por ítem, calcula total,
     * guarda la cotización dólar y cambia estado a VALORIZADO.
     *
     * @param remitoId        ID del remito
     * @param precios         Mapa itemId -> precioUnitario
     * @param cotizacionDolar Cotización del dólar vigente (puede ser null)
     */
    @Transactional
    public Remito valorizar(Long remitoId, Map<Long, BigDecimal> precios, BigDecimal cotizacionDolar) {
        Remito remito = remitoRepository.findById(remitoId)
                .orElseThrow(() -> new RuntimeException("Remito no encontrado: " + remitoId));

        // Se permite re-valorizar incluso si está cobrado para corregir errores excepcionales.
        // El estado volverá a VALORIZADO automáticamente líneas abajo.

        BigDecimal total = BigDecimal.ZERO;
        for (RemitoItem item : remito.getItems()) {
            BigDecimal precio = precios.get(item.getId());
            if (precio == null) {
                throw new IllegalArgumentException("Falta precio para el ítem ID: " + item.getId());
            }
            BigDecimal subtotal = precio.multiply(item.getCantidad());
            item.setPrecioUnitario(precio);
            item.setSubtotal(subtotal);
            total = total.add(subtotal);
        }

        remito.setTotal(total);
        remito.setCotizacionDolar(cotizacionDolar);
        remito.setFechaValorizacion(LocalDateTime.now());
        remito.setEstado(Remito.EstadoRemito.VALORIZADO);

        return remitoRepository.save(remito);
    }

    /**
     * Revisa si el total cobrado en este remito lo liquida completamente.
     * Llamado por CobroService después de cada cobro.
     */
    @Transactional
    public void actualizarEstadoPostCobro(Remito remito, BigDecimal totalCobradoEnRemito) {
        if (remito.getTotal() != null
                && totalCobradoEnRemito.compareTo(remito.getTotal()) >= 0) {
            remito.setEstado(Remito.EstadoRemito.COBRADO);
            remitoRepository.save(remito);
        }
    }

    @Transactional
    public Remito marcarComoCobrado(Long id) {
        Remito remito = remitoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Remito no encontrado: " + id));
        remito.setEstado(Remito.EstadoRemito.COBRADO);
        return remitoRepository.save(remito);
    }

    @Transactional
    public void eliminarRemito(Long id) {
        Remito remito = remitoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Remito no encontrado"));

        // Revertir stock
        if (remito.getItems() != null) {
            for (RemitoItem item : remito.getItems()) {
                if (item.getProducto() != null && item.getCantidad() != null) {
                    // Era una salida (restó stock), al eliminar sumamos
                    productoService.aumentarStock(
                            item.getProducto().getId(),
                            item.getCantidad().intValue());
                }
            }
        }

        remitoRepository.delete(remito);
    }

    @Transactional
    public Remito actualizarRemito(Remito remitoDraft) {
        // 1. Obtener el remito real de la DB (gestionado por Hibernate)
        Remito remitoPersistido = remitoRepository.findById(remitoDraft.getId())
                .orElseThrow(() -> new RuntimeException("Remito no encontrado"));

        // 2. Revertir stock de los ítems existentes antes de borrarlos
        if (remitoPersistido.getItems() != null) {
            for (RemitoItem item : remitoPersistido.getItems()) {
                if (item.getProducto() != null && item.getCantidad() != null) {
                    productoService.aumentarStock(item.getProducto().getId(), item.getCantidad().intValue());
                }
            }
            // 3. Limpiar la colección (orphanRemoval=true en Remito.java se encargará del DELETE)
            remitoPersistido.getItems().clear();
        }

        // 4. Actualizar campos básicos del objeto gestionado con los datos del borrador
        remitoPersistido.setFecha(remitoDraft.getFecha());
        remitoPersistido.setCliente(remitoDraft.getCliente());
        remitoPersistido.setClienteNombre(remitoDraft.getClienteNombre());
        remitoPersistido.setClienteDireccion(remitoDraft.getClienteDireccion());
        remitoPersistido.setClienteCodigoPostal(remitoDraft.getClienteCodigoPostal());
        remitoPersistido.setClienteAclaracion(remitoDraft.getClienteAclaracion());
        remitoPersistido.setObservaciones(remitoDraft.getObservaciones());

        // 5. Agregar los nuevos ítems y descontar stock
        if (remitoDraft.getItems() != null) {
            for (RemitoItem newItem : remitoDraft.getItems()) {
                // VALIDACIÓN DE CANTIDAD > 0
                if (newItem.getCantidad() == null || newItem.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("No se puede actualizar: hay ítems con cantidad 0 o negativa.");
                }

                newItem.setId(null); // Asegurar que se traten como nuevos items
                remitoPersistido.addItem(newItem);
                
                if (newItem.getProducto() != null) {
                    boolean ok = productoService.descontarStock(
                        newItem.getProducto().getId(), 
                        newItem.getCantidad().intValue()
                    );
                    if (!ok) {
                        throw new RuntimeException("Stock insuficiente para el producto: " + 
                            (newItem.getProducto() != null ? newItem.getProducto().getNombre() : "Desconocido"));
                    }
                }
            }
        }

        remitoPersistido.preUpdate();
        return remitoRepository.save(remitoPersistido);
    }
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

            // --- HEADER SECTION ---
            float currentY = h - margin;
            
            // 1. Logo (Top Left)
            if (logoBytes != null) {
                try {
                    PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, logoBytes, "logo");
                    cs.drawImage(pdImage, x, currentY - 60, 60, 60);
                } catch (Exception ex) {
                    // Ignorar error de logo
                }
            }

            // 2. Título "REMITO" (Centrado y Grande)
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 22);
            cs.newLineAtOffset(w / 2f - 40, currentY - 30);
            cs.showText("REMITO");
            cs.endText();

            // 3. Número de remito (Debajo del título)
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
            cs.newLineAtOffset(w / 2f - 20, currentY - 55);
            cs.showText("N° " + remito.getNumero());
            cs.endText();

            // 4. Fecha (Alineada a la derecha)
            String fecha = remito.getFecha() != null
                    ? remito.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 10);
            cs.newLineAtOffset(w - margin - 90, currentY - 30);
            cs.showText("Fecha: " + fecha);
            cs.endText();

            // --- LÍNEA DE SEPARACIÓN SUPERIOR ---
            currentY -= 75;
            cs.setLineWidth(1.2f);
            cs.moveTo(x, currentY);
            cs.lineTo(w - margin, currentY);
            cs.stroke();

            // --- DATOS DE LA EMPRESA (Debajo de la línea, antes de los datos del cliente) ---
            currentY -= 20;
            Configuracion config = configuracionService.getConfiguracion();
            
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
            cs.newLineAtOffset(x, currentY);
            cs.showText(config.getNombreEmpresa() != null ? config.getNombreEmpresa() : "Agro-Ferretería");
            cs.endText();

            currentY -= 14;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(x, currentY);
            cs.showText("CUIL: " + (config.getCuit() != null ? config.getCuit() : "—"));
            cs.endText();

            currentY -= 12;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(x, currentY);
            cs.showText("Dirección: " + (config.getDireccion() != null ? config.getDireccion() : "—"));
            cs.endText();

            // --- LÍNEA DE SEPARACIÓN PARA SECCIÓN CLIENTE ---
            currentY -= 15;
            cs.setLineWidth(0.5f);
            cs.moveTo(x, currentY);
            cs.lineTo(w - margin, currentY);
            cs.stroke();

            // --- SECCIÓN: DATOS DEL CLIENTE ---
            currentY -= 20;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
            cs.newLineAtOffset(x, currentY);
            cs.showText("DATOS DEL CLIENTE");
            cs.endText();

            // Sincronizar 'y' y establecer inicio de tabla de info
            y = currentY;
            float infoStartY = y - 25;
            String[][] clienteData = {
                    { "Nombre:", safeString(remito.getClienteNombre()) },
                    { "Dirección:", safeString(remito.getClienteDireccion()) },
                    { "Código Postal:", safeString(remito.getClienteCodigoPostal()) },
                    { "Condición IVA:",
                            safeString(remito.getClienteAclaracion()).isEmpty() ? "Consumidor Final"
                                    : formatCondicionIva(remito.getClienteAclaracion()) }
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
            cs.setNonStrokingColor(new java.awt.Color(240, 240, 240));
            cs.addRect(x, tableTop - 25, w - 2 * margin, 25);
            cs.fill();
            cs.setNonStrokingColor(java.awt.Color.BLACK);

            // Bordes del header
            cs.setLineWidth(0.5f);
            cs.addRect(x, tableTop - 25, w - 2 * margin, 25);
            cs.stroke();

            // Columnas
            float colCantX = x + 10;
            float colDescX = x + 80;
            boolean showPrices = (Remito.EstadoRemito.VALORIZADO.equals(remito.getEstado()) || Remito.EstadoRemito.COBRADO.equals(remito.getEstado())) && remito.getTotal() != null;
            float colPreX = w - margin - 150;
            float colSubX = w - margin - 70;

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

            if (showPrices) {
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
                cs.newLineAtOffset(colPreX, tableTop - 15);
                cs.showText("P. UNIT.");
                cs.endText();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
                cs.newLineAtOffset(colSubX, tableTop - 15);
                cs.showText("SUBTOTAL");
                cs.endText();
            }

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
                            ? it.getProducto().getNombre()
                            : safeString(it.getNotas());
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA, 10);
                    cs.newLineAtOffset(colDescX, rowY - 15);
                    cs.showText(desc);
                    cs.endText();

                    if (showPrices && it.getPrecioUnitario() != null) {
                        cs.beginText();
                        cs.setFont(PDType1Font.HELVETICA, 10);
                        cs.newLineAtOffset(colPreX, rowY - 15);
                        cs.showText("$" + new java.text.DecimalFormat("#,##0.00").format(it.getPrecioUnitario()));
                        cs.endText();

                        cs.beginText();
                        cs.setFont(PDType1Font.HELVETICA, 10);
                        cs.newLineAtOffset(colSubX, rowY - 15);
                        java.math.BigDecimal subtotal = it.getCantidad().multiply(it.getPrecioUnitario());
                        cs.showText("$" + new java.text.DecimalFormat("#,##0.00").format(subtotal));
                        cs.endText();
                    }

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

            // SECCIÓN INFERIOR — nueva página si hay poco espacio
            float bottomY = rowY - 30;
            if (bottomY < 180) {
                cs.close();
                page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                cs = new PDPageContentStream(doc, page);
                bottomY = h - margin - 40;
            }

            // Observaciones (si existen)
            String observaciones = remito.getObservaciones() == null ? "" : remito.getObservaciones();
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

            // Total a pagar
            bottomY -= 25;
            cs.beginText();
            cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(x, bottomY);
            if (showPrices) {
                cs.showText("TOTAL A PAGAR: $" + new java.text.DecimalFormat("#,##0.00").format(remito.getTotal()));
            } else {
                cs.showText("TOTAL A PAGAR: $ ___________________");
            }
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
        if (cantidad == null)
            return "0";
        if (cantidad.stripTrailingZeros().scale() <= 0) {
            return cantidad.toBigInteger().toString();
        }
        return cantidad.setScale(2, java.math.RoundingMode.HALF_UP).toString();
    }

    // Método helper para dividir texto en líneas
    private String[] splitText(String text, int maxLength) {
        if (text == null)
            return new String[0];
        String[] hardLines = text.split("\n");
        java.util.List<String> lines = new java.util.ArrayList<>();
        for (String hardLine : hardLines) {
            String sanitized = hardLine.replace('\t', ' ').replace('\r', ' ');
            if (sanitized.length() <= maxLength) {
                lines.add(sanitized);
            } else {
                int start = 0;
                while (start < sanitized.length()) {
                    int end = Math.min(start + maxLength, sanitized.length());
                    if (end < sanitized.length()) {
                        int lastSpace = sanitized.lastIndexOf(' ', end);
                        if (lastSpace > start) {
                            end = lastSpace;
                        }
                    }
                    lines.add(sanitized.substring(start, end).trim());
                    start = end;
                }
            }
        }
        return lines.toArray(new String[0]);
    }

    // Helper para strings seguros
    private String safeString(String s) {
        if (s == null)
            return "";
        return s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ');
    }
}