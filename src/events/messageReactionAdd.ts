import {
	MessageReaction,
	PartialMessageReaction,
	PartialUser,
	User,
} from 'discord.js';
import { client, kdb } from '../app';
import { cancelEmoji, joinEmoji, startEmoji } from '../commands/create';
import { joinExchange } from '../exchange/joinExchange';
import { printMessageContext } from '../exchange/printMessage';
import { startExchange } from '../exchange/startExchange';
import { ExchangeRow } from '../model/exchange.table';
import logger from '../utils/logger';
import { msgToMsgCache } from '../commandhandler';
import cancelReactionHandler from '../reactions/cancel';
import flagReactionHandler from '../reactions/flag';
import purgeReactionHandler from '../reactions/purge';
import { Exchange } from '../model/Exchange';
import { Channel } from '../model/Channel';

const reactionHandlers = [
	flagReactionHandler,
	cancelReactionHandler,
	purgeReactionHandler,
];

export async function messageReactionAdd(
	partialReaction: PartialMessageReaction | MessageReaction,
	partialUser: PartialUser | User
): Promise<any> {
	if (partialUser.bot) {
		return;
	}

	const reaction = await partialReaction.fetch();
	const user = await partialUser.fetch();
	const message = await reaction.message.fetch();

	if (!reaction.client.isReady()) {
		return;
	}

	if (user.id === reaction.client.user.id) {
		// bot should ignore itself
		return;
	}

	if (msgToMsgCache.has(message.id)) {
		const otherMessage = msgToMsgCache.get(message.id);
		otherMessage!.react(reaction.emoji.toString());
	}

	if (message.author.id !== client.user!.id) {
		// only respond to reactions on bot messages
		return;
	}

	if (!message.member) {
		// if this isn't a guild reaction, return
		// ignores DMs
		return;
	}

	const reactionHandler = reactionHandlers.find((handler) => {
		logger.verbose(
			`Testing ${reaction.emoji.toString()} with ${handler.name} handler.`
		);
		if (handler.test) {
			logger.verbose(`   ... using test function`);
			return handler.test(reaction);
		} else if (handler.emoji) {
			logger.verbose(`   ... using emoji array`);
			return handler.emoji.indexOf(reaction.emoji.toString()) > -1;
		}
		return false;
	});

	const rex = await Exchange.fromDiscordMessageId(
		reaction.message.id
	).catch((e) => undefined);

	const rch = await Channel.fromDiscordChannelId(
		reaction.message.channelId
	).catch((e) => undefined);

	if (reactionHandler) {
		logger.info(
			`Will handle ${reaction.emoji.toString()} with ${
				reactionHandler.name
			} handler.`
		);

		return reactionHandler.execute(reaction, user, rex, rch);
	}

	logger.info(
		[
			printMessageContext(message),
			`Bot message received reaction, ${reaction.emoji.toString()}.`,
		].join(' ')
	);

	if (
		[startEmoji, cancelEmoji, joinEmoji].indexOf(
			reaction.emoji.toString()
		) === -1
	) {
		return;
	}

	const exchange = await kdb
		.selectFrom('exchanges')
		.where('exchanges.discord_message_id', '=', message.id)
		.where('exchanges.started', '=', false)
		.selectAll()
		.executeTakeFirst();

	if (!exchange) {
		logger.info(`unable to find unstarted exchange by message id`);
		return;
	}

	const channel = await message.channel.fetch();

	if (
		!channel.isTextBased() ||
		channel.isDMBased() ||
		channel.isVoiceBased() ||
		channel.isThread()
	) {
		return;
	}

	if (reaction.emoji.name === startEmoji) {
		logger.info('calling startExchange');
		startExchange(exchange as ExchangeRow, user, message, channel);
	} else if (reaction.emoji.name === cancelEmoji) {
		logger.info('calling cancelExchange');
		//cancelExchange(exchange as Exchange, user, message, channel);
	} else if (reaction.emoji.name === joinEmoji) {
		logger.info('calling joinExchange');
		joinExchange(exchange as ExchangeRow, message, user);
	}
}
