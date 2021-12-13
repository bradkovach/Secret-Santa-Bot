CREATE TABLE IF NOT EXISTS `users` (
  `userId` bigint(20) NOT NULL,
  `exchangeId` bigint(20) NOT NULL,
  `wishlist` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `iso_country_code` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `standardized_address` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `partnerId` bigint(20) DEFAULT NULL,
  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `received` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`,`exchangeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci