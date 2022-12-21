import { Message } from 'discord.js';
import { commandRegExp, commands } from '../app';
import { getChannel } from '../channel/getChannel';
import {
	isAdmin as resolveIsAdmin,
	isOwner as resolveIsOwner,
} from '../commandhandler';
import { forwardMessage } from '../forwardMessage';

import {
	printMember,
	printMessageContext,
} from '../exchange/printMessage';

import { ChannelRow } from '../model/channels.table';
import { DatabaseManager } from '../model/database';
import { ExchangeRow } from '../model/exchange.table';
import { ParticipantRow } from '../model/participants.table';

import { flagReactionHandler } from '../reactions/flag';

import { countryFromEmoji, isFlagEmoji } from '../utils/countries';
import logger, {
	logParticipantUpdate,
	messageLogger,
} from '../utils/logger';

// console.log({ commandRegExpStr, commandRegExp });
export async function messageCreate(message: Message) {
	if (message.author.bot) {
		return;
	}

	if (!message.member) {
		// logger.debug('message was not from a guild');
		return;
	}

	if (!message.channel) {
		// logger.debug('message was not in a channel');
		return;
	}

	const knownChannel = await getChannel(message.channel.id);

	const parsed = message.content.match(commandRegExp);

	if (!parsed) {
		logger.verbose(
			[
				printMessageContext(message),
				`Message did not seem to be a command.`,
			].join(' ')
		);
	}

	if (knownChannel) {
		logger.verbose(
			`Received message from known channel, ${knownChannel.role}`
		);
		const guild = await message.guild!.fetch();

		const participantInfo = (await DatabaseManager.getInstance()
			.selectFrom('participants')
			.innerJoin(
				'channels',
				'participants.participant_id',
				'channels.participant_id'
			)
			.innerJoin(
				'exchanges',
				'participants.exchange_id',
				'exchanges.exchange_id'
			)
			.where('channels.discord_channel_id', '=', message.channel.id)
			.selectAll()
			.executeTakeFirst()) as ChannelRow & ParticipantRow & ExchangeRow;

		if (isFlagEmoji(message.content.trim())) {
			const country = countryFromEmoji(message.content.trim());
			if (!country) {
				return;
			}
			return DatabaseManager.getInstance()
				.updateTable('participants')
				.set({
					iso_country_code: country.threeAlpha,
				})
				.where('participant_id', '=', knownChannel.participant_id)
				.execute()
				.then((updateResult) => {
					return message.reactions.removeAll();
				})
				.then((cleared) => {
					logParticipantUpdate(message.member!, participantInfo, {
						iso_country_code: country.threeAlpha,
					});
					logger.info(
						`Updated ${message.author.username} country to ${country.threeAlpha}`
					);
					return message.react(message.content.trim());
				});
		} else if (knownChannel.role === 'santa') {
			forwardMessage(guild, message);
			//forwardToGiftee(guild, message, participantInfo);
		} else if (knownChannel.role === 'giftee') {
			forwardMessage(guild, message);
			//forwardToSanta(guild, message, participantInfo);
		} else {
			if (!parsed) {
				return;
			}

			const [match, addressedAs, commandName, subcommand] = parsed;
			const command = commands.get(commandName.toLowerCase());

			if (!command) {
				logger.error(`Unable to find command for '${commandName}'`);
				return;
			}

			if (command.allowAdmin) {
				logger.verbose(`Attempting to dispatch an admin-only command!`);
				return resolveIsAdmin(message.author.id)
					.then((isAdmin: boolean) => {
						return command.execute(
							guild,
							message,
							subcommand,
							participantInfo
						);
					})
					.catch((isNotAdmin: any) => {
						logger.warn(`Error: ${JSON.stringify(isNotAdmin)}`);
					});
			}

			if (command.allowOwner) {
				logger.verbose(
					`Attempting to dispatch an owner command for ${participantInfo.exchange_id}`
				);
				return resolveIsOwner(
					message.author.id,
					participantInfo.exchange_id
				)
					.then((isOwner) => {
						logger.warn(
							`Dispatching owner command for ${printMember(
								message.member!
							)}`
						);
						return command.execute(
							guild,
							message,
							subcommand,
							participantInfo
						);
					})
					.catch((isNotOwner) => {
						logger.warn(
							`Ignoring ${printMember(
								message.member!
							)} attempt to use command '${match}'`
						);
					});
			}

			if (
				command.respondInChannelTypes.length === 0 || // no roles required
				command.respondInChannelTypes.indexOf(knownChannel.role) > -1 // has the role required
			) {
				try {
					return command.execute(
						guild,
						message,
						subcommand,
						participantInfo
					);
				} catch (error) {
					logger.error(`Command execution failure! '${match}'`, error);
				}
			} else {
				return message
					.reply(`You cannot use that command in this channel.`)
					.then((replyMessage) => {
						messageLogger.info([printMessageContext(replyMessage)]);
						const helpCommand = commands.get('help');
						if (helpCommand) {
							return helpCommand.execute(
								guild,
								replyMessage,
								'',
								participantInfo
							);
						}
					});
			}
		}
	} else if (parsed) {
		const [match, addressedAs, commandStr, subcommand] = parsed;
		logger.verbose(`Parsed command: '${match}'`);
		const command = commands.get(commandStr.toLowerCase());
		const guild = await message.guild!.fetch();

		if (!command) {
			return;
		}

		if (command.protectInvocation === true) {
			let content = message.content;
			return message.delete().then((deleted) => {
				logger.warn(
					`Command '${command.name}' invoked outside participant channel`
				);
			});
		}

		if (command.respondInChannelTypes.length === 0) {
			try {
				return command.execute(guild, message, subcommand, null);
			} catch (error) {
				logger.warn(
					`Problem executing command ${command.name} outside of known channel.`
				);
			}
		}
	}

	return;
}
