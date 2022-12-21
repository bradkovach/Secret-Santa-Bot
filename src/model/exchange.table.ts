import { Generated } from 'kysely';
import { DiscordSnowflake } from './participants.table';

export interface DbExchangeRow {
	exchange_id: Generated<bigint>;
	discord_message_id: DiscordSnowflake;
	discord_owner_user_id: DiscordSnowflake;
	started: boolean;
	description: string;
}

export type NewExchangeRow = Omit<DbExchangeRow, 'exchange_id'>;

export type ExchangeRow = NewExchangeRow & { exchange_id: bigint };
