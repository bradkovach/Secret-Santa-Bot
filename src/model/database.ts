import { DatabaseConnection, Kysely, MysqlDialect } from 'kysely';
import { createPool, PoolOptions } from 'mysql2';
import Pool from 'mysql2/typings/mysql/lib/Pool';
import logger from '../utils/logger';
import { DbBanRow } from './bans.table';
import { DbChannelRow as DbChannelRow } from './channels.table';
import { DbExchangeRow } from './exchange.table';
import { DbMatchRow } from './matches.table';
import { DbMessagesRow } from './messages.table';
import { DbParticipantRow } from './participants.table';
import { DbShipmentRow } from './shipments.table';

export interface SecretSantaSchema {
	matches: DbMatchRow;
	participants: DbParticipantRow;
	exchanges: DbExchangeRow;
	bans: DbBanRow;
	channels: DbChannelRow;
	shipments: DbShipmentRow;
	messages: DbMessagesRow;
}

export const getDb = (poolOptions: PoolOptions) =>
	new Kysely<SecretSantaSchema>({
		log(event): void {
			// if (event.level === 'query') {
			//   console.log(event.query.sql)
			//   console.log(event.query.parameters)
			// }
		},
		dialect: new MysqlDialect({
			async onCreateConnection(connection: DatabaseConnection) {
				logger.info('Database connected');
			},
			pool: createPool(poolOptions),
		}),
	});

export class DatabaseManager {
	private static _instance: Kysely<SecretSantaSchema>;

	public static getInstance() {
		if (!DatabaseManager._instance) {
			let connectionString = new URL(
				'mysql://root:123456@localhost:3307/secret_santa'
			);

			const poolOptions: PoolOptions = {
				host: connectionString.hostname || 'localhost',
				port: connectionString.port
					? parseInt(connectionString.port)
					: 3306,
				user: connectionString.username,
				password: connectionString.password,
				database: connectionString.pathname.slice(1),
				timezone: 'UTC',
				typeCast(field, next) {
					if(field.type === 'TINY' && field.length === 1){
						return field.string() === '1'
					} else {
						return next();
					}
				},
				
			};

			// console.log({ connectionString, poolOptions});

			DatabaseManager._instance = getDb(poolOptions);
		}
		return DatabaseManager._instance;
	}
}
