import { ISqlQueries } from './ISqlQueries';

const queries: ISqlQueries = {
	tables: {
		users:
			"CREATE TABLE IF NOT EXISTS `users` (\n  `userId` bigint(20) NOT NULL,\n  `exchangeId` bigint(20) NOT NULL,\n  `wishlist` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,\n  `address` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',\n  `iso_country_code` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',\n  `standardized_address` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',\n  `partnerId` bigint(20) DEFAULT NULL,\n  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',\n  `received` tinyint(1) NOT NULL DEFAULT '0',\n  PRIMARY KEY (`userId`,`exchangeId`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
		banned:
			'CREATE TABLE IF NOT EXISTS `banned` (\n  `userId` bigint(20) DEFAULT NULL,\n  `reason` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,\n  `date` bigint(20) DEFAULT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
		exchange:
			'CREATE TABLE IF NOT EXISTS `exchange` (\n  `exchangeId` bigint(20) DEFAULT NULL,\n  `creatorId` bigint(20) DEFAULT NULL,\n  `started` tinyint(4) DEFAULT NULL,\n  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
	},
};

export default queries;
