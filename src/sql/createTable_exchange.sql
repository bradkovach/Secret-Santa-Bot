CREATE TABLE IF NOT EXISTS `exchange` (
  `exchangeId` bigint(20) DEFAULT NULL,
  `creatorId` bigint(20) DEFAULT NULL,
  `started` tinyint(4) DEFAULT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci