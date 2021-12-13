import { Database } from '../Database';
import path from 'path';
import { writeFile, writeFileSync } from 'fs';

const database = Database.getInstance();

type CreateTableResult = CreateTableDefinition[];
interface CreateTableDefinition {
	Table: string;
	'Create Table': string;
}

database.with(async (conn) => {
	const pQuery = (query: string, args: any[]) =>
		new Promise((resolve, reject) => {
			conn.query(query, args, (error, result) => {
				if (error) return reject(error);
				else return resolve(result);
			});
		});
	const userCreateStatement = (await pQuery(
		'SHOW CREATE TABLE `users`',
		[]
	)) as unknown as CreateTableResult;
	const bannedCreateStatement = (await pQuery(
		'SHOW CREATE TABLE `banned`',
		[]
	)) as unknown as CreateTableResult;
	const exchangeCreateStatement = (await pQuery(
		'SHOW CREATE TABLE `exchange`',
		[]
	)) as unknown as CreateTableResult;

	const resultObj = [
		userCreateStatement,
		bannedCreateStatement,
		exchangeCreateStatement,
	].reduce(
		(object, result) => {
			const table = result[0].Table,
				statement = result[0]['Create Table'].replace(
					'CREATE TABLE `',
					'CREATE TABLE IF NOT EXISTS `'
				);

			object.tables[table] = statement;

			return object;
		},
		{ tables: <Record<string, string>>{} }
	);

	const exportString = [
		"import { ISqlQueries } from './ISqlQueries';",
		'',
		`const queries: ISqlQueries = ${JSON.stringify(
			resultObj,
			null,
			'\t'
		)};`,
		'',
		`export default queries;`,
	].join('\n');
	const filepath = path.resolve(
		process.argv[1],
		'..',
		'..',
		'..',
		'src',
		'sql',
		`createTables.ts`
	);
	writeFileSync(filepath, exportString, 'utf8');
});
