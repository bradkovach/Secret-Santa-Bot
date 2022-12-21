import { DatabaseManager } from '../model/database';

const kdb = DatabaseManager.getInstance();

export async function addNewExchange(messageId: string, ownerId: string) {
	return await kdb
		.insertInto('exchanges')
		.values({
			discord_message_id: messageId,
			discord_owner_user_id: ownerId,
			started: false,
			description: '',
		})
		.execute();
	// await query(
	// 	`INSERT IGNORE INTO exchange (
	//     exchangeId,
	//     creatorId,
	//     started,
	//     description) VALUES (
	//         ?, ?, 0,''
	//     )
	// `,
	// 	[exchangeId, creatorId]
	// );
}
