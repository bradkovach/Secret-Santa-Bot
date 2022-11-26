import {
	Client,
	Collection,
	Message,
	MessageEmbed,
	MessageReaction,
	PartialUser,
	User,
	Permissions,
} from 'discord.js';
import fs from 'fs';
import { handleCmd } from './commandhandler';
import config from './config.json';
import { query } from './mysql';
import { BanRow } from './rows/BanRow';
import { ExchangeRow } from './rows/ExchangeRow';
import { UserRow } from './rows/UserRow';
import { Methods } from './utils/methods';
import { sets } from './utils/sets';

import path from 'path';

const client = new Client({
	messageCacheMaxSize: 50,
	messageCacheLifetime: 300,
	messageSweepInterval: 500,
	disableMentions: 'everyone',
	partials: ['MESSAGE', 'REACTION', 'GUILD_MEMBER', 'USER'],
});

client.sets = sets;
client.commands = new Collection();
client.commandsUsed = 0;
client.fullLockdown = true; // Will be disabled after bot starts up.

const commandFiles = fs
	.readdirSync('./dist/commands')
	.filter((filename: string) => filename.endsWith('.js'));

for (const file of commandFiles) {
	const filepath = path.resolve(process.cwd(), 'dist', 'commands', file);
	const command = require(filepath).default;
	console.log(`+ ${command.name}`);
	client.commands.set(command.name, command);
}

client.on('message', (message: Message) => {
	if (message.author.bot) {
		return;
	} else if (client.fullLockdown) {
		return console.log('[APP] Ignored message.');
	} else if (client.sets.bannedUsers.has(message.author.id)) {
		return;
	}

	if( message.channel.type === 'dm') {
		messageLogger.info(`${logUser(message.author)}: \`${message.content}\``)
	}

	if (!message.content.toLowerCase().startsWith(config.prefix)) {
		return;
	} else {
		if (message.channel.type === 'dm') {
			handleCmd(message, config.prefix);
		} else {
			handleCmd(message, config.prefix);
		}
	}
});

client.on('error', (err: any) => {
	console.log(err);
});

client.on('disconnect', (err: any) => {
	console.log(err);
	client.destroy();
	//.then(k=>client.login(config.botToken));
	process.exit();
});

client.on('debug', (message: any) => {
	if (config.debug) {
		console.debug(message);
	}
});

client.on('reconnecting', () => {
	console.log('[APP] Bot reconnecting...');
});

client.on('ready', async () => {
	client.user!.setActivity(config.prefix + 'help', { type: 'PLAYING' });

	const permissions = [
		Permissions.FLAGS.VIEW_CHANNEL,
		Permissions.FLAGS.SEND_MESSAGES,
		Permissions.FLAGS.MANAGE_MESSAGES,
		Permissions.FLAGS.EMBED_LINKS,
		Permissions.FLAGS.ATTACH_FILES,
		Permissions.FLAGS.MENTION_EVERYONE,
		Permissions.FLAGS.ADD_REACTIONS,
	];
	//
	const qs: Record<string, string> = {
		client_id: config.applicationId,
		permissions: permissions
			.reduce((all, perm) => all + perm, 0)
			.toString(),
		scope: ['bot', 'applications.commands'].join(' '),
	};
	const banner = 'Discord Bot Authorization URL';
	const authLink = `https://discord.com/api/oauth2/authorize?${Object.keys(
		qs
	)
		.map(
			(key) => `${encodeURIComponent(key)}=${encodeURIComponent(qs[key])}`
		)
		.join('&')}`;

	console.log('-'.repeat(authLink.length));
	console.log(banner);
	console.log(authLink);
	console.log('-'.repeat(authLink.length));

	const bannedRows = await query<BanRow[]>(`SELECT * FROM banned`); // refreshes the list of banned users on startup
	bannedRows.forEach((bannedId) => {
		if (bannedId.userId !== undefined && bannedId.userId !== null) {
			client.sets.bannedUsers.add(bannedId.userId.toString());
		}
	});

	console.log(`[APP] Bot is ready`);
	client.fullLockdown = false;
});

import wishlistCommand from './commands/setwishlist';
import addressCommand from './commands/address';
import leaveCommand from './commands/leave';
import logger, { messageLogger } from './utils/logger';
import { logUser, logUser as u } from './utils/discord';

