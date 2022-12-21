import {} from 'kysely';
import { DiscordSnowflake } from './participants.table';

export interface DbBanRow {
	discord_user_id: DiscordSnowflake;
	reason: string;
	date: number;
}
