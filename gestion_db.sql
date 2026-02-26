CREATE DATABASE  IF NOT EXISTS `gestion_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `gestion_db`;
-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: gestion_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `archivo`
--

DROP TABLE IF EXISTS `archivo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archivo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `entidad` varchar(255) DEFAULT NULL,
  `entidad_id` bigint DEFAULT NULL,
  `mime` varchar(255) DEFAULT NULL,
  `nombre_original` varchar(255) DEFAULT NULL,
  `ruta` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archivo`
--

LOCK TABLES `archivo` WRITE;
/*!40000 ALTER TABLE `archivo` DISABLE KEYS */;
/*!40000 ALTER TABLE `archivo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `documento` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `notas` text,
  `telefono` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
INSERT INTO `cliente` VALUES (2,'2025-12-10 15:26:43.304473','LA CARRERA','','','Villalba Javier','Productor de papas ','2622654640','2026-01-29 02:43:15.920807'),(5,'2026-01-29 02:37:48.820685','CALLE LA GLORIA S/N EL PERAL','','','Condori Ariel','','','2026-01-29 02:40:15.899017'),(6,'2026-01-29 02:42:03.421700','Liniers s/n','','','Campañaro Fernando Carlos','','','2026-01-29 02:42:32.839066');
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compra`
--

DROP TABLE IF EXISTS `compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compra` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `anotaciones` text,
  `created_at` datetime(6) DEFAULT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `fecha` datetime(6) DEFAULT NULL,
  `numero` bigint NOT NULL,
  `total` decimal(14,2) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `proveedor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK884qoorvlfgnehbuom36n7cmd` (`numero`),
  KEY `FK5rv6m306dgdn4cn14eyhpexwu` (`proveedor_id`),
  CONSTRAINT `FK5rv6m306dgdn4cn14eyhpexwu` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedor` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compra`
--

LOCK TABLES `compra` WRITE;
/*!40000 ALTER TABLE `compra` DISABLE KEYS */;
/*!40000 ALTER TABLE `compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compra_item`
--

DROP TABLE IF EXISTS `compra_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compra_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(14,2) NOT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `compra_id` bigint NOT NULL,
  `producto_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKl7w5476vcnmuwxfalmb2srk4` (`compra_id`),
  KEY `FK3ibo2pb0h39cv2ccn9l3pm34n` (`producto_id`),
  CONSTRAINT `FK3ibo2pb0h39cv2ccn9l3pm34n` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`),
  CONSTRAINT `FKl7w5476vcnmuwxfalmb2srk4` FOREIGN KEY (`compra_id`) REFERENCES `compra` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compra_item`
--

