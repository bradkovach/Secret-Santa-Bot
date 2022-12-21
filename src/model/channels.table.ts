import { Generated } from 'kysely';
import { DiscordSnowflake } from './participants.table';

export type ChannelRole = 'santa' | 'giftee' | 'participant' | 'category';

export interface DbChannelRow {
	channel_id: Generated<bigint>;
	participant_id: bigint;
	role: ChannelRole;
	discord_channel_id: DiscordSnowflake;
}

export type NewChannelRow = Omit<DbChannelRow, 'channel_id'>;

export type ChannelRow = NewChannelRow & { channel_id: bigint };
