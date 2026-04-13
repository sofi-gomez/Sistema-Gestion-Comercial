package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.*;
import com.example.Sistema_Gestion.repository.*;
import com.example.Sistema_Gestion.dto.MovimientoDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio central del flujo de cobros a clientes.
 *
 * Flujo:
 * 1. Cliente llega a pagar → se crea un Cobro
 * 2. El cobro se distribuye entre uno o más remitos (CobroRemito)
 * 3. El cobro puede ser con múltiples medios (CobroMedioPago)
 * 4. Tras cada cobro se recalcula si cada remito quedó cancelado
 */
@Service
public class CobroService {

    private final CobroRepository cobroRepository;
    private final CobroRemitoRepository cobroRemitoRepository;
    private final RemitoRepository remitoRepository;
    private final RemitoService remitoService;
    private final TesoreriaService tesoreriaService;
    private final ClienteRepository clienteRepository;

    public CobroService(CobroRepository cobroRepository,
            CobroRemitoRepository cobroRemitoRepository,
            RemitoRepository remitoRepository,
            RemitoService remitoService,
            TesoreriaService tesoreriaService,
            ClienteRepository clienteRepository) {
        this.cobroRepository = cobroRepository;
        this.cobroRemitoRepository = cobroRemitoRepository;
        this.remitoRepository = remitoRepository;
        this.remitoService = remitoService;
        this.tesoreriaService = tesoreriaService;
        this.clienteRepository = clienteRepository;
    }

