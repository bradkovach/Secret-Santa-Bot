import { Message, NewsChannel, TextChannel, User } from 'discord.js';
import { DatabaseManager } from '../model/database';
import { ExchangeRow } from '../model/exchange.table';
import logger from '../utils/logger';
import { isExchangeOwner } from './isExchangeOwner';

export async function cancelExchange(
	exchange: ExchangeRow,
	user: User,
	message: Message<boolean>,
	channel: TextChannel | NewsChannel
) {
	const isOwner = await isExchangeOwner(exchange.exchange_id, user.id);

	if (!isOwner) {
		return;
	}

	DatabaseManager.getInstance()
		.selectFrom('exchanges')
		.innerJoin(
			'participants',
			'exchanges.exchange_id',
			'participants.exchange_id'
		)
		.innerJoin(
			'channels',
			'participants.participant_id',
			'channels.participant_id'
		)
		.select('channels.discord_channel_id')
		.where('exchanges.exchange_id', '=', exchange.exchange_id)
		.execute()
		.then((rows) => {
			return rows.forEach(async (row) => {
				logger.info(`deleting discord channel ${row.discord_channel_id}`);
				await channel.guild.channels.delete(
					row.discord_channel_id,
					'gift exchange cancelled!'
				);
			});
		})
		.then((channelsDeleted) => {
			return DatabaseManager.getInstance()
				.deleteFrom('exchanges')
				.where('discord_message_id', '=', message.id)
				.execute();
		})
		.then((exchangeDeleted) => {
			message.reply(`This exchange has been cancelled.`);
		});
}
