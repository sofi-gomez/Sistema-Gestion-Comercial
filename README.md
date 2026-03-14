# 🌱 Sistema de Gestión Comercial - Leonel Gómez Agro-Ferretería

Sistema integral de gestión comercial desarrollado para optimizar las operaciones diarias de una agro-ferretería. Incluye módulos de inventario, ventas, tesorería, clientes, proveedores, generación de remitos y un panel de control con métricas en tiempo real.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Módulos](#-módulos)
- [Seguridad y Arquitectura](#-seguridad-y-arquitectura)
- [Instalación](#-instalación)
  
## ✨ Características

### 🎯 Funcionalidades Principales

- **Dashboard Interactivo**: Métricas clave en tiempo real (ventas del día, remitos pendientes, deudas).
- **Gestión de Inventario**: Control completo de productos, precios, stock y actualización masiva de precios por porcentaje.
- **Sistema de Ventas y Remitos**: Registro de transacciones, autocompletado de datos del cliente y soporte para múltiples medios de pago.
- **Tesorería Integrada**: Seguimiento automático de ingresos y egresos, gestión de cheques y reportes de caja.
- **Gestión de Clientes y Proveedores**: Base de datos unificada con historiales de operaciones consolidados.
- **Exportación a PDF**: Generación de documentos listos para impresión o envío.
- **Configuración Global**: Panel de ajustes para gestionar parámetros del sistema como la cotización del dólar.

## 🛠️ Tecnologías

### Backend
- **Java 17**
- **Spring Boot 3.x** (Web, Data JPA, Security)
- **JSON Web Tokens (JWT)** - Autenticación Stateless
- **MySQL 8.0** - Base de datos relacional
- **Lombok** - Reducción de código boilerplate y logging
- **Maven** - Gestión de dependencias

### Frontend
- **React 18**
- **React Router** - Navegación de una sola página (SPA)
- **React Icons** - Iconografía moderna
- **CSS3** - UI/UX Premium con grid, flexbox y variables globales
- **Fetch API** - Cliente HTTP nativo con interceptores JWT

## 📦 Módulos

### 1. 📦 Mercadería
- Alta, baja y modificación de productos.
- Filtros avanzados y alertas visuales de stock bajo.
- Herramienta de **Actualización Masiva de Precios** por porcentaje.
- Cálculo automático de márgenes de ganancia.

### 2. 🛒 Ventas y Remitos
- Creación rápida de remitos con búsqueda predictiva de clientes.
- Sistema de estados: Pendiente -> Valorizado -> Cobrado.
- Vista expandible para revisar ítems sin salir de la tabla.
- Impresión de remitos en PDF con isologotipo corporativo.

### 3. 💰 Tesorería (Caja)
- Resumen automático del flujo de caja diario, semanal y mensual.
- Registro de cobros (desde Ventas) y pagos (desde Compras).
- Modal especializado para carga de datos de Cheques Electrónicos y Físicos.

### 4. 👥 Clientes y Proveedores
- Fichas detalladas con información de contacto, condición de IVA y código postal.
- Modal de **Historial Unificado**: Permite ver todas las compras y pagos de un proveedor en una sola vista cronológica.
- Notas internas visibles directamente en las tablas de operaciones.

## 🔒 Seguridad y Arquitectura

El sistema ha sido fortificado siguiendo estándares de la industria:
- **Autenticación Fuerte:** Implementación de JWT para sesiones seguras y sin estado (Stateless).
- **Protección de Rutas:** Todas las rutas del backend y frontend están protegidas; requieren un token válido.
- **Credenciales Dinámicas:** El administrador puede cambiar su usuario y contraseña desde una interfaz segura que exige verificación doble.
- **Manejo Global de Errores:** Interceptores `@ControllerAdvice` que previenen caídas del servidor y devuelven respuestas JSON estandarizadas.
- **Prevención de N+1 (LazyInitializationException):** Consultas JPA optimizadas con carga ansiosa (EAGER) estratégica.

## 🚀 Instalación

### Prerrequisitos
- Java 17+
- Node.js 16+
- MySQL 8.0+
- Maven 3.8+

### Backend

1. **Clonar el repositorio y entrar al backend**
```bash
git clone https://github.com/tu-usuario/sistema-gestion-comercial.git
cd sistema-gestion-comercial/backend/Sistema-Gestion
```

2. **Configurar base de datos**
Crear la base de datos en MySQL:
```sql
CREATE DATABASE sistema_gestion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Configurar Variables de Entorno (o application.properties)**
Asegúrate de configurar tus credenciales de base de datos y un secreto JWT fuerte.

4. **Compilar y ejecutar**
```bash
mvn clean install
mvn spring-boot:run
```
El backend estará disponible en `http://localhost:8080`. Se generará un usuario por defecto (`admin` / `admin123`) en la primera ejecución.

### Frontend

1. **Entrar al frontend e instalar dependencias**
```bash
cd ../../frontend
npm install
```

2. **Configurar Entorno**
Crear un archivo `.env` en la raíz de `frontend/` apuntando al backend:
```env
REACT_APP_API_URL=http://localhost:8080
```

3. **Ejecutar en modo desarrollo**
```bash
npm start
```

## 👤 Autoras

**Sofia Gutierrez, Guadalupe Aban, Sonia Guevara, Guadalupe Dominguez y Sofía Gómez**
- Empresa: Leonel Gómez - Agro-Ferretería
- Ubicación: Argentina

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub

*"NUESTRAS PLANTAS NUNCA DUERMEN"* 🌱
