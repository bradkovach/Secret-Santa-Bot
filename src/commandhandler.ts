import {
	Channel,
	Guild,
	GuildChannel,
	Message,
	TextChannel,
} from 'discord.js';
import { getOtherChannel } from './getOtherChannel';
import { IConfig } from './IConfig';
import { DatabaseManager } from './model/database';
import { DiscordSnowflake } from './model/participants.table';

export const config = require('./config.json') as IConfig;

export const isAdmin = (userId: string): Promise<boolean> => {
	console.log(userId, ' in ', config.adminUsers);
	return new Promise((resolve, reject) => {
		if (config.adminUsers.indexOf(userId) > -1) {
			resolve(true);
		} else {
			reject('not a bot admin');
		}
	});
};

export const isOwner = (
	discord_user_id: string,
	exchange_id: bigint
): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		DatabaseManager.getInstance()
			.selectFrom('exchanges')
			.where('discord_owner_user_id', '=', discord_user_id)
			.where('exchange_id', '=', exchange_id)
			.selectAll()
			.executeTakeFirstOrThrow()
			.then((row) => {
				resolve(true);
			})
			.catch((reason) => {
				reject(reason);
			});
	});
};

export const msgToMsgCache = new Map<DiscordSnowflake, Message>();

// export const getTargetDiscordMessageFromDb = (
// 	guild: Guild,
// 	incomingMessage: Message,
// ): Promise<Message> => {
// 	const incomingDiscordChannel = incomingMessage.channel as TextChannel;
// 	const channelRow = getOtherChannel(incomingDiscordChannel.id)

// 	DatabaseManager.getInstance()
// 		.selectFrom('messages')
// 		.where('source_discord_message_id', '=', incomingMessage.id)
// 		.selectAll()
// 		.executeTakeFirstOrThrow()
// 		.then((row) => guild.channels.cache.get(channelRow.discord_channel_id)));
// };
