import mysql from 'mysql2';

import { config } from 'dotenv';

export interface SecretSantaConfig {
	MYSQLDB_USER: string;
	MYSQLDB_ROOT_PASSWORD: string;
	MYSQLDB_DATABASE: string;
	MYSQLDB_LOCAL_PORT: string;
	MYSQLDB_DOCKER_PORT: string;
	MYSQLDB_HOST: string;
}

const resolvedConfig = config().parsed as unknown as SecretSantaConfig;

export class Database {
	private static instance: Database;

	private constructor() {}

	public static getInstance(): Database {
		if (!Database.instance) {
			Database.instance = new Database();
		}
		return Database.instance;
	}

	public async with<T>(callback: (connection: mysql.Connection) => any) {
		return new Promise((resolve, reject) => {
			const db = mysql.createConnection({
				host: resolvedConfig.MYSQLDB_HOST,
				user: resolvedConfig.MYSQLDB_USER,
				password: resolvedConfig.MYSQLDB_ROOT_PASSWORD,
				database: resolvedConfig.MYSQLDB_DATABASE,
				port: parseInt(resolvedConfig.MYSQLDB_LOCAL_PORT, 10),
				supportBigNumbers: true,
				bigNumberStrings: false,
				charset: 'utf8mb4',
			});

			db.on('connect', async () => {
				let result = await callback(db);
				db.end();
				resolve(result);
			});

			db.on('error', async (err: any) => {
				console.error(err);
				reject(err);
				if (db) {
					if (db.end) {
						db.end();
					}
				}
			});
		});
	}
}
