const config = require('../config.json');
import { ICommand } from '../ICommand';
import { logUser as u } from '../utils/discord';
import logger from '../utils/logger';

import { EmbedBuilder, Guild, Message } from 'discord.js';
import { DatabaseManager } from '../model/database';

export const crossEmoji: string = '❌';
export const bombEmoji: string = '💣';
export const fireworkEmoji: string = '🧨';
export const collisionEmoji: string = '💥';
export const broomEmoji: string = '🧹';
export const trashEmoji: string = '🗑️';

export const joinEmoji: string = '🎅';
export const startEmoji: string = '✅';
export const sentEmoji: string = '📤';
export const receivedEmoji: string = '📥';

export const cancelSequence: [string, string] = [crossEmoji, bombEmoji];
export const purgeSequence: [string, string] = [bombEmoji, collisionEmoji];
export const resetSequence: [string, string] = [broomEmoji, trashEmoji];

export const cancelEmoji: string = cancelSequence[0];
export const purgeEmoji: string = purgeSequence[0];
export const resetEmoji: string = resetSequence[0];
// ca

const command: ICommand = {
	name: 'create',
	description: 'Creates a new secret santa for everyone to join.',
	usage: 'create',

	allowParticipant: false,
	requiresShipped: false,

	allowOwner: false,
	allowAdmin: false,
	showInHelp: false,
	respondInChannelTypes: [],

	async execute(guild: Guild, message: Message, info, subcommand: string) {
		const db = DatabaseManager.getInstance();

		if (!message.member) {
			return;
		}

		const embeds = [
			new EmbedBuilder()
				.setTitle(
					`__${message.member.displayName} started a new Secret Santa!__`
				)
				.setDescription('React with 🎅 to join the exchange!')
				.setFooter({
					text: [
						`${message.member.displayName}, start the exchange with ${startEmoji}.`,
						`Or, cancel the exchange with ${cancelEmoji}.`,
					].join(' '),
				})
				.setColor(config.embeds_color).data,
		];

		const botMessage = await message.channel.send({ embeds });

		try {
			await db
				.insertInto('exchanges')
				.values({
					description: subcommand,
					discord_message_id: botMessage.id,
					discord_owner_user_id: message.author.id,
					started: false,
				})
				// .returningAll()
				.executeTakeFirstOrThrow()
				.then(() => botMessage.react(joinEmoji))
				.then(() => botMessage.react(startEmoji))
				.then(() => botMessage.react(cancelEmoji));
			logger.info(
				`Created new Secret Santa exchange, started by ${u(
					message.author
				)} with message ${botMessage.id}.`
			);
		} catch (err) {
			logger.error(`A big problem occurred creating an exchange! ${err}`);
		}
	},
} as ICommand;

export default command;
