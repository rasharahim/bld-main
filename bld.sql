CREATE DATABASE  IF NOT EXISTS `auth_system` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `auth_system`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: auth_system
-- ------------------------------------------------------
-- Server version	8.0.43

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
-- Table structure for table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `action_type` varchar(10) NOT NULL,
  `action_path` varchar(255) NOT NULL,
  `request_details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_logs`
--

LOCK TABLES `admin_logs` WRITE;
/*!40000 ALTER TABLE `admin_logs` DISABLE KEYS */;
INSERT INTO `admin_logs` VALUES (1,3,'PUT','/admin/donors/1/status','{\"adminId\": 3, \"donorId\": \"1\", \"newStatus\": \"active\", \"oldStatus\": \"pending\", \"timestamp\": \"2025-10-11T02:38:24.308Z\"}','2025-10-11 02:38:24'),(2,3,'PUT','/admin/donors/2/status','{\"adminId\": 3, \"donorId\": \"2\", \"newStatus\": \"active\", \"oldStatus\": \"pending\", \"timestamp\": \"2025-10-11T06:03:35.282Z\"}','2025-10-11 06:03:35'),(3,3,'PUT','/admin/donors/3/status','{\"adminId\": 3, \"donorId\": \"3\", \"newStatus\": \"active\", \"oldStatus\": \"pending\", \"timestamp\": \"2025-10-11T06:08:38.746Z\"}','2025-10-11 06:08:38'),(4,3,'PUT','/admin/donors/4/status','{\"adminId\": 3, \"donorId\": \"4\", \"newStatus\": \"active\", \"oldStatus\": \"pending\", \"timestamp\": \"2025-10-15T18:42:08.034Z\"}','2025-10-15 18:42:08');
/*!40000 ALTER TABLE `admin_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donors`
--

DROP TABLE IF EXISTS `donors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `blood_type` varchar(3) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `contact_number` varchar(15) NOT NULL,
  `availability_time` varchar(100) NOT NULL,
  `health_condition` text,
  `last_donation_date` date DEFAULT NULL,
  `donation_gap_months` int DEFAULT '0',
  `country` varchar(50) NOT NULL,
  `state` varchar(50) NOT NULL,
  `district` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `location_address` text,
  `status` enum('pending','active','inactive','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `donors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donors`
--

LOCK TABLES `donors` WRITE;
/*!40000 ALTER TABLE `donors` DISABLE KEYS */;
INSERT INTO `donors` VALUES (1,1,'Chriss','2005-10-13','B+',53.90,'8893144444','07:31-07:31','None of the Above',NULL,0,'India','Kerala','Ernakulam','Pipeline Road',10.04585458,76.32595916,'Cochin University of Science and Technology (CUSAT), Pipeline Road, Thrikkakkara, Kalamassery - 682021, Kerala, India','active','2025-10-11 02:01:44','2025-10-11 02:38:24'),(2,5,'sruthy','2005-07-13','O+',53.80,'9123455432','11:31-17:31','None of the Above',NULL,0,'India','Kerala','Ernakulam','SOE Central Ave',10.04566899,76.32613382,'Cochin University of Science and Technology (CUSAT), SOE Central Ave, Pathadipalam, Kalamassery - 683503, Kerala, India','active','2025-10-11 06:01:37','2025-10-11 06:03:35'),(3,6,'rana','2004-10-25','B+',56.00,'9876556789','11:37-17:37','None of the Above',NULL,0,'India','Kerala','Ernakulam','Pipeline Road',10.04585915,76.32595285,'Cochin University of Science and Technology (CUSAT), Pipeline Road, Thrikkakkara, Kalamassery - 682021, Kerala, India','active','2025-10-11 06:08:06','2025-10-11 06:08:38'),(4,11,'riya','2004-10-26','B+',54.00,'7788997897','06:09-20:09','None of the Above',NULL,0,'India','Kerala','Ernakulam','Pipeline Road',10.04588600,76.32659500,'Cochin University of Science and Technology (CUSAT), Pipeline Road, Thrikkakkara, Kalamassery - 682021, Kerala, India','active','2025-10-15 18:39:56','2025-10-15 18:42:08');
/*!40000 ALTER TABLE `donors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` varchar(255) NOT NULL,
  `type` enum('request','approval','rejection','reminder','urgent','donor_selected') NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,3,'You have been selected as a donor for a blood request','donor_selected',0,'2025-10-11 06:09:20'),(2,3,'You have been selected as a donor for a blood request','donor_selected',0,'2025-10-11 10:01:57'),(3,1,'You have been selected as a donor for a blood request','donor_selected',0,'2025-10-12 21:15:18'),(4,1,'You have been selected as a donor for a blood request','donor_selected',0,'2025-10-14 06:20:19'),(5,4,'You have been selected as a donor for a blood request','donor_selected',0,'2025-10-15 18:43:23');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receivers`
--

DROP TABLE IF EXISTS `receivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receivers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `age` int DEFAULT NULL,
  `blood_type` varchar(3) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `district` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `location_lat` decimal(10,7) DEFAULT NULL,
  `location_lng` decimal(10,7) DEFAULT NULL,
  `location_address` varchar(255) DEFAULT NULL,
  `reason_for_request` text,
  `prescription_path` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `selected_donor_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `receivers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receivers`
--

LOCK TABLES `receivers` WRITE;
/*!40000 ALTER TABLE `receivers` DISABLE KEYS */;
INSERT INTO `receivers` VALUES (1,1,'chriss',19,'B+','8893144444','India','Kerala','Ernakulam','alakananda',0.0000000,0.0000000,'alakananda','pallu gap','prescription-1760085504901-960889513.png','matched',1,'2025-10-10 08:38:25','2025-10-11 05:19:27'),(2,4,'dools',21,'B+','8765456789','India','Kerala','Ernakulam','alakananda',0.0000000,0.0000000,'alakananda','surgery','prescription-1760162359583-41835577.jpg','completed',3,'2025-10-11 05:59:19','2025-10-11 09:11:27'),(3,7,'haifa',21,'B+','1234567890','India','Kerala','Ernakulam','alkananada',0.0000000,0.0000000,'alkananada','gym','prescription-1760176815504-155931932.png','matched',3,'2025-10-11 10:00:15','2025-10-11 10:01:57'),(4,8,'ridwa',18,'B+','9988998798','India','Kerala','Ernakulam','alakananda',0.0000000,0.0000000,'alakananda','surgery','prescription-1760303636527-468303380.jpg','matched',1,'2025-10-12 21:13:56','2025-10-12 21:15:18'),(5,9,'aadir',20,'B+','9988776989','India','Kerala','Ernakulam','cusat',0.0000000,0.0000000,'cusat','surgery','prescription-1760422673594-901857710.pdf','matched',1,'2025-10-14 06:17:53','2025-10-14 06:20:19'),(6,10,'ann',20,'B+','9988779879','India','Kerala','Ernakulam','cusat',0.0000000,0.0000000,'cusat','surgery','prescription-1760553452391-323653020.png','matched',4,'2025-10-15 18:37:32','2025-10-15 18:43:23');
/*!40000 ALTER TABLE `receivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `dob` date DEFAULT NULL,
  `blood_type` varchar(3) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `location_lat` decimal(10,7) DEFAULT NULL,
  `location_lng` decimal(10,7) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'chriss','8893144444','chriss@gmail.com','$2b$10$p1adICaGjYbF3/RZk8H0.e38feQcOTnCe36jGXX2gAc9DDys2qYcC',0,'2025-10-10 07:50:25','2025-10-11 02:01:44',NULL,'B+',NULL,1,NULL,NULL,NULL),(3,'Admin','9895823557','admin@example.com','$2b$16$.YQi/KwmlENpCd4rUxCeyuhAyotMuBLfm9IcKW6Q/i6OYO2wawf1G',1,'2025-10-11 02:36:44','2025-10-11 02:36:44',NULL,NULL,NULL,1,NULL,NULL,NULL),(4,'dools','8757857865','dools@gmail.com','$2b$10$nrPV86wYtDlLCTTaJkdH/eZ0WmYjXcNHgNFOvvmW3mmO3hvFah5qe',0,'2025-10-11 05:58:00','2025-10-11 05:58:00',NULL,NULL,NULL,1,NULL,NULL,NULL),(5,'sruthy','9123455432','sru@gmail.com','$2b$10$gk5y7VBvOC53c/pEsbYjQuAUHwwBNiKdcEaB1lxUthA2BpBNOUN16',0,'2025-10-11 06:00:38','2025-10-11 06:01:37',NULL,'O+',NULL,1,NULL,NULL,NULL),(6,'rana','9876556789','rana@gmail.com','$2b$10$EjSmuJYzzZds2xOZJnq4AO.KBkIIKfGGlSvrQYRfXNHZrC0A1ene2',0,'2025-10-11 06:04:27','2025-10-11 06:08:06',NULL,'B+',NULL,1,NULL,NULL,NULL),(7,'haifa','1234567890','haif@gmail.com','$2b$10$C7Ib7uGejaqxHsqSNpB51Or/ny.nWm8iBqVHrJsarI6abW2Z1ufxm',0,'2025-10-11 09:59:19','2025-10-11 09:59:19',NULL,NULL,NULL,1,NULL,NULL,NULL),(8,'ridwa','9988779987','ridwa@gmail.com','$2b$10$pfhU5THzCVKDt1RHSw0gp.HGG2AFePf2iaCGpWw2uUWCbezWwkuQ.',0,'2025-10-12 21:12:55','2025-10-12 21:12:55',NULL,NULL,NULL,1,NULL,NULL,NULL),(9,'aadir','9988776698','aadir@gmail.com','$2b$10$1QwebWbT2uHKBTIvd8.6s.O1xSYoEZmXxxbv2mjQMPwWLBXf0XeIW',0,'2025-10-14 06:13:47','2025-10-14 06:13:47',NULL,NULL,NULL,1,NULL,NULL,NULL),(10,'ann','9988779879','ann@gmail.com','$2b$10$f3bLPsloM9PLnzGYp12XHef0TJtpAaMOi31A9ocCuI0d8xSv4Ll3m',0,'2025-10-15 18:36:51','2025-10-15 18:36:51',NULL,NULL,NULL,1,NULL,NULL,NULL),(11,'riya','7788997897','riya@gmail.com','$2b$10$0JvpnWSskpEmxZirj/dZN.5.MpUZ13pddKWCeWcFFAE8BGxsNmU7K',0,'2025-10-15 18:38:42','2025-10-15 18:39:56',NULL,'B+',NULL,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-30 19:39:53
