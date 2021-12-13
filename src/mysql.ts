// import * as mysql from 'mysql';
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

export const db = mysql.createConnection({
	host: resolvedConfig.MYSQLDB_HOST,
	user: resolvedConfig.MYSQLDB_USER,
	password: resolvedConfig.MYSQLDB_ROOT_PASSWORD,
	database: resolvedConfig.MYSQLDB_DATABASE,
	port: parseInt(resolvedConfig.MYSQLDB_LOCAL_PORT, 10),
	supportBigNumbers: true,
	bigNumberStrings: false,
	charset: 'utf8mb4',
});


import sqlQueries from './sql/createTables';

export const createUsersSQL = sqlQueries.tables.users;

export const createExchangeSQL = sqlQueries.tables.exchange;

export const createBannedSQL = sqlQueries.tables.banned

db.connect((err: any) => {
	if (err)
		return console.log(
			'[MYSQL] Could not connect to SQL database: ' +
				err +
				'\n\n\nYou probably need to create the secret_santa database, open "MYSQL Command Line Client" using windows search and run: CREATE DATABASE IF NOT EXISTS secret_santa;\n\n\n'
		);

	console.log('[MYSQL] MySQL Connected.');

	// Create banned users table
	db!.query(createBannedSQL, (err: any, result: any) => {
		if (err) return console.log(err);
	});

	// Create exchange table
	db!.query(createExchangeSQL, (err: any, result: any) => {
		if (err) return console.log(err);
	});

	// Create users table
	db!.query(createUsersSQL, (err: any, result) => {
		if (err) return console.log(err);
	});
});

db.on('error', (err: { fatal: any }) => {
	if (err.fatal) {
		console.log('[MYSQL] Fatal SQL error, attempting to reconnect.');
		db!.end();
		// connectSQL();
		return;
	}
});

export function query<RowType>(sql: any, args?: any): Promise<RowType> {
	return new Promise((resolve, reject) => {
		db!.query(sql, args, (err: any, rows: unknown) => {
			if (err) return reject(err);

			resolve(rows as RowType);
		});
	});
}
