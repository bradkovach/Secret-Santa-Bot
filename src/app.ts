import { Client, Collection, Message, MessageEmbed } from "discord.js";
import fs from 'fs';
import { handleCmd } from "./commandhandler";
import config from './config.json';
import { query } from "./mysql";
import { BanRow } from "./rows/BanRow";
import { ExchangeRow } from "./rows/ExchangeRow";
import { UserRow } from "./rows/UserRow";
import { Methods } from "./utils/methods";
import {sets} from './utils/sets';

import path from 'path';

const client = new Client({
	messageCacheMaxSize: 50,
	messageCacheLifetime: 300,
	messageSweepInterval: 500,
	disableMentions: 'everyone',
	partials: ['MESSAGE', 'REACTION', 'GUILD_MEMBER', 'USER'],
});

client.sets = sets
client.commands = new Collection();
client.commandsUsed = 0;
client.fullLockdown = true; // Will be disabled after bot starts up.

const commandFiles = fs
	.readdirSync('./dist/commands')
	.filter((filename: string) => filename.endsWith('.js'));
const adminCommands = fs
	.readdirSync('./dist/commands/admin')
	.filter((filename: string) => filename.endsWith('.js'));

for (const file of adminCommands) {
	commandFiles.push(`admin/${file}`);
}
for (const file of commandFiles) {
	const filepath = path.resolve(process.cwd(), 'dist', 'commands', file);
	console.log({filepath});
	const command = require(filepath).default;
	console.log({command})
	client.commands.set(command.name, command);
}

client.on('message', (message: Message) => {
	console.log('got message', message.content);
	if (message.author.bot) return;
	else if (client.fullLockdown) return console.log('[APP] Ignored message.');
	else if (client.sets.bannedUsers.has(message.author.id)) return;
	else if (!message.content.toLowerCase().startsWith(config.prefix)) return; // Ignore if message doesn't start with prefix.

	console.log('passed if-else-if blocks');

	if (message.channel.type === 'dm') handleCmd(message, config.prefix);
	else handleCmd(message, config.prefix);
});

client.on('error', (err: any) => {
	console.log(err);
});

client.on('disconnect', (err: any) => {
	console.log(err);
	client.destroy()
	//.then(k=>client.login(config.botToken));
	process.exit()
});

client.on('debug', (message:any) => {
	if (config.debug) console.debug(message);
});

client.on('reconnecting', () => {
	console.log('[APP] Bot reconnecting...');
});

client.on('ready', async () => {
	client.user!.setActivity(config.prefix + 'help', { type: 'PLAYING' });

	const bannedRows = await query<BanRow[]>(`SELECT * FROM banned`); // refreshes the list of banned users on startup
	console.log({bannedRows});
	bannedRows.forEach((bannedId:any) => {
		if (bannedId.userId !== undefined && bannedId.userId !== null) {
			client.sets.bannedUsers.add(bannedId.userId);
		}
	});

	console.log(`[APP] Bot is ready`);
	client.fullLockdown = false;
});

client.on('messageReactionAdd', async (reaction: any, user: any) => {
	if (reaction.emoji.name !== '🎅') return;

	const exchangeId = reaction.message.id;
	const exchange = (
		await query<ExchangeRow[]>(`SELECT * FROM exchange WHERE exchangeId = ${exchangeId}`)
	)[0];

	// no exchange associated with message
	if (!exchange) return;
	// exchange already started
	else if (exchange.started === 1) return;

	let row = (await query<UserRow[]>(`SELECT * FROM users WHERE userId = ${user.id}`))[0];

	if (!row) {
		let methods = new Methods();
		await methods.createNewUser(user.id);
		row = (await query<UserRow[]>(`SELECT * FROM users WHERE userId = ${user.id}`))[0];
	}

	if (row.exchangeId === 0) {
		await query(`UPDATE users SET exchangeId = ${exchangeId} WHERE userId = ${user.id}`);

		const joinEmbed = new MessageEmbed()
			.setDescription(
				`__Successfully joined <@${exchange.creatorId}>'s Secret Santa!__\nI will let you know when names are drawn!`
			)
			.setColor(config.embeds_color);

		const recipient = await client.users.fetch(user.id);

		recipient.send(joinEmbed);
	}
});

process.on('unhandledRejection', (reason, p) => {
	console.error(
		'[APP][' +
			new Date().toLocaleString(undefined, { timeZone: 'America/New_York' }) +
			'] Unhandled Rejection: ',
		reason
	);
});

client.login(config.botToken);
