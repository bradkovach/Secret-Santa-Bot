
const config = require('./config.json');

import * as mysql from 'mysql'

export const db: mysql.Connection = mysql.createConnection({
	host: config.sqlhostname,
	user: config.sqluser,
	password: config.sqlpass,
	database: config.sqldatabase,
	port: config.sqlport,
	supportBigNumbers: true,
	bigNumberStrings: false,
	charset: 'utf8mb4',
});


db.connect((err: any) => {
	if (err)
		return console.log(
			'[MYSQL] Could not connect to SQL database: ' +
				err +
				'\n\n\nYou probably need to create the secret_santa database, open "MYSQL Command Line Client" using windows search and run: CREATE DATABASE IF NOT EXISTS secret_santa;\n\n\n'
		);

	console.log('[MYSQL] MySQL Connected.');

	// Create banned users table
	db!.query(
		'CREATE TABLE IF NOT EXISTS banned (userId bigint, reason VARCHAR(2048), date bigint) ENGINE = InnoDB',
		(err: any, result: any) => {
			if (err) return console.log(err);
		}
	);

	// Create exchange table
	db!.query(createExchangeSQL, (err: any, result: any) => {
		if (err) return console.log(err);
	});

	// Create users table
	db!.query(createUsersSQL, (err: any, result) => {
		if (err) return console.log(err);
	});
});

db.on('error', (err: { fatal: any; }) => {
	if (err.fatal) {
		console.log('[MYSQL] Fatal SQL error, attempting to reconnect.');
		db!.end();
		// connectSQL();
		return;
	}
});

const createUsersSQL = `
CREATE TABLE IF NOT EXISTS users (
    userId BIGINT,
    exchangeId BIGINT,
    wishlist VARCHAR(1000),
    partnerId BIGINT)
    ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci
`;

const createExchangeSQL = `
CREATE TABLE IF NOT EXISTS exchange (
    exchangeId BIGINT,
    creatorId BIGINT,
    started TINYINT,
    description VARCHAR(1000))
    ENGINE = InnoDB
`;

export function query<RowType>(sql: any, args?: any): Promise<RowType> {
	return new Promise((resolve, reject) => {
		db!.query(sql, args, (err: any, rows: unknown) => {
			if (err) return reject(err);
			
			resolve(rows as RowType);
		});
	});
}