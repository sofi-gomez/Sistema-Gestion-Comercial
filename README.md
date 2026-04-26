# 🌱 Sistema de Gestión Comercial - Agro-Ferretería

Sistema integral de gestión comercial desarrollado para optimizar las operaciones diarias de una agro-ferretería. Esta solución "Premium" abarca desde el control de stock bimoneda hasta la auditoría de documentos financieros y métricas de caja en tiempo real.

## 📋 Tabla de Contenidos

- [Características Destacadas](#-características-destacadas)
- [Tecnologías](#-tecnologías)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Seguridad y Arquitectura](#-seguridad-y-arquitectura)
- [Instalación](#-instalación)
  
## ✨ Características Destacadas

### 🎯 Funcionalidades de Alto Valor

- **Gestión Bimoneda Nativa**: Manejo fluido de precios y transacciones tanto en **Pesos Argentinos (ARS)** como en **Dólares (USD)**, con conversión automática basada en una cotización centralizada.
- **Auditoría y Edición Financiera**: Capacidad única para corregir metadatos (fechas, observaciones, detalles de cheques) en Órdenes de Pago y Recibos de Cobro, garantizando la integridad de los montos contables.
- **Dashboard de Caja (Resumen del Día)**: Visualización granular de ingresos y egresos clasificados por medios de pago (efectivo, cheques, transferencias, etc.) para cierres de caja precisos.
- **Flujo de Ventas por Estados**: Proceso optimizado que gestiona el ciclo de vida del remito: **Pendiente** (salida de stock) -> **Valorizado** (congelamiento de precio) -> **Cobrado** (liquidación financiera).
- **Documentación Profesional en PDF**: Generación instantánea de remitos, recibos de cobro y órdenes de pago con diseño corporativo e isologotipo.

## 🛠️ Tecnologías

### Backend
- **Java 17** con **Spring Boot 3.x**
- **Spring Security + JWT**: Autenticación stateless robusta.
- **JPA / Hibernate**: Consultas optimizadas con MySQL 8.0.
- **Lombok**: Código limpio y manejo eficiente de logs.

### Frontend
- **React 18**: Interfaz de usuario dinámica y reactiva.
- **React Router**: Navegación SPA fluida.
- **CSS3 Moderno**: UI/UX Premium con variables globales, Glassmorphism y diseño responsivo.
- **Fetch API**: Interceptores personalizados para la gestión de seguridad JWT.

## 📦 Módulos del Sistema

### 1. 📦 Inventario Inteligente
- Control exhaustivo de productos con alertas de stock crítico.
- Herramienta de **Actualización Masiva** por porcentaje, facilitando la gestión inflacionaria.
- Historial de costos y márgenes de ganancia calculados automáticamente.

### 2. 🛒 Ventas y Ciclo de Remitos
- Creación rápida de remitos con búsqueda predictiva.
- **Valorización Flexible**: Permite asignar precios de catálogo o manuales al momento de la venta, soportando múltiples monedas.
- Conversión directa de Remito Valorizado a Cobro para agilizar la atención al cliente.

### 3. 💰 Tesorería y Finanzas
- Gestión unificada de **Cartera de Cheques** (físicos y electrónicos).
- Sincronización automática de movimientos al confirmar compras (Órdenes de Pago) o ventas (Recibos de Cobro).
- Reportes cronológicos de Caja Diaria, Mensual y Anual.

### 4. 👥 Clientes y Proveedores
- **Cuenta Corriente**: Seguimiento detallado de saldos pendientes y pagos realizados.
- **Historial Unificado**: Vista cronológica de todas las operaciones comerciales (compras/ventas) y financieras (pagos/cobros) en una sola pantalla.

## 🔒 Seguridad
- **Sesiones Seguras**: Expiración automática y renovación de tokens JWT.
- **Protección de Datos**: Gestión de credenciales dinámicas para el administrador.
- **Integridad Referencial**: Prevención de inconsistencias financieras mediante montos inmutables en documentos emitidos.

## 🚀 Instalación

### Prerrequisitos
- Java 17+
- Node.js 16+
- MySQL 8.0+
- Maven 3.8+

### Clonar y Configurar
```bash
git clone https://github.com/sofi-gomez/Sistema-Gestion-Comercial.git
```

### Ejecución del Sistema

1. **Base de Datos**: Crear esquema en MySQL:
   ```sql
   CREATE DATABASE sistema_gestion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Servidor (Backend)**:
   ```bash
   cd backend/Sistema-Gestion
   mvn spring-boot:run
   ```

3. **Cliente (Frontend)**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 👤 Autoras

**Sofia Gutierrez, Guadalupe Aban, Sonia Guevara, Guadalupe Dominguez y Sofía Gómez**
- Empresa: Leonel Gómez - Agro-Ferretería
- Ubicación: Argentina

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub

*"NUESTRAS PLANTAS NUNCA DUERMEN"* 🌱
