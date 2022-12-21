import { DatabaseManager } from '../model/database';
import { ParticipantRow } from '../model/participants.table';

export async function getParticipant(
	exchange_id: bigint,
	discord_user_id: string
): Promise<ParticipantRow> {
	return (await DatabaseManager.getInstance()
		.selectFrom('participants')
		.where('exchange_id', '=', exchange_id)
		.where('discord_user_id', '=', discord_user_id)
		.selectAll()
		.executeTakeFirstOrThrow()) as ParticipantRow;
}
