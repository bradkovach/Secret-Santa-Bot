import { Guild } from 'discord.js';
import { Participant } from '../model/Participant';
import { DatabaseManager } from '../model/database';
import logger from '../utils/logger';
import { Exchange } from '../model/Exchange';
import { Channel } from '../model/Channel';

// type WrappedOrUnwrapped<T> = Promise<T> | T;

//let serial = function<

// var serial = function <
// 	ItemType,
// 	A extends any,
// 	B extends any,
// 	ResultType extends Promise<A>,
// 	FinalType extends Promise<B>
// 	// ResultType extends PromiseLike<any> = PromiseLike<void>,
// 	// FinalType extends PromiseLike<any> = PromiseLike<void>
// >(
// 	items: ItemType[],
// 	asyncEach: (item: ItemType) => ResultType,
// 	thenEach: (result: A) => FinalType
// ): Promise<any> {
// 	return items.reduce((p, item) => {
// 		return p.then(() => {
// 			return asyncEach(item).then(thenEach);
// 		});
// 	}, Promise.resolve()); // initial
// };

/**
 * Cancels an exchange and cleans up the discord
 * @param exchange an exchange to cancel
 */
export const cancelExchange = (
	guild: Guild,
	exchange: Exchange<false>
): Promise<boolean> => {
	// get all channels associated w exchange

	let participants: Participant[];
	// let channels: Channel[];

	return exchange
		.getParticipants()
		.then((participants) => {
			logger.info(`cancelExchange: got participants`);
			participants = participants;
			return Promise.all(
				participants.map((participant) => participant.getChannels())
			).then((clumped) => clumped.flatMap((c) => c));
		})
		.then((channelRows) => {
			logger.info(
				`[cancelExchange] got ${channelRows.length} channels from db`
			);
			// serial(
			// 	channelRows,
			// 	(row) => Promise.resolve(row.channel_id),
			// 	(asyncResult) => asyncResult
			// ).then();
			channelRows.forEach((r) =>
				logger.warn(
					`[cancelExchange] Discord Channel to be deleted: ${r.discord_channel_id}`
				)
			);
			// serial(channelRows, (row)=> guild.channels.delete(row.), (deleted)=>{})
			return Promise.all(
				channelRows.map((channel) => {
					return guild.channels.delete(
						channel.discord_channel_id,
						'Secret Santa exchange cancelled.'
					);
				})
			)
				.then((deletedDiscordChannels) => {
					logger.info(
						`[cancelExchange] Successfully deleted discord channels`
					);
					return DatabaseManager.getInstance()
						.deleteFrom('exchanges')
						.where('exchange_id', '=', exchange.exchange_id)
						.execute();
				})
				.then((dbDeleteSuccess) => {
					logger.info(
						`Exchange ${exchange.exchange_id} deleted. Had ${participants.length} participants and ${channelRows.length} channels`
					);
					return true;
				});
		})
		.catch((err) => {
			console.log(err);
			logger.error(
				`Unable to cancel exchange, ${exchange.exchange_id}.`,
				err
			);
			return false;
		});
};
