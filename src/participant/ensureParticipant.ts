import { DatabaseManager } from '../model/database';
import { ParticipantRow } from '../model/participants.table';
import logger from '../utils/logger';
import { createParticipant } from './createParticipant';
import { getParticipant } from './getParticipant';

export async function ensureParticipant(
	exchange_id: bigint,
	discord_user_id: string
): Promise<ParticipantRow> {
	let result = await DatabaseManager.getInstance()
		.selectFrom('participants')
		.select([
			(x) =>
				x.fn.count('participants.participant_id').as('participantCount'),
		])
		.where('exchange_id', '=', exchange_id)
		.where('discord_user_id', '=', discord_user_id)
		.executeTakeFirstOrThrow();

	if (result.participantCount === 0) {
		let created = await createParticipant(exchange_id, discord_user_id);
		logger.info(
			`participant_id ${created.insertId} created for ${discord_user_id} in ${exchange_id} exchange.`
		);
	}

	return getParticipant(exchange_id, discord_user_id);
}
