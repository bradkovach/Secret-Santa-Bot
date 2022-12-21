import { Generated } from 'kysely';

export type DiscordSnowflake = string;

export interface DbParticipantRow {
	participant_id: Generated<bigint>;
	exchange_id: bigint;
	discord_user_id: DiscordSnowflake;
	wishlist: string;
	address: string;
	iso_country_code: string;
	//giftee_participant_id: bigint | null;
	//received: boolean;
	//standardized_address: string;
	//tracking_number: string;
}

export type NewParticipantRow = Omit<DbParticipantRow, 'participant_id'>;

export type ParticipantRow = NewParticipantRow & {
	participant_id: bigint;
};
