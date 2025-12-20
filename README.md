# 🌱 Sistema de Gestión Comercial - Leonel Gómez Agro-Ferretería

Sistema integral de gestión comercial desarrollado para optimizar las operaciones diarias de una agro-ferretería. Incluye módulos de inventario, ventas, tesorería, clientes, proveedores y generación de remitos.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Módulos](#-módulos)
- [Instalación](#-instalación)
- [Licencia](#-licencia)

## ✨ Características

### 🎯 Funcionalidades Principales

- **Gestión de Inventario**: Control completo de productos con SKU, precios de costo/venta, stock y alertas
- **Sistema de Ventas**: Registro de transacciones con soporte para múltiples medios de pago
- **Tesorería Integrada**: Seguimiento automático de ingresos y egresos vinculados a ventas
- **Gestión de Cheques**: Captura completa de datos (banco, número, fechas de emisión/cobro/vencimiento)
- **Anulación de Operaciones**: Sistema de anulación con trazabilidad completa (sin eliminación para mayor confiabilidad en los reportes)
- **Gestión de Clientes**: Base de datos con información de contacto completa
- **Gestión de Proveedores**: Registro y seguimiento de proveedores
- **Generación de Remitos**: Creación automática de remitos con numeración

## 🛠️ Tecnologías

### Backend
- **Java 17**
- **Spring Boot 3.x**
  - Spring Web
  - Spring Data JPA
  - Spring Boot DevTools
- **MySQL** - Base de datos relacional
- **Maven** - Gestión de dependencias

### Frontend
- **React 18**
- **React Router** - Navegación
- **React Icons** - Iconografía
- **CSS3** - Estilos modernos
- **Fetch API** - Comunicación con backend

## 📦 Módulos

### 1. 📦 Mercadería
Gestión completa del inventario de productos.

**Características:**
- Alta, baja y modificación de productos
- Control de stock con alertas
- Gestión de precios (costo y venta)
- SKU único por producto
- Fechas de vencimiento
- Categorización por material y unidad

**Estadísticas:**
- Total de productos
- Productos activos
- Productos con stock
- Productos sin stock

### 2. 🛒 Ventas
Registro y seguimiento de todas las operaciones de venta.

**Características:**
- Registro de ventas con múltiples productos
- Selección de cliente
- Soporte para 7 medios de pago diferentes
- Cálculo automático de totales
- Estados: Completa / Pendiente / Anulada
- Edición de ventas existentes
- Sistema de anulación con trazabilidad
- Campos de descripción adicional

**Datos capturados:**
- Nombre del cliente
- Productos vendidos con cantidades
- Medio de pago
- Datos completos de cheques (si aplica)
- Descripción de la operación
- Fecha y hora

### 3. 💰 Tesorería
Control de caja y movimientos financieros.

**Características:**
- Registro automático desde ventas
- Registro manual de movimientos
- Clasificación por tipo (Ingreso/Egreso)
- Visualización de cheques con fechas clave
- Alertas de vencimiento de cheques
- Exclusión automática de movimientos anulados en estadísticas
- Sistema de anulación sincronizado con ventas

**Estadísticas:**
- Total de ingresos
- Total de egresos
- Saldo actual
- Total de movimientos

### 4. 👥 Clientes
Base de datos de clientes con información completa.

**Campos:**
- Nombre completo
- Documento
- Teléfono
- Correo electrónico
- Dirección
- Notas adicionales

**Estadísticas:**
- Total de clientes
- Clientes con correo
- Clientes con teléfono
- Clientes con documento

### 5. 🏢 Proveedores
Gestión de proveedores y contactos.

**Características:**
- Información de contacto completa
- Datos fiscales
- Historial de compras
- Notas y observaciones

### 6. 📄 Remitos
Generación de documentación para entregas.

**Características:**
- Numeración automática
- Selección de cliente
- Detalle de productos
- Descarga en PDF
- Edición de remitos existentes

**Estadísticas:**
- Total de remitos
- Remitos este mes
- Remitos con cliente
- Remitos hoy

## 🚀 Instalación

### Prerrequisitos

- Java 17 o superior
- Node.js 16 o superior
- MySQL 8.0 o superior
- Maven 3.8 o superior

### Backend

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/sistema-gestion-comercial.git
cd sistema-gestion-comercial/backend/Sistema-Gestion
```

2. **Configurar base de datos**

Crear la base de datos en MySQL:
```sql
CREATE DATABASE sistema_gestion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Ejecutar migraciones SQL**

Ejecutar los scripts de migración ubicados en el proyecto:
```bash
# Desde MySQL
mysql -u tu_usuario -p sistema_gestion < path/to/migraciones.sql
```

4. **Compilar y ejecutar**
```bash
mvn clean install
mvn spring-boot:run
```

El backend estará disponible en `http://localhost:8080`

### Frontend

1. **Instalar dependencias**
```bash
cd ../../frontend
npm install
```

2. **Ejecutar en modo desarrollo**
```bash
npm start
```

El frontend estará disponible en `http://localhost:3000`

### Build para producción

```bash
npm run build
```


## 🗂️ Estructura del Proyecto

```
sistema-gestion-comercial/
├── backend/
│   └── Sistema-Gestion/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/example/Sistema_Gestion/
│       │   │   │   ├── controller/
│       │   │   │   ├── model/
│       │   │   │   ├── repository/
│       │   │   │   ├── service/
│       │   │   │   └── SistemaGestionApplication.java
│       │   │   └── resources/
│       │   │       └── application.properties
│       │   └── test/
│       └── pom.xml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CamposCheque.jsx
│   │   │   ├── VentaFormModal.js
│   │   │   ├── MovimientoFormModal.js
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Ventaspage.js
│   │   │   ├── Tesoreriapage.js
│   │   │   └── ...
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   ├── package.json
│   └── README.md
└── README.md
```

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la [MIT License](LICENSE).

## 👤 Autoras

**Sofia Gutierrez, Guadalupe Aban, Sonia Guevara, Guadalupe Dominguez y Sofía Gómez**
- Empresa: Leonel Gómez - Agro-Ferretería
- Ubicación: Argentina

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub

*"NUESTRAS PLANTAS NUNCA DUERMEN"* 🌱