    /**
     * Registra un cobro completo.
     *
     * @param cobro             Entidad cobro (con cliente + fecha + observaciones)
     * @param importesPorRemito Mapa remitoId -> importe aplicado a ese remito.
     *                          La suma debe coincidir con cobro.totalCobrado.
     * @param mediosPago        Lista de medios de pago a guardar (ya construidos)
     */
    @Transactional
    public Cobro registrarCobro(
            Cobro cobro,
            Map<Long, BigDecimal> importesPorRemito,
            List<CobroMedioPago> mediosPago) {
        // 1. Calcular y validar el total
        BigDecimal sumaAplicadaRemitos = importesPorRemito.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Si se especificaron remitos, el total debe ser la suma de lo aplicado.
        // Si no (cobro a cuenta), usamos el total ya seteado en el objeto cobro.
        if (!importesPorRemito.isEmpty()) {
            cobro.setTotalCobrado(sumaAplicadaRemitos);
        } else if (cobro.getTotalCobrado() == null || cobro.getTotalCobrado().compareTo(BigDecimal.ZERO) <= 0) {
            // Validar que si no hay remitos, al menos haya un monto total declarado.
            BigDecimal sumaMedios = mediosPago != null ? mediosPago.stream()
                    .map(CobroMedioPago::getImporte)
                    .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;
            cobro.setTotalCobrado(sumaMedios);
        }

        if (cobro.getFecha() == null) {
            cobro.setFecha(LocalDate.now());
        }

        // Capturar nombre antes del save para evitar proxy Hibernate
        String nombreCliente = "Cliente";
        if (cobro.getCliente() != null) {
            if (cobro.getCliente().getNombre() != null && !cobro.getCliente().getNombre().isEmpty()) {
                nombreCliente = cobro.getCliente().getNombre();
            } else if (cobro.getCliente().getId() != null) {
                nombreCliente = clienteRepository.findById(cobro.getCliente().getId())
                        .map(Cliente::getNombre)
                        .orElse("Cliente");
            }
        }

        // 2. Persistir el cobro principal
        Cobro savedCobro = cobroRepository.save(cobro);

        // Distribuir el cobro entre los remitos indicados
        for (Map.Entry<Long, BigDecimal> entry : importesPorRemito.entrySet()) {
            Long remitoId = entry.getKey();
            BigDecimal importe = entry.getValue();

            Remito remito = remitoRepository.findById(remitoId)
                    .orElseThrow(() -> new RuntimeException("Remito no encontrado: " + remitoId));

            if (remito.getEstado() != Remito.EstadoRemito.VALORIZADO) {
                throw new IllegalStateException(
                        "El remito " + remitoId + " debe estar VALORIZADO para poder cobrarse");
            }

            // Registrar el importe aplicado a este remito
            CobroRemito cobroRemito = new CobroRemito();
            cobroRemito.setCobro(savedCobro);
            cobroRemito.setRemito(remito);
            cobroRemito.setImporte(importe);
            savedCobro.getRemitos().add(cobroRemito);

            // Calcular total cobrado acumulado en este remito
            BigDecimal yaCobradobAntes = cobroRemitoRepository.totalCobradoPorRemito(remitoId);
            BigDecimal totalCobradoAhora = yaCobradobAntes.add(importe);

            // Actualizar estado del remito si quedó saldado
            remitoService.actualizarEstadoPostCobro(remito, totalCobradoAhora);
        }

        // AF-09: Calcular excedente y acumularlo como saldo a favor
        if (!importesPorRemito.isEmpty() && cobro.getCliente() != null && cobro.getCliente().getId() != null) {
            // Suma total de los remitos originales (deuda)
            BigDecimal deudaTotal = importesPorRemito.keySet().stream()
                    .map(remitoId -> remitoRepository.findById(remitoId)
                            .map(r -> r.getTotal() != null ? r.getTotal() : BigDecimal.ZERO)
                            .orElse(BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal excedente = sumaAplicadaRemitos.subtract(deudaTotal);
            if (excedente.compareTo(BigDecimal.ZERO) > 0) {
                clienteRepository.findById(cobro.getCliente().getId()).ifPresent(cliente -> {
                    BigDecimal actual = cliente.getSaldoAFavor();
                    cliente.setSaldoAFavor(actual.add(excedente));
                    clienteRepository.save(cliente);
                });
            }
        }

        // 4. Registrar los medios de pago y movimientos de tesorería
        if (mediosPago != null) {
            for (CobroMedioPago medio : mediosPago) {
                medio.setCobro(savedCobro);
                savedCobro.getMediosPago().add(medio);

                // ✅ Crear Movimiento de Tesorería automáticamente
                MovimientoTesoreria mov = new MovimientoTesoreria();
                mov.setTipo("INGRESO");
                mov.setMedioPago(medio.getMedio()); // El modelo CobroMedioPago usa String para medio
                mov.setImporte(medio.getImporte());
                mov.setFecha(savedCobro.getFecha().atStartOfDay());
                
                // Simplificar descripción: Solo mostrar observaciones manuales
                String desc = (medio.getCobro().getObservaciones() != null && !medio.getCobro().getObservaciones().trim().isEmpty())
                              ? medio.getCobro().getObservaciones().trim()
                              : "Cobro de Cliente";
                mov.setDescripcion(desc);
                
                mov.setReferencia("Cobro #" + savedCobro.getId());
                mov.setEntidad(nombreCliente);

                // Si es cheque, copiar datos
                if ("CHEQUE".equals(medio.getMedio()) || "CHEQUE_ELECTRONICO".equals(medio.getMedio())) {
                    mov.setBanco(medio.getBanco());
                    mov.setNumeroCheque(medio.getNumeroCheque());
                    mov.setLibrador(medio.getLibrador());
                    mov.setFechaEmision(medio.getFechaEmision());
                    mov.setFechaVencimiento(medio.getFechaVencimiento());
                }

                tesoreriaService.registrarMovimiento(mov);
            }
        }

        return cobroRepository.save(savedCobro);
    }

    public List<Cobro> listarPorCliente(Long clienteId) {
        return cobroRepository.findByClienteIdOrderByFechaDesc(clienteId);
    }

    /**
     * Obtiene una lista unificada de movimientos (Remitos valorizados y Cobros)
     * ordenados por fecha.
     */
    public List<MovimientoDto> getMovimientos(Long clienteId) {
        List<MovimientoDto> movimientos = new ArrayList<>();

        // 1. Agregar Remitos valorizados (Debe)
        List<Remito> remitos = remitoRepository.findByClienteIdAndEstadoOrderByFechaDesc(clienteId,
                Remito.EstadoRemito.VALORIZADO);
        remitos.addAll(remitoRepository.findByClienteIdAndEstadoOrderByFechaDesc(clienteId,
                Remito.EstadoRemito.COBRADO));

        for (Remito r : remitos) {
            movimientos.add(new MovimientoDto(
                    r.getFecha(),
                    "DEBE",
                    "Remito #" + r.getNumero(),
                    r.getTotal(),
                    r.getId()));
        }

        // 2. Agregar Cobros (Haber)
        List<Cobro> cobros = cobroRepository.findByClienteIdOrderByFechaDesc(clienteId);
        for (Cobro c : cobros) {
            if (!c.getAnulado()) {
                movimientos.add(new MovimientoDto(
                        c.getFecha(),
                        "HABER",
                        c.getObservaciones() != null ? c.getObservaciones() : "Cobro recibido",
                        c.getTotalCobrado(),
                        c.getId()));
            }
        }

        // 3. Ordenar por fecha descending (más reciente primero)
        return movimientos.stream()
                .sorted(Comparator.comparing(MovimientoDto::getFecha).reversed())
                .collect(Collectors.toList());
    }

    public Optional<Cobro> buscarPorId(Long id) {
        return cobroRepository.findById(id);
    }

    /**
     * Devuelve el saldo pendiente de un cliente:
     * total de remitos (VALORIZADO o COBRADO) - total cobrado efectivamente.
     */
    public BigDecimal calcularSaldoCliente(Long clienteId) {
        BigDecimal deudaTotal = remitoRepository.totalContabilizadoPorCliente(clienteId);
        BigDecimal totalCobrado = cobroRepository.totalCobradoPorCliente(clienteId);
        return deudaTotal.subtract(totalCobrado);
    }

    @Transactional
    public boolean anularCobro(Long id) {
        return cobroRepository.findById(id).map(cobro -> {
            if (Boolean.TRUE.equals(cobro.getAnulado())) {
                return true; // Ya anulado
            }

            cobro.setAnulado(true);
            cobroRepository.save(cobro);

            // 1. Revertir impacto en Saldo a Favor del cliente (AF-09)
            if (cobro.getCliente() != null && cobro.getCliente().getId() != null) {
                // Recalcular el excedente original que se acreditó
                BigDecimal sumaAplicadaRemitos = cobro.getTotalCobrado();
                BigDecimal deudaTotalCubierta = cobro.getRemitos().stream()
                        .map(cr -> cr.getRemito().getTotal() != null ? cr.getRemito().getTotal() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                BigDecimal excedenteOriginal = sumaAplicadaRemitos.subtract(deudaTotalCubierta);
                if (excedenteOriginal.compareTo(BigDecimal.ZERO) > 0) {
                    clienteRepository.findById(cobro.getCliente().getId()).ifPresent(cliente -> {
                        BigDecimal actual = cliente.getSaldoAFavor();
                        cliente.setSaldoAFavor(actual.subtract(excedenteOriginal));
                        clienteRepository.save(cliente);
                    });
                }
            }

            // 2. Anular los movimientos de tesorería asociados a este cobro
            tesoreriaService.anularPorReferencia("Cobro #" + cobro.getId());

            // 3. Revertir estado de remitos asociados
            for (CobroRemito cr : cobro.getRemitos()) {
                Remito remito = cr.getRemito();
                // Recalcular total cobrado real sobre este remito SIN este cobro anulado
                BigDecimal totalCobrado = cobroRemitoRepository.totalCobradoPorRemito(remito.getId());
                remitoService.actualizarEstadoPostCobro(remito, totalCobrado);
            }

            return true;
        }).orElse(false);
    }

    public Map<String, Object> getDashboardSummary() {
        LocalDate hoy = LocalDate.now();
        LocalDate haceUnaSemana = hoy.minusDays(7);
        LocalDate inicioMes = hoy.withDayOfMonth(1);

        List<Remito> remitoss = remitoRepository.findAll();

        // 1. Calcular Cuentas por Cobrar Total (ARS)
        BigDecimal deudaTotal = remitoss.stream()
                .filter(r -> r.getEstado() == Remito.EstadoRemito.VALORIZADO
                        || r.getEstado() == Remito.EstadoRemito.COBRADO)
                .map(r -> r.getTotal() != null ? r.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cobradoTotal = cobroRepository.findAll().stream()
                .filter(c -> c.getAnulado() != null && !c.getAnulado())
                .map(c -> c.getTotalCobrado() != null ? c.getTotalCobrado() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cuentasPorCobrar = deudaTotal.subtract(cobradoTotal);

        // 2. Métricas de Ventas por Período
        BigDecimal ventasHoy = remitoss.stream()
                .filter(r -> r.getFecha() != null && r.getFecha().isEqual(hoy))
                .map(r -> r.getTotal() != null ? r.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ventasSemana = remitoss.stream()
                .filter(r -> r.getFecha() != null && !r.getFecha().isBefore(haceUnaSemana))
                .map(r -> r.getTotal() != null ? r.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ventasMes = remitoss.stream()
                .filter(r -> r.getFecha() != null && !r.getFecha().isBefore(inicioMes))
                .map(r -> r.getTotal() != null ? r.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new HashMap<>();
        summary.put("cuentasPorCobrar", cuentasPorCobrar);
        summary.put("ventasHoy", ventasHoy);
        summary.put("ventasSemana", ventasSemana);
        summary.put("ventasMes", ventasMes);

        return summary;
    }

    // =================== PDF: RECIBO DE COBRO ===================

    public void generarPdfRecibo(Long cobroId, java.io.OutputStream os, byte[] logoBytes) throws Exception {
        Cobro cobro = cobroRepository.findById(cobroId)
                .orElseThrow(() -> new RuntimeException("Cobro no encontrado: " + cobroId));

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
            cs.newLineAtOffset(w / 2f - 70, y - 28);
            cs.showText("RECIBO DE COBRO");
            cs.endText();

            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 13);
            cs.newLineAtOffset(w / 2f - 30, y - 50);
            cs.showText("RC-" + String.format("%05d", cobro.getId()));
            cs.endText();

            String fecha = cobro.getFecha() != null
                    ? cobro.getFecha().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
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
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 10);
            cs.newLineAtOffset(margin, y);
            cs.showText("Leonel Gomez – Agro-Ferretería");
            cs.endText();

            // ----- CLIENTE -----
            y -= 25;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, y);
            cs.showText("DATOS DEL CLIENTE");
            cs.endText();

            y -= 18;
            String clienteNombre = cobro.getCliente() != null ? cobro.getCliente().getNombre() : "—";
            String clienteCuit = (cobro.getCliente() != null && cobro.getCliente().getDocumento() != null)
                    ? cobro.getCliente().getDocumento() : "—";
            drawLabelValue(cs, margin, y, "Cliente:", clienteNombre);
            y -= 16;
            drawLabelValue(cs, margin, y, "CUIT:", clienteCuit);

            // Línea separadora
            y -= 18;
            cs.setLineWidth(0.5f);
            cs.moveTo(margin, y); cs.lineTo(w - margin, y); cs.stroke();

            // ----- DETALLE DE VALORES RECIBIDOS -----
            y -= 20;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, y);
            cs.showText("VALORES RECIBIDOS");
            cs.endText();

            // Cabecera tabla
            y -= 20;
            cs.setNonStrokingColor(new java.awt.Color(230, 230, 230));
            cs.addRect(margin, y - 18, w - 2 * margin, 18); cs.fill();
            cs.setNonStrokingColor(java.awt.Color.BLACK);
            cs.setLineWidth(0.4f);
            cs.addRect(margin, y - 18, w - 2 * margin, 18); cs.stroke();

            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(margin + 5, y - 13); cs.showText("Medio"); cs.endText();
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(margin + 120, y - 13); cs.showText("Detalle"); cs.endText();
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
            cs.newLineAtOffset(w - margin - 80, y - 13); cs.showText("Importe"); cs.endText();

            y -= 18;
            if (cobro.getMediosPago() != null) {
                for (com.example.Sistema_Gestion.model.CobroMedioPago mp : cobro.getMediosPago()) {
                    cs.setLineWidth(0.2f);
                    cs.addRect(margin, y - 16, w - 2 * margin, 16); cs.stroke();

                    String medioLabel = mp.getMedio() != null ? mp.getMedio().replace("_", " ") : "EFECTIVO";
                    String detalleLabel = "";
                    if (mp.getMedio() != null && mp.getMedio().contains("CHEQUE")) {
                        detalleLabel = "Banco: " + safe(mp.getBanco())
                                + " | N°: " + safe(mp.getNumeroCheque())
                                + " | Vto: " + (mp.getFechaVencimiento() != null
                                        ? mp.getFechaVencimiento().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yy")) : "—");
                    } else if ("TRANSFERENCIA".equals(mp.getMedio())) {
                        detalleLabel = "Transferencia bancaria";
                    }

                    cs.beginText();
                    cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
                    cs.newLineAtOffset(margin + 5, y - 11); cs.showText(medioLabel); cs.endText();

                    cs.beginText();
                    cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 8);
                    cs.newLineAtOffset(margin + 120, y - 11); cs.showText(detalleLabel); cs.endText();

                    String importeStr = "$ " + (mp.getImporte() != null
                            ? mp.getImporte().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "0.00");
                    cs.beginText();
                    cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
                    cs.newLineAtOffset(w - margin - 78, y - 11); cs.showText(importeStr); cs.endText();

                    y -= 18;
                }
            }

            // Total cobrado
            y -= 8;
            cs.setLineWidth(1f);
            cs.moveTo(margin, y); cs.lineTo(w - margin, y); cs.stroke();
            y -= 18;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
            cs.newLineAtOffset(w - margin - 200, y);
            String totalStr = "TOTAL RECIBIDO: $ " + (cobro.getTotalCobrado() != null
                    ? cobro.getTotalCobrado().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "0.00");
            cs.showText(totalStr);
            cs.endText();

            // Línea separadora
            y -= 18;
            cs.setLineWidth(0.5f);
            cs.moveTo(margin, y); cs.lineTo(w - margin, y); cs.stroke();

            // ----- IMPUTACIÓN A REMITOS -----
            y -= 20;
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
            cs.newLineAtOffset(margin, y);
            cs.showText("APLICADO A / CANCELACIÓN DE DEUDA");
            cs.endText();

            y -= 18;
            if (cobro.getRemitos() != null && !cobro.getRemitos().isEmpty()) {
                for (com.example.Sistema_Gestion.model.CobroRemito cr : cobro.getRemitos()) {
                    if (cr.getRemito() == null) continue;
                    cs.setLineWidth(0.2f);
                    cs.addRect(margin, y - 14, w - 2 * margin, 14); cs.stroke();
                    cs.beginText();
                    cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
                    cs.newLineAtOffset(margin + 5, y - 10);
                    cs.showText("Remito N° " + cr.getRemito().getNumero()); cs.endText();
                    String montoImput = "$ " + (cr.getImporte() != null
                            ? cr.getImporte().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "—");
                    cs.beginText();
                    cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
                    cs.newLineAtOffset(w - margin - 78, y - 10); cs.showText(montoImput); cs.endText();
                    y -= 16;
                }
            } else {
                cs.beginText();
                cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
                cs.newLineAtOffset(margin + 5, y - 10);
                cs.showText("Pago a cuenta sin imputación específica"); cs.endText();
                y -= 16;
            }

            // Observaciones
            if (cobro.getObservaciones() != null && !cobro.getObservaciones().isBlank()) {
                y -= 10;
                cs.beginText();
                cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 9);
                cs.newLineAtOffset(margin, y); cs.showText("Observaciones: "); cs.endText();
                y -= 13;
                cs.beginText();
                cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
                cs.newLineAtOffset(margin + 5, y);
                cs.showText(safe(cobro.getObservaciones())); cs.endText();
                y -= 16;
            }

            // ----- FIRMA -----
            y -= 20;
            cs.setLineWidth(0.8f);
            cs.moveTo(margin + 20, y - 2); cs.lineTo(margin + 170, y - 2); cs.stroke();
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(margin + 55, y - 14); cs.showText("Firma del cliente"); cs.endText();

            cs.moveTo(w - margin - 150, y - 2); cs.lineTo(w - margin - 10, y - 2); cs.stroke();
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
            cs.newLineAtOffset(w - margin - 120, y - 14); cs.showText("Firma / Sello empresa"); cs.endText();

            // Pie
            cs.beginText();
            cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 7);
            cs.newLineAtOffset(w / 2f - 130, 30);
            cs.showText("DOCUMENTO NO VÁLIDO COMO FACTURA – Los cheques están sujetos a acreditación bancaria.");
            cs.endText();

            cs.close();
            doc.save(os);
        }
    }

    private void drawLabelValue(org.apache.pdfbox.pdmodel.PDPageContentStream cs, float x, float y,
            String label, String value) throws Exception {
        cs.beginText();
        cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 10);
        cs.newLineAtOffset(x, y); cs.showText(label); cs.endText();
        cs.beginText();
        cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
        cs.newLineAtOffset(x + 60, y); cs.showText(safe(value)); cs.endText();
    }

    private String safe(String s) {
        if (s == null) return "";
        return s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ');
    }
}

