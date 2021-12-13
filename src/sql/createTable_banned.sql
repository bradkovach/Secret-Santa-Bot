CREATE TABLE IF NOT EXISTS `banned` (
  `userId` bigint(20) DEFAULT NULL,
  `reason` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci