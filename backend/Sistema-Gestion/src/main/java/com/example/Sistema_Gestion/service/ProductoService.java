package com.example.Sistema_Gestion.service;

import com.example.Sistema_Gestion.model.Producto;
import com.example.Sistema_Gestion.repository.ProductoRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> buscarPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto guardar(Producto producto) {
        // Limpieza de datos
        if (producto.getSku() != null) producto.setSku(producto.getSku().trim());
        if (producto.getNombre() != null) producto.setNombre(producto.getNombre().trim());

        // Verificación de duplicados (Evitar 500 genérico de DB)
        if (producto.getSku() != null && !producto.getSku().isEmpty()) {
            productoRepository.findBySku(producto.getSku()).ifPresent(p -> {
                throw new RuntimeException("El SKU '" + producto.getSku() + "' ya está en uso por el producto: " + p.getNombre());
            });
        }
        
        return productoRepository.save(producto);
    }

    public void eliminar(Long id) {
        productoRepository.deleteById(id);
    }

    @Transactional
    public boolean descontarStock(Long productoId, Integer cantidad) {
        if (cantidad == null || cantidad <= 0) return false;
        
        return productoRepository.findById(productoId).map(producto -> {
            Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;

            if (stockActual >= cantidad) {
                producto.setStock(stockActual - cantidad);
                productoRepository.save(producto);
                return true;
            }
            return false;
        }).orElse(false);
    }

    @Transactional
    public void aumentarStock(Long productoId, Integer cantidad) {
        if (cantidad == null || cantidad <= 0) return;
        
        productoRepository.findById(productoId).ifPresent(producto -> {
            Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
            producto.setStock(stockActual + cantidad);
            productoRepository.save(producto);
        });
    }

    @Transactional
    public void forzarDescontarStock(Long productoId, Integer cantidad) {
        if (cantidad == null || cantidad <= 0) return;
        
        productoRepository.findById(productoId).ifPresent(producto -> {
            Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
            producto.setStock(stockActual - cantidad);
            productoRepository.save(producto);
        });
    }

    @Transactional
    public Producto actualizarProductoInfo(Long id, Producto data) {
        // Limpieza de datos
        String nuevoSku = data.getSku() != null ? data.getSku().trim() : "";
        String nuevoNombre = data.getNombre() != null ? data.getNombre().trim() : "";

        // Verificación de duplicado si el SKU cambió
        if (!nuevoSku.isEmpty()) {
            productoRepository.findBySku(nuevoSku).ifPresent(p -> {
                if (!p.getId().equals(id)) {
                    throw new RuntimeException("No se puede actualizar: El SKU '" + nuevoSku + "' ya está siendo usado por otro producto.");
                }
            });
        }

        return productoRepository.findById(id).map(p -> {
            p.setNombre(nuevoNombre);
            p.setSku(nuevoSku);
            p.setDescripcion(data.getDescripcion() != null ? data.getDescripcion().trim() : "");
            p.setPrecioCosto(data.getPrecioCosto());
            p.setPrecioVenta(data.getPrecioVenta());
            p.setPrecioCostoUSD(data.getPrecioCostoUSD());
            p.setPrecioVentaUSD(data.getPrecioVentaUSD());
            p.setUnidadMedida(data.getUnidadMedida());
            p.setActivo(data.getActivo());
            p.setFechaVencimiento(data.getFechaVencimiento());
            p.setPorcentajeIva(data.getPorcentajeIva());
            p.setPorcentajeUtilidad(data.getPorcentajeUtilidad());
            return productoRepository.save(p);
        }).orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    public boolean tieneStockSuficiente(Long productoId, Integer cantidadRequerida) {
        return productoRepository.findById(productoId)
                .map(producto -> {
                    Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
                    return stockActual >= cantidadRequerida;
                })
                .orElse(false);
    }

    public Map<String, Object> getDashboardSummary() {
        List<Producto> todos = productoRepository.findAll();
        LocalDate hoy = LocalDate.now();
        LocalDate proximoVencimiento = hoy.plusDays(30);

        long totalProductos = todos.size();
        long stockCritico = todos.stream()
                .filter(p -> p.getStock() != null && p.getStock() <= 5) // Umbral arbitrario de 5
                .count();

        long proximosAVencer = todos.stream()
                .filter(p -> p.getFechaVencimiento() != null &&
                        !p.getFechaVencimiento().isBefore(hoy) &&
                        !p.getFechaVencimiento().isAfter(proximoVencimiento))
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalProductos", totalProductos);
        summary.put("stockCritico", stockCritico);
        summary.put("proximosAVencer", proximosAVencer);

        return summary;
    }

    @Transactional
    public void actualizarPreciosMasivo(Double porcentaje, String tipo) {
        List<Producto> productos = productoRepository.findAll();
        BigDecimal factor = BigDecimal.valueOf(1 + (porcentaje / 100));

        for (Producto p : productos) {
            if ("COSTO".equals(tipo) || "AMBOS".equals(tipo)) {
                if (p.getPrecioCosto() != null) {
                    p.setPrecioCosto(p.getPrecioCosto().multiply(factor).setScale(2, RoundingMode.HALF_UP));
                }
                if (p.getPrecioCostoUSD() != null) {
                    p.setPrecioCostoUSD(p.getPrecioCostoUSD().multiply(factor).setScale(2, RoundingMode.HALF_UP));
                }
            }
            if ("VENTA".equals(tipo) || "AMBOS".equals(tipo)) {
                if (p.getPrecioVenta() != null) {
                    p.setPrecioVenta(p.getPrecioVenta().multiply(factor).setScale(2, RoundingMode.HALF_UP));
                }
                if (p.getPrecioVentaUSD() != null) {
                    p.setPrecioVentaUSD(p.getPrecioVentaUSD().multiply(factor).setScale(2, RoundingMode.HALF_UP));
                }
            }
        }
        productoRepository.saveAll(productos);
    }

    public byte[] exportarExcel() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Productos");

            Row headerRow = sheet.createRow(0);
            String[] columns = { "SKU", "Nombre", "Descripción", "Stock", "Precio Costo", "Precio Venta", "Unidad",
                    "Vencimiento", "IVA %", "Utilidad %" };
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }

            List<Producto> productos = productoRepository.findAll();
            int rowIdx = 1;
            for (Producto p : productos) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getSku());
                row.createCell(1).setCellValue(p.getNombre());
                row.createCell(2).setCellValue(p.getDescripcion());
                row.createCell(3).setCellValue(p.getStock() != null ? p.getStock() : 0);
                row.createCell(4).setCellValue(p.getPrecioCosto() != null ? p.getPrecioCosto().doubleValue() : 0);
                row.createCell(5).setCellValue(p.getPrecioVenta() != null ? p.getPrecioVenta().doubleValue() : 0);
                row.createCell(6).setCellValue(p.getUnidadMedida());
                row.createCell(7)
                        .setCellValue(p.getFechaVencimiento() != null ? p.getFechaVencimiento().toString() : "");
                row.createCell(8).setCellValue(p.getPorcentajeIva() != null ? p.getPorcentajeIva().doubleValue() : 0);
                row.createCell(9).setCellValue(p.getPorcentajeUtilidad() != null ? p.getPorcentajeUtilidad().doubleValue() : 0);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public void importarExcel(InputStream is) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                String sku = getCellValueAsString(row.getCell(0));
                if (sku == null || sku.isEmpty())
                    continue;

                Producto p = productoRepository.findBySku(sku).orElse(new Producto());
                p.setSku(sku);
                p.setNombre(getCellValueAsString(row.getCell(1)));
                p.setDescripcion(getCellValueAsString(row.getCell(2)));

                Cell stockCell = row.getCell(3);
                if (stockCell != null) {
                    if (stockCell.getCellType() == CellType.NUMERIC) {
                        p.setStock((int) stockCell.getNumericCellValue());
                    }
                }

                Cell costoCell = row.getCell(4);
                if (costoCell != null) {
                    if (costoCell.getCellType() == CellType.NUMERIC) {
                        p.setPrecioCosto(BigDecimal.valueOf(costoCell.getNumericCellValue()));
                    }
                }

                Cell ventaCell = row.getCell(5);
                if (ventaCell != null) {
                    if (ventaCell.getCellType() == CellType.NUMERIC) {
                        p.setPrecioVenta(BigDecimal.valueOf(ventaCell.getNumericCellValue()));
                    }
                }

                p.setUnidadMedida(getCellValueAsString(row.getCell(6)));

                Cell ivaCell = row.getCell(8);
                if (ivaCell != null && ivaCell.getCellType() == CellType.NUMERIC) {
                    p.setPorcentajeIva(BigDecimal.valueOf(ivaCell.getNumericCellValue()));
                }

                Cell utilidadCell = row.getCell(9);
                if (utilidadCell != null && utilidadCell.getCellType() == CellType.NUMERIC) {
                    p.setPorcentajeUtilidad(BigDecimal.valueOf(utilidadCell.getNumericCellValue()));
                }

                productoRepository.save(p);
            }
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            default:
                return null;
        }
    }
}