import { DatabaseManager } from '../model/database';

export async function isExchangeOwner(
	exchange_id: bigint,
	discord_user_id: string
): Promise<boolean> {
	try {
		await DatabaseManager.getInstance()
			.selectFrom('exchanges')
			.where('exchange_id', '=', exchange_id)
			.where('discord_owner_user_id', '=', discord_user_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		return true;
	} catch (error) {
		return false;
	}
}