client.on(
	'messageReactionAdd',
	async (reaction: MessageReaction, user: User | PartialUser) => {
		if (reaction.emoji.name !== '🎅') {
			return;
		}

		const exchangeId = reaction.message.id;
		const exchange = (
			await query<ExchangeRow[]>(
				`SELECT * FROM exchange WHERE exchangeId = ${exchangeId}`
			)
		)[0];

		// no exchange associated with message
		if (!exchange) {
			return;
		}
		// exchange already started
		else if (exchange.started === 1) {
			return user.send(
				`This Secret Santa exchange has already started and we are no longer taking new signups!  Thank you for your interest. Keep an eye out for our next gift exchange.`
			);
		}

		let row = (
			await query<UserRow[]>(`SELECT * FROM users WHERE userId = ?`, [
				user.id,
			])
		)[0];

		if (!row) {
			let methods = new Methods();
			await methods.createNewUser(user.id);
			row = (
				await query<UserRow[]>(`SELECT * FROM users WHERE userId = ?`, [
					user.id,
				])
			)[0];
		}

		if (row.exchangeId === 0) {
			await query(`UPDATE users SET exchangeId = ? WHERE userId = ?`, [
				exchangeId,
				user.id,
			]);

			const creator = await reaction.message.client.users.fetch(
				exchange.creatorId.toString()
			);
			const admins = await Promise.all(
				config.adminUsers.map((admin) => client.users.fetch(admin))
			).then((users) => users.map((user) => user.toString()).join(', '));

			let messageSections = {
				[`**Welcome to ${creator.toString()}'s Secret Santa Exchange**`]: [
					'I will let you know when names are drawn!',
					'Before names are drawn, you need to set your profile and your address.',
					'If you do not set your profile and address, you will not be selected for the exchange.',
					// 'Names should be drawn by 2021-11-30 at 9:00 PM EST.',
				],
				'**1. Create Your Profile**': [
					`Before we can match you to another participant, you need to submit your profile.`,
					`Your profile will be provided to your Secret Santa so they can send you a gift you'll like.`,
					`**To set your profile, reply to me...**\n\`${config.prefix}${wishlistCommand.name} <profile about you>\``,
				],
				'*For example, to set your profile, you could reply...*': [
					[
						'```',
						[
							`${config.prefix}${wishlistCommand.name}`,
							`I really like motorcycles, techno, and cooking.`,
							`My favorite TV Show is Breaking Bad.`,
							`My favorite food is Coconut Curry.`,
							`I have one dog, named Ratchet, and one cat, named Clank.`,
							`I like tinkering with electronics.`,
						].join(' '),
						'```',
					].join('\n'),
				],
				'**2. Set Your Address**': [
					`You need to provide a shipping address to participate in Secret Santa.`,
					'If you provide your physical address, your Santa will see the complete address.',
					'Use a work address or a PO Box if you do not want your real address to be shared.',
					`Please make sure your address contains your country.`,
					`Due to pandemic embargoes, some countries are not accepting mail from other countries.`,
					`**To set your address, reply to me...**\n\`${config.prefix}${addressCommand.name} <your address>\``,
				],
				'*For example, to set your address, you could reply...*': [
					[
						'```',
						`${config.prefix}${addressCommand.name} ${user.username}; 1600 Pennsylvania Avenue, N.W; Washington, DC 20500; USA`,
						'```',
					].join('\n'),
				],
				'**Leaving/Quitting The Exchange**': [
					`If you are unable to participate in the exchange, you can leave any time before names are matched by replying here with \`${config.prefix}${leaveCommand.name}\`.`,
					`If you need to leave the Secret Santa exchange *after* names are drawn, please contact one of the admins listed here: ${admins}`,
				],
			};

			let messageString = Object.keys(messageSections)
				.map((title, idx, sections) => {
					let strings = messageSections[title];
					return `${title}\n${strings.join(' ').trim()}`;
				})
				.join('\n\n');

			const recipient = await client.users.fetch(user.id);

			recipient
				.send({ content: messageString })
				.then((message) =>
					logger.info(
						`[app] welcome message ${message.id} sent to ${u(recipient)} `
					)
				)
				.catch((uhoh) => {
					query<never>(`DELETE * FROM users WHERE userId = ?`, [
						recipient.id,
					]);
					logger.error(
						`[app] unable to send welcome message to ${recipient.toString()}; removing from exchange`,
						{ uhoh }
					);
				});
		}
	}
);

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

client.login(config.botToken);
