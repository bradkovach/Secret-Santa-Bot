import { InsertResult } from 'kysely';
import { DatabaseManager } from '../model/database';
import { NewParticipantRow } from '../model/participants.table';

export async function createParticipant(
	exchange_id: bigint,
	discord_user_id: string
): Promise<InsertResult> {
	return await DatabaseManager.getInstance()
		.insertInto('participants')
		.values({
			discord_user_id,
			exchange_id,
			address: '',
			iso_country_code: 'USA',
			// received: false,
			standardized_address: '',
			// tracking_number: '',
			wishlist: '',
			// giftee_participant_id: null,
		} as NewParticipantRow)
		.executeTakeFirstOrThrow();
}
