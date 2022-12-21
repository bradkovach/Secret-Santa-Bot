import { DatabaseManager } from './model/database';

import {
	Client,
	Collection,
	GatewayIntentBits,
	GuildMember,
	MessageReaction,
	PartialGuildMember,
	PartialMessageReaction,
	Partials,
	PartialUser,
	User,
} from 'discord.js';
import fs from 'fs';
// import { query } from './mysql';

import { escapeRegExp } from './utils/escapeRegExp';
import { reconnecting } from './events/reconnecting';
import { ICommand } from './ICommand';

import path from 'path';
import { messageCreate } from './events/messageCreate';
import { ready } from './events/ready';
import { IConfig } from './IConfig';
import { messageReactionAdd } from './events/messageReactionAdd';
import { joinEmoji } from './commands/create';
import logger from './utils/logger';
import { typingStart } from './events/typingStart';
import { NoResultError } from 'kysely';

export const IFS = '\\s+';
export const ifsRegExp = new RegExp(IFS);

export const resolvedConfig = require('./config.json') as IConfig;

export const kdb = DatabaseManager.getInstance();

export const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
	],
	partials: [
		Partials.Message,
		Partials.Reaction,
		Partials.Channel,
		Partials.GuildMember,
		Partials.User,
	],
	// messageCacheMaxSize: 50,
	// messageCacheLifetime: 300,
	// messageSweepInterval: 500,
	// disableMentions: 'everyone',
});

export const commands = new Collection<string, ICommand>();

export const appDir = path.resolve(process.cwd(), 'dist');
export const commandsDir = path.resolve(appDir, 'commands');
export const eventsDir = path.resolve(appDir, 'events');

logger.info(`[app] Initializing secret santa bot in ${appDir}...`)


const commandFiles = fs
	.readdirSync(commandsDir)
	.filter((filename: string) => filename.endsWith('.js'));

logger.info(`Loading commands from ${commandsDir}...`);

for (const file of commandFiles) {
	const filepath = path.resolve(commandsDir, file);
	const command = require(filepath).default as ICommand;

	logger.info(`+ '${command.name}' command`);
	logger.verbose(`   - allow bot admin: ${command.allowAdmin}`);
	logger.verbose(`   - allow exchange owner: ${command.allowOwner}`);
	logger.verbose(
		`   - restricted to channel roles: ${command.respondInChannelTypes.join(
			', '
		)}`
	);
	commands.set(command.name.toLowerCase(), command);
}

logger.info(`Loading event handlers from ${eventsDir}...`);

const eventFiles = fs
	.readdirSync(eventsDir)
	.filter((filename: string) => filename.endsWith('.js'));

for (const eventFilename of eventFiles) {
	const eventFilePath = path.resolve(eventsDir, eventFilename);
	const eventName = eventFilename.replace('.js', '');
	const eventHandler = require(eventFilePath).default as Function;

	logger.info(`+ ${eventName}`);

	// typescript for client.on(eventName, event)
	//(client.on as any)(eventName, eventHandler);
}
const commandRegExpStr = [
	'^',
	[
		`(${resolvedConfig.names.join('|')})${resolvedConfig.prefix}`,
		[
			`(${commands
				.map((command) => command.name)
				.map(escapeRegExp)
				.join('|')})`,
			`([\\s\\S]*)`,
		].join('\\s*'),
	].join(IFS),
	'$',
].join('');

export const commandRegExp = new RegExp(commandRegExpStr, 'im');

// logger.info(commandRegExp);

client
	.on('debug', (msg) => {
		// logger.info(msg);
	})
	.on(
		'guildMemberUpdate',
		async (
			oldMemberPartial: PartialGuildMember | GuildMember,
			newMemberPartial: PartialGuildMember | GuildMember
		) => {
			// logger.info(`guildMemberUpdate`)
			// const oldMember = await oldMemberPartial.fetch();
			// const newMember = await newMemberPartial.fetch();
			// const channels = await oldMember.guild.channels.fetch();
			// logger.info('display name has changed', ` ${oldMember.nickname} => ${newMember.nickname}`);
			// if (oldMember.nickname !== newMember.nickname) {
			// 	return channels
			// 		.filter((c) =>
			// 			c?.name.startsWith(
			// 				`${joinEmoji}-${oldMember.nickname.toLowerCase()}`
			// 			)
			// 		)
			// 		.forEach(async (c) => {
			// 			if (c && c.name) {
			// 				await c.setName(
			// 					c.name.replace(
			// 						oldMember.nickname.toLowerCase(),
			// 						newMember.nickname
			// 					)
			// 				);
			// 			}
			// 		});
			// }
		}
	)
	.on('typingStart', typingStart)
	.on('messageCreate', messageCreate)
	.on('error', (err: any) => {
		logger.error(`DISCORD ERROR: ${err.toString()}`);
	})
	.on('disconnect', (err: any) => {
		logger.info(err);
		client.destroy();
		process.exit();
	})
	.on('reconnecting', reconnecting)
	.on('ready', ready)
	.on('messageReactionAdd', messageReactionAdd)
	.login(resolvedConfig.botToken);