LOCK TABLES `compra_item` WRITE;
/*!40000 ALTER TABLE `compra_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `compra_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_tesoreria`
--

DROP TABLE IF EXISTS `movimiento_tesoreria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_tesoreria` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `descripcion` text,
  `fecha` datetime(6) NOT NULL,
  `importe` decimal(10,2) NOT NULL,
  `medio_pago` varchar(255) NOT NULL,
  `referencia` varchar(255) DEFAULT NULL,
  `tipo` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `banco` varchar(100) DEFAULT NULL,
  `numero_cheque` varchar(50) DEFAULT NULL,
  `librador` varchar(100) DEFAULT NULL,
  `fecha_emision` date DEFAULT NULL,
  `fecha_cobro` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `tipo_cheque` varchar(50) DEFAULT NULL,
  `anulado` tinyint(1) NOT NULL DEFAULT '0',
  `venta_id` bigint DEFAULT NULL,
  `cobrado` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_movimiento_venta_id` (`venta_id`),
  KEY `idx_movimiento_anulado` (`anulado`),
  KEY `idx_movimiento_cobrado` (`cobrado`),
  KEY `idx_movimiento_cobrado_tipo` (`cobrado`,`tipo`),
  CONSTRAINT `fk_movimiento_venta` FOREIGN KEY (`venta_id`) REFERENCES `venta` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_tesoreria`
--

LOCK TABLES `movimiento_tesoreria` WRITE;
/*!40000 ALTER TABLE `movimiento_tesoreria` DISABLE KEYS */;
INSERT INTO `movimiento_tesoreria` VALUES (6,'2026-01-04 00:25:07.454253','Ingreso por venta de productos','2026-01-04 00:25:07.454253',545000.00,'CHEQUE','Venta #1','INGRESO','2026-01-06 16:14:25.945589','Banco Nacion','00000174','Condori Ariel Enrique','2025-11-19','2025-12-19','2026-01-18','FISICO',0,5,1),(7,'2026-01-04 00:29:04.594156','Ingreso por venta de productos','2026-01-04 00:29:04.594156',190000.00,'EFECTIVO','Venta #2','INGRESO','2026-01-04 00:29:04.594156',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,6,1),(8,'2026-01-27 22:12:59.747130','Ingreso por venta de productos','2026-01-27 22:12:59.747130',7500.00,'EFECTIVO','Venta #3','INGRESO','2026-01-27 22:12:59.747130',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,1);
/*!40000 ALTER TABLE `movimiento_tesoreria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `precio_historico`
--

DROP TABLE IF EXISTS `precio_historico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `precio_historico` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fecha` datetime(6) NOT NULL,
  `fuente` varchar(150) DEFAULT NULL,
  `precio` decimal(38,2) NOT NULL,
  `producto_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKb5i44frgtgaupdbk3apx55c08` (`producto_id`),
  CONSTRAINT `FKb5i44frgtgaupdbk3apx55c08` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `precio_historico`
--

LOCK TABLES `precio_historico` WRITE;
/*!40000 ALTER TABLE `precio_historico` DISABLE KEYS */;
/*!40000 ALTER TABLE `precio_historico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto`
--

DROP TABLE IF EXISTS `producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `descripcion` text,
  `eliminado` bit(1) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `precio_costo` decimal(14,2) DEFAULT NULL,
  `precio_venta` decimal(14,2) DEFAULT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `unidad_medida` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKclpng6f2m2r9i1y5g2yxajyuq` (`sku`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto`
--

LOCK TABLES `producto` WRITE;
/*!40000 ALTER TABLE `producto` DISABLE KEYS */;
INSERT INTO `producto` VALUES (1,_binary '','2025-12-03 22:32:25.120921','FOLIAR CON MACRO , MICRO NUTRIENTES + HORMONAS + AMINOACIDOS (NANO PARTICULAS)\nAKO AGRO',_binary '\0','NANOCOVER PLUS X 1 LT.',0.00,7500.00,'FAKO10001',69,'BOTELLA ','2026-01-07 15:03:03.508482','2026-02-22'),(4,_binary '','2025-12-10 15:21:40.769874','12 VOLT - 110 AMP MARCA RB',_binary '\0','Batería 12 VOLT - 110 AMP',120000.00,190000.00,'EBAT00001',3,'','2026-01-06 15:03:01.401546',NULL),(5,_binary '','2026-01-05 22:30:54.408914','FOLIAR MACRO, MICRO NUTRIENTES + HORMONAS + AMINOACIDOS + COBALTO Y MOLIBDENO\nAKO AGRO',_binary '\0','NANOCOVER MAX x 1 LT.',0.00,0.00,'FAKO10003',35,'BOTELLA ','2026-01-07 15:03:14.469252',NULL),(6,_binary '','2026-01-06 14:46:43.408451','FOLIAR MAGNESIO AKO AGRO',_binary '\0','NUTRIPLUS Mg X 5 LT.',0.00,0.00,'FAKO0003',29,'BIDON','2026-01-06 15:02:31.117329',NULL),(7,_binary '','2026-01-06 14:48:10.831231','FOLIAR POTASIO AKO AGRO\nMejora el desarrollo de los frutos, \ntamaño y firmeza',_binary '\0','AKO POTASIO PLUS X 5 LT.',9.00,0.00,'FAKO010001',12,'BIDON','2026-01-06 15:03:43.626847',NULL),(8,_binary '','2026-01-06 14:49:14.293274','FOLIAR MACRO, MICRO NUTRIENTES + HORMONAS + AMINOACIDOS + COBALTO Y MOLIBDENO\nAKO AGRO',_binary '\0','NANOCOVER MAX  X 10 LT.',0.00,0.00,'FAKO10004',7,'VEJIGA X 10 LT.','2026-01-06 15:05:14.695721',NULL),(9,_binary '','2026-01-06 14:55:19.392114','FUNGUICIDA CARBENDAZIN 50% MARCA FITOQUIMICA',_binary '\0','FUN.CURA 50 X 20 LT.',0.00,0.00,'AFITO010005',5,'BIDON','2026-01-06 15:02:49.615932',NULL),(11,_binary '',NULL,'QUELATO DE ZINCA\nBio estimulante de uso terápico \ncomo foliar',NULL,'NUTRIPLUS ZINC X1 LT.',15.50,0.00,'FAKO0006',24,'BOTELLA ',NULL,NULL),(12,_binary '',NULL,'HORMIGUICIDA',NULL,'FIPROL 20 X 1 LT.',0.00,0.00,'AFIT080001',24,'BOTELLA ',NULL,NULL),(13,_binary '',NULL,'BAYER',NULL,'MOVENTO OD X 1 LT.',0.00,0.00,'AFIT080002',8,'BOTELLA ',NULL,NULL),(14,_binary '',NULL,'METOXIFENOCIDE 24%',NULL,'INS. VEST X 5 LT.',0.00,0.00,'AFIT080003',1,'BIDON',NULL,NULL),(15,_binary '',NULL,'LAMDACIOLATRINA 25%',NULL,'LAMDACIOLATRINA  SIGMA X 1 LT.',0.00,0.00,'AFIT080004',3,'BOTELLA ',NULL,NULL),(16,_binary '',NULL,'COBRE PENTA HIDRATADO AKO AGRO',NULL,'COBRE PLUS X 5 LT.',0.00,0.00,'FAKO010007',12,'BIDON',NULL,NULL),(18,_binary '',NULL,'MANGANESO - COBRE AKO AGRO',NULL,'FOSFITO PLUS Mn-Cu X 1 LT.',0.00,0.00,'FAKO010008',12,'BOTELLA ',NULL,NULL),(19,_binary '',NULL,'CORRECTOR DE PH/ADHESIVO MULTI SILICONADO (AKO AGRO)',NULL,'ADH. ECO POTENT PLUS X 1 LT.',0.00,0.00,'FAKO20001',12,'BOTELLA ',NULL,NULL),(20,_binary '',NULL,'Coadyuvante Dispersante \nSiliconado.',NULL,'PARTNER MAX X1 LT.',11.00,0.00,'FAKO20002',12,'BOTELLA ',NULL,NULL),(21,_binary '',NULL,'Coadyuvante Anti Deriva \nSiliconado.',NULL,'ECO TWISTER PLUS X1 LT.',25.20,0.00,'FAKO20003',12,'BOTELLA ',NULL,NULL),(22,_binary '',NULL,'Agente Compatibilizador de \ncaldos.',NULL,'AKO OPTIMUM X5 LT.',16.50,0.00,'FAKO20004',3,'BIDON',NULL,NULL),(23,_binary '',NULL,'Corrector de deficiencias \nnutricionales.',NULL,'MAGNESIO PLUS X5 LT.',13.00,0.00,'FAKO0008',12,'BIDON',NULL,NULL),(27,_binary '',NULL,'Bio estimulante de uso terápico \ncomo foliar',NULL,'NUTRI PLUS ZINC X10 LT.',0.00,0.00,'FAKO0007',4,'VEJIGA X 10 LT.',NULL,NULL),(28,_binary '',NULL,'Bio Estimulante para uso en Estadios \nde Floración y Fructificación',NULL,'NUTRIPLUS CAB X1 LT.',16.80,0.00,'FAKO0001',24,'BOTELLA ',NULL,NULL),(29,_binary '',NULL,'Bio Estimulante para uso en Estadios \nde Floración y Fructificación.',NULL,'NUTRIPLUS CAB X10 LT.',0.00,0.00,'FAKO0002',4,'VEJIGA X 10 LT.',NULL,NULL),(30,_binary '',NULL,'',NULL,'NANOCOVER MIX X1 LT.',0.00,0.00,'FAKO10005',24,'BOTELLA ',NULL,NULL),(31,_binary '',NULL,'',NULL,'NANOCOVER MIX X10 LT.',0.00,0.00,'FAKO10006',4,'VEJIGA X 10 LT.',NULL,NULL),(33,_binary '',NULL,'',NULL,'NANOCOVER PLUS X10 LT.',0.00,0.00,'FAKO10002',3,'VEJIGA',NULL,NULL);
/*!40000 ALTER TABLE `producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedor`
--

DROP TABLE IF EXISTS `proveedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedor` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `condicion_iva` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `cuit` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `notas` text,
  `telefono` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedor`
--

LOCK TABLES `proveedor` WRITE;
/*!40000 ALTER TABLE `proveedor` DISABLE KEYS */;
INSERT INTO `proveedor` VALUES (1,'Monotributista','2026-01-29 02:05:07.090366','','','','AKO AGRO','','','2026-01-29 02:05:07.090366');
/*!40000 ALTER TABLE `proveedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `remito`
--

DROP TABLE IF EXISTS `remito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `remito` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cliente_aclaracion` varchar(255) DEFAULT NULL,
  `cliente_codigo_postal` varchar(255) DEFAULT NULL,
  `cliente_direccion` varchar(255) DEFAULT NULL,
  `cliente_nombre` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `numero` bigint NOT NULL,
  `observaciones` text,
  `updated_at` datetime(6) DEFAULT NULL,
  `proveedor_id` bigint DEFAULT NULL,
  `cliente_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK4tu91rbr31uts6o4yc1me5t8h` (`numero`),
  KEY `fk_remito_cliente` (`cliente_id`),
  CONSTRAINT `fk_remito_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `remito`
--

LOCK TABLES `remito` WRITE;
/*!40000 ALTER TABLE `remito` DISABLE KEYS */;
INSERT INTO `remito` VALUES (4,'CONSUMIDOR_FINAL','5561','LA CARRERA','Villalba Javier',NULL,NULL,1,'Bateria 12 VOLY-110 AMP MARCA RB \nPAGO CON CHEQUE VALOR $ 550.000 RESTANDO LAS BATERIAS LE QUEDA SALDO A FAVOR DE $ 170.000','2026-01-06 15:11:58.296777',NULL,NULL),(5,'RESPONSABLE_INSCRIPTO','5561','Liniers s/n','Campañaro Fernando Carlos',NULL,NULL,2,'Cuenta corriente','2026-01-05 22:34:11.378640',NULL,NULL),(6,'RESPONSABLE_INSCRIPTO','5561','CALLE LA GLORIA S/N EL PERAL','CONDORI ARIEL','2026-01-06 15:10:25.751565','2026-01-06',3,'CUENTA CORRIENTE ','2026-01-06 15:10:25.751565',NULL,NULL),(7,'RESPONSABLE_INSCRIPTO','5561','CALLE LA GLORIA S/N EL PERAL','CONDORI ARIEL',NULL,'2026-01-20',4,'REMITO FISICO Nº 17 CUENTA CORRIENTE','2026-01-09 02:49:26.600256',NULL,NULL),(8,'RESPONSABLE_INSCRIPTO','5561','CALLE LA GLORIA S/N EL PERAL','Condori Ariel',NULL,'2026-01-29',5,'Cuenta Corriente','2026-01-29 02:41:29.170957',1,5);
/*!40000 ALTER TABLE `remito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `remito_item`
--

DROP TABLE IF EXISTS `remito_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `remito_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cantidad` decimal(18,4) NOT NULL,
  `notas` text,
  `producto_id` bigint NOT NULL,
  `remito_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKlcm1aowno9e8cgwqjwhpsjdhw` (`producto_id`),
  KEY `FKjm6r7y3a5ypit7hfaak62thpg` (`remito_id`),
  CONSTRAINT `FKjm6r7y3a5ypit7hfaak62thpg` FOREIGN KEY (`remito_id`) REFERENCES `remito` (`id`),
  CONSTRAINT `FKlcm1aowno9e8cgwqjwhpsjdhw` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `remito_item`
--

LOCK TABLES `remito_item` WRITE;
/*!40000 ALTER TABLE `remito_item` DISABLE KEYS */;
INSERT INTO `remito_item` VALUES (9,1.0000,'Bot x 1Lt.',5,5),(11,19.0000,'',7,6),(12,15.0000,'',6,6),(13,2.0000,'',8,6),(14,2.0000,'',9,6),(15,2.0000,'',4,4),(38,1.0000,'',11,7),(39,2.0000,'',12,7),(42,10.0000,'',5,8);
/*!40000 ALTER TABLE `remito_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venta`
--

DROP TABLE IF EXISTS `venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venta` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `fecha` datetime(6) DEFAULT NULL,
  `medio_pago` varchar(255) DEFAULT NULL,
  `numero_interno` bigint NOT NULL,
  `total` decimal(14,2) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `cliente_id` bigint DEFAULT NULL,
  `cheque_banco` varchar(100) DEFAULT NULL,
  `cheque_numero` varchar(50) DEFAULT NULL,
  `cheque_librador` varchar(200) DEFAULT NULL,
  `cheque_fecha_emision` date DEFAULT NULL,
  `cheque_fecha_cobro` date DEFAULT NULL,
  `cheque_fecha_vencimiento` date DEFAULT NULL,
  `nombre_cliente` varchar(200) DEFAULT NULL,
  `descripcion` text,
  `anulada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKciscpejssy10tkr2ibg1p03hp` (`numero_interno`),
  KEY `FKa7yaj59nfh3gft0h38o5bv472` (`cliente_id`),
  KEY `idx_venta_cheque_numero` (`cheque_numero`),
  KEY `idx_venta_nombre_cliente` (`nombre_cliente`),
  KEY `idx_venta_anulada` (`anulada`),
  CONSTRAINT `FKa7yaj59nfh3gft0h38o5bv472` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta`
--

LOCK TABLES `venta` WRITE;
/*!40000 ALTER TABLE `venta` DISABLE KEYS */;
INSERT INTO `venta` VALUES (5,'2026-01-04 00:25:07.429685','COMPLETA','2026-01-04 00:25:07.429685','CHEQUE',1,545000.00,'2026-01-04 00:38:49.754705',NULL,'Banco Nacion','00000174','Condori Ariel Enrique','2025-11-19','2025-12-19','2026-01-18','Condori Ariel Enrique',NULL,0),(6,'2026-01-04 00:29:04.588152','COMPLETA','2026-01-04 00:29:04.588152','EFECTIVO',2,190000.00,'2026-01-04 00:29:04.588152',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Villalba Javier','12vol',0);
/*!40000 ALTER TABLE `venta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venta_item`
--

DROP TABLE IF EXISTS `venta_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venta_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(14,2) NOT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `producto_id` bigint NOT NULL,
  `venta_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKo3nvrjwr0010ketyo6fe2r0yr` (`producto_id`),
  KEY `FKc9b05e27moa53hgdltgxxnbyv` (`venta_id`),
  CONSTRAINT `FKc9b05e27moa53hgdltgxxnbyv` FOREIGN KEY (`venta_id`) REFERENCES `venta` (`id`),
  CONSTRAINT `FKo3nvrjwr0010ketyo6fe2r0yr` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta_item`
--

LOCK TABLES `venta_item` WRITE;
/*!40000 ALTER TABLE `venta_item` DISABLE KEYS */;
INSERT INTO `venta_item` VALUES (15,1,190000.00,190000.00,4,6),(20,2,190000.00,380000.00,4,5),(21,22,7500.00,165000.00,1,5);
/*!40000 ALTER TABLE `venta_item` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-30 22:07:13