const oldMessageReactionAdd = async (
	reaction: MessageReaction | PartialMessageReaction,
	user: User | PartialUser
) => {
	/*
	if (reaction.emoji.name !== '🎅') {
		return;
	}
	
	const exchangeId = reaction.message.id;
	const exchange = (
		await query<ExchangeRow[]>(
			`SELECT * FROM exchange WHERE exchangeId = ${exchangeId}`
			)
			)[0];
			
			*/
	// no exchange associated with message
	// if (!exchange) {
	// 	return;
	// }
	// // exchange already started
	// else if (exchange.started === 1) {
	// 	return user.send(
	// 		`This Secret Santa exchange has already started and we are no longer taking new signups!  Thank you for your interest. Keep an eye out for our next gift exchange.`
	// 	);
	// }
	// let row = (
	// 	await query<UserRow[]>(`SELECT * FROM users WHERE userId = ?`, [
	// 		user.id,
	// 	])
	// )[0];
	// if (!row) {
	// 	let methods = new Methods();
	// 	await methods.createNewUser(user.id);
	// 	row = (
	// 		await query<UserRow[]>(`SELECT * FROM users WHERE userId = ?`, [
	// 			user.id,
	// 		])
	// 	)[0];
	// }
	// if (row.exchangeId === 0) {
	// 	await query(`UPDATE users SET exchangeId = ? WHERE userId = ?`, [
	// 		exchangeId,
	// 		user.id,
	// 	]);
	// 	const owner = await reaction.message.client.users.fetch(
	// 		exchange.creatorId.toString()
	// 	);
	// 	const admins = await Promise.all(
	// 		resolvedConfig.adminUsers.map((admin) => client.users.fetch(admin))
	// 	).then((users) => users.map((user) => user.toString()).join(', '));
	// 	let messageSections = {
	// 		[`**Welcome to ${owner.toString()}'s Secret Santa Exchange**`]: [
	// 			'I will let you know when names are drawn!',
	// 			'Before names are drawn, you need to set your profile and your address.',
	// 			'If you do not set your profile and address, you will not be selected for the exchange.',
	// 			// 'Names should be drawn by 2021-11-30 at 9:00 PM EST.',
	// 		],
	// 		'**1. Create Your Profile**': [
	// 			`Before we can match you to another participant, you need to submit your profile.`,
	// 			`Your profile will be provided to your Secret Santa so they can send you a gift you'll like.`,
	// 			`**To set your profile, reply to me...**\n\`${firstBotName()}${
	// 				resolvedConfig.prefix
	// 			} ${wishlistCommand.name} A little about me...\``,
	// 		],
	// 		'*For example, to set your profile, you could reply...*': [
	// 			[
	// 				'```',
	// 				[
	// 					`${firstBotName()}${resolvedConfig.prefix} ${
	// 						wishlistCommand.name
	// 					}`,
	// 					`I really like motorcycles, techno, and cooking.`,
	// 					`My favorite TV Show is Breaking Bad.`,
	// 					`My favorite food is Coconut Curry.`,
	// 					`I have one dog, named Ratchet, and one cat, named Clank.`,
	// 					`I like tinkering with electronics.`,
	// 				].join(' '),
	// 				'```',
	// 			].join('\n'),
	// 		],
	// 		'**2. Set Your Address**': [
	// 			`You need to provide a shipping address to participate in Secret Santa.`,
	// 			'If you provide your physical address, your Santa will see the complete address.',
	// 			'Use a work address or a PO Box if you do not want your real address to be shared.',
	// 			`Please make sure your address contains your country.`,
	// 			`Due to pandemic embargoes, some countries are not accepting mail from other countries.`,
	// 			`**To set your address, reply to me...**\n\`${firstBotName()}${
	// 				resolvedConfig.prefix
	// 			} ${addressCommand.name} <your address>\``,
	// 		],
	// 		'*For example, to set your address, you could reply...*': [
	// 			[
	// 				'```',
	// 				`${firstBotName()}${resolvedConfig.prefix} ${
	// 					addressCommand.name
	// 				} ${
	// 					user.username
	// 				}; 1600 Pennsylvania Avenue, N.W; Washington, DC 20500; USA`,
	// 				'```',
	// 			].join('\n'),
	// 		],
	// 		'**Leaving/Quitting The Exchange**': [
	// 			`If you are unable to participate in the exchange, you can leave any time before names are matched by replying here with \`${firstBotName()}${
	// 				resolvedConfig.prefix
	// 			} ${leaveCommand.name}\`.`,
	// 			`If you need to leave the Secret Santa exchange *after* names are drawn, please contact one of the admins listed here: ${admins}`,
	// 		],
	// 	};
	// 	let messageString = Object.keys(messageSections)
	// 		.map((title, idx, sections) => {
	// 			let strings = messageSections[title];
	// 			return `${title}\n${strings.join(' ').trim()}`;
	// 		})
	// 		.join('\n\n');
	// 	const recipient = await client.users.fetch(user.id);
	// 	const dmChannel = await (recipient.dmChannel
	// 		? Promise.resolve(recipient.dmChannel)
	// 		: recipient.createDM());
	// 	dmChannel
	// 		.send({ content: messageString })
	// 		.then((message) =>
	// 			logger.info(
	// 				`[app] welcome message ${message.id} sent to ${u(recipient)} `
	// 			)
	// 		)
	// 		.catch((uhoh) => {
	// 			query<never>(`DELETE * FROM users WHERE userId = ?`, [
	// 				recipient.id,
	// 			]);
	// 			logger.error(
	// 				`[app] unable to send welcome message to ${recipient.toString()}; removing from exchange`,
	// 				{ uhoh }
	// 			);
	// 		});
	// }
};

process.on('unhandledRejection', (reason, p) => {
	console.error(
		'[APP][' +
			new Date().toLocaleString(undefined, {
				timeZone: 'America/New_York',
			}) +
			'] Unhandled Rejection: ',
		reason
	);
});
